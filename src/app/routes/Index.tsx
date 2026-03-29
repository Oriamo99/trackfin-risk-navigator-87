import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Shield, Users, Building, Coins, AlertTriangle, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import PartyAssessment from "@/components/assessment/PartyAssessment";
import FundOriginAssessment from "@/components/assessment/FundOriginAssessment";
import RiskSummary from "@/components/assessment/RiskSummary";
import { PropertySelector } from "@/components/apimo/PropertySelector";
import { useGlobalData } from "@/hooks/useGlobalData";
import { transactionInfoSchema } from "@/config/validation-schemas";
import type { TransactionInfoFormData } from "@/config/validation-schemas";
import { getGlobalRiskLevel } from "@/config/risk-scoring";
import { isApimoConfigured } from "@/config/apimo";
import { apimoService } from "@/services/apimo";
import { mapPropertyToTransaction, mapContactToParty, getPropertyAmount } from "@/services/apimo-mapper";
import type { ApimoProperty } from "@/types/apimo";
import type { FundData, DocumentInfo, GlobalAppData, Party } from "@/types";
import { defaultGlobalAppData, emptyDocumentInfo, createEmptyParty } from "@/types";
import { toast } from "sonner";

// ─── App modes ───────────────────────────────────────────────────────────

type AppMode = 'select-property' | 'form';

// ─── Completeness helpers (read-only from localStorage) ──────────────────

function readLS<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function isPartyComplete(party: { personType: string; physicalPerson: { lastName: string; firstName: string }; legalEntity: { companyName: string } }): boolean {
  return party.personType === 'physical'
    ? !!(party.physicalPerson.lastName && party.physicalPerson.firstName)
    : !!party.legalEntity.companyName;
}

function useTabCompleteness() {
  const [status, setStatus] = useState({ vendor: false, acquirer: false, funds: false, summary: false });

  useEffect(() => {
    const check = () => {
      const global = readLS<GlobalAppData>('tracfinGlobalData', defaultGlobalAppData);

      const vendorOk = global.vendor.parties.some(isPartyComplete);
      const acquirerOk = global.acquirer.parties.some(isPartyComplete);

      const fundData = readLS<FundData>('fundData', { originDescription: '', bankDetails: '', transactionAmount: '', paymentMethod: '', justificationDocuments: '', additionalNotes: '', bankLoan: '', lenderBank: '' });
      const fundsOk = !!(fundData.transactionAmount && fundData.paymentMethod && fundData.originDescription);

      const docInfo = readLS<DocumentInfo>('riskSummaryDocumentInfo', { ...emptyDocumentInfo });
      const summaryOk = !!(docInfo.date && docInfo.location && docInfo.advisorSignature && docInfo.managerSignature);

      setStatus({ vendor: vendorOk, acquirer: acquirerOk, funds: fundsOk, summary: summaryOk });
    };

    check();
    window.addEventListener('storage', check);
    const interval = setInterval(check, 2000);
    return () => { window.removeEventListener('storage', check); clearInterval(interval); };
  }, []);

  return status;
}

const CompleteDot = ({ complete }: { complete: boolean }) => (
  <span className={`inline-block w-2 h-2 rounded-full ml-2 ${complete ? 'bg-green-500' : 'bg-red-400'}`} />
);

const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="text-sm text-red-500 mt-1">{message}</p> : null;

// ─── Main page ───────────────────────────────────────────────────────────

const Index = () => {
  // Determine initial mode: property selector if Apimo is configured, otherwise form
  const [appMode, setAppMode] = useState<AppMode>(() =>
    isApimoConfigured() ? 'select-property' : 'form'
  );
  const [selectedProperty, setSelectedProperty] = useState<ApimoProperty | null>(null);

  const { globalData, updateTransactionInfo, updateSummaryData, setGlobalData } = useGlobalData();
  const [assessments, setAssessments] = useState({
    vendor: { score: 0, level: 'Faible' },
    acquirer: { score: 0, level: 'Faible' },
    fundOrigin: { score: 0, level: 'Faible' }
  });

  const [transactionType, setTransactionType] = useState(globalData.transactionInfo.transactionType || '');
  const [propertyType, setPropertyType] = useState(globalData.transactionInfo.propertyType || '');

  const { formState: { errors }, setValue } = useForm<TransactionInfoFormData>({
    resolver: zodResolver(transactionInfoSchema),
    mode: 'onBlur',
    defaultValues: {
      transactionType: (globalData.transactionInfo.transactionType || undefined) as TransactionInfoFormData['transactionType'] | undefined,
      propertyType: (globalData.transactionInfo.propertyType || undefined) as TransactionInfoFormData['propertyType'] | undefined,
    },
  });

  const tabStatus = useTabCompleteness();

  useEffect(() => {
    updateTransactionInfo({ transactionType, propertyType });
  }, [transactionType, propertyType, updateTransactionInfo]);

  const updateAssessment = (type: string, score: number, level: string) => {
    setAssessments(prev => {
      const newAssessments = {
        ...prev,
        [type]: { score, level }
      };

      const total = newAssessments.vendor.score + newAssessments.acquirer.score + newAssessments.fundOrigin.score;
      updateSummaryData({
        assessments: newAssessments,
        totalScore: total,
        overallRisk: getGlobalRiskLevel(total),
      });

      return newAssessments;
    });
  };

  // ─── Apimo property selection handler ────────────────────────────────

  const handlePropertySelected = useCallback(async (property: ApimoProperty) => {
    setSelectedProperty(property);

    try {
      // Fetch full details (contacts included)
      const fullProperty = await apimoService.getProperty(property.id);

      // Map transaction info (category → transactionType, type → propertyType)
      const txInfo = mapPropertyToTransaction(fullProperty);
      if (txInfo.transactionType) {
        setTransactionType(txInfo.transactionType);
        setValue('transactionType', txInfo.transactionType as TransactionInfoFormData['transactionType'], { shouldValidate: true });
      }
      if (txInfo.propertyType) {
        setPropertyType(txInfo.propertyType);
        setValue('propertyType', txInfo.propertyType as TransactionInfoFormData['propertyType'], { shouldValidate: true });
      }

      // Fetch owner contact if available (linked by ID, not embedded)
      const vendors: Party[] = [];
      if (fullProperty.owner) {
        try {
          const ownerContact = await apimoService.getContact(fullProperty.owner);
          vendors.push(mapContactToParty(ownerContact));
        } catch {
          // Owner contact fetch failed — leave vendor empty
        }
      }

      // Pre-fill the global data with mapped parties
      setGlobalData(prev => ({
        ...prev,
        vendor: { parties: vendors.length > 0 ? vendors : [createEmptyParty()] },
        // Acquirer info is not available in Apimo property data
        acquirer: { parties: [createEmptyParty()] },
      }));

      // Pre-fill fund amount if available
      const amount = getPropertyAmount(fullProperty);
      if (amount) {
        const stored = readLS<FundData>('fundData', { originDescription: '', bankDetails: '', transactionAmount: '', paymentMethod: '', justificationDocuments: '', additionalNotes: '', bankLoan: '', lenderBank: '' });
        window.localStorage.setItem('fundData', JSON.stringify({ ...stored, transactionAmount: amount }));
      }

      toast.success('Données Apimo importées avec succès !');
    } catch {
      // If detail fetch fails, still proceed with basic data
      toast.error('Impossible de charger les détails du bien. Formulaire ouvert en mode partiel.');
    }

    setAppMode('form');
  }, [setGlobalData, setValue]);

  // ─── Mode: Property selector ─────────────────────────────────────────

  if (appMode === 'select-property') {
    return (
      <PropertySelector
        onSelect={handlePropertySelected}
        onManualMode={() => setAppMode('form')}
      />
    );
  }

  // ─── Mode: Form ──────────────────────────────────────────────────────

  const totalScore = assessments.vendor.score + assessments.acquirer.score + assessments.fundOrigin.score;
  const overallRisk = getGlobalRiskLevel(totalScore);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900 tracking-widest">T R A C F I N</h1>
          </div>
          <p className="text-xl text-gray-600 mb-2">Lutte contre le blanchiment des capitaux</p>
          <p className="text-lg text-gray-500">Évaluation des risques et classification</p>

          {/* Back to property selector */}
          {isApimoConfigured() && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 text-gray-500"
              onClick={() => setAppMode('select-property')}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Changer de bien
            </Button>
          )}

          {/* Show selected property reference */}
          {selectedProperty && (
            <p className="text-sm text-blue-600 mt-1">
              Bien Apimo : Réf. {selectedProperty.reference || selectedProperty.id}
              {selectedProperty.city?.name ? ` — ${selectedProperty.city.name}` : ''}
            </p>
          )}
        </div>

        {/* Transaction and Property Selection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Informations de la Transaction
            </CardTitle>
            <CardDescription>
              Sélectionnez le type de transaction et les caractéristiques du bien
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="transactionType">Type de transaction *</Label>
                <Select
                  value={transactionType}
                  onValueChange={(v) => {
                    setTransactionType(v);
                    setValue('transactionType', v as TransactionInfoFormData['transactionType'], { shouldValidate: true });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez le type de transaction" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vente">Vente</SelectItem>
                    <SelectItem value="location">Location</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError message={errors.transactionType?.message} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="propertyType">Type de bien *</Label>
                <Select
                  value={propertyType}
                  onValueChange={(v) => {
                    setPropertyType(v);
                    setValue('propertyType', v as TransactionInfoFormData['propertyType'], { shouldValidate: true });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez le type de bien" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maison">Maison</SelectItem>
                    <SelectItem value="appartement">Appartement</SelectItem>
                    <SelectItem value="garage">Garage</SelectItem>
                    <SelectItem value="commerce">Commerce</SelectItem>
                    <SelectItem value="terrain">Terrain</SelectItem>
                    <SelectItem value="bureau">Bureau</SelectItem>
                    <SelectItem value="entrepot">Entrepôt</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError message={errors.propertyType?.message} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Overview */}
        <Card className="mb-8 border-2">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <AlertTriangle className="h-6 w-6" />
              Niveau de risque global
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-xl font-bold ${
                overallRisk === 'Faible' ? 'bg-green-100 text-green-800' :
                overallRisk === 'Modéré' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {overallRisk === 'Faible' ? <CheckCircle className="h-6 w-6" /> :
                 overallRisk === 'Modéré' ? <AlertTriangle className="h-6 w-6" /> :
                 <XCircle className="h-6 w-6" />}
                {overallRisk}
              </div>
              <p className="text-gray-600 mt-2">Score total: {totalScore}/60</p>
            </div>
          </CardContent>
        </Card>

        {/* Assessment Tabs */}
        <Tabs defaultValue="vendor" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="vendor" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Vendeurs
              <CompleteDot complete={tabStatus.vendor} />
            </TabsTrigger>
            <TabsTrigger value="acquirer" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Acquéreurs
              <CompleteDot complete={tabStatus.acquirer} />
            </TabsTrigger>
            <TabsTrigger value="funds" className="flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Provenance des fonds
              <CompleteDot complete={tabStatus.funds} />
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Résumé
              <CompleteDot complete={tabStatus.summary} />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vendor">
            <PartyAssessment partyType="vendor" onScoreUpdate={(score, level) => updateAssessment('vendor', score, level)} />
          </TabsContent>

          <TabsContent value="acquirer">
            <PartyAssessment partyType="acquirer" onScoreUpdate={(score, level) => updateAssessment('acquirer', score, level)} />
          </TabsContent>

          <TabsContent value="funds">
            <FundOriginAssessment onScoreUpdate={(score, level) => updateAssessment('fundOrigin', score, level)} />
          </TabsContent>

          <TabsContent value="summary">
            <RiskSummary assessments={assessments} totalScore={totalScore} overallRisk={overallRisk} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
