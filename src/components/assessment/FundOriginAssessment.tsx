import { useState, useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Coins, Save, AlertCircle, AlertTriangle, CheckCircle, XCircle, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { RiskAssessmentTable } from "@/components/assessment/RiskAssessmentTable";
import { FundsDocumentChecklist } from "@/components/documents/FundsDocumentChecklist";
import { fundOriginQuestions } from "@/config/risk-questions";
import { calculateScore, getRiskLevel } from "@/config/risk-scoring";
import { fundDataSchema } from "@/config/validation-schemas";
import type { FundDataFormData } from "@/config/validation-schemas";
import { defaultFundRiskChecks, DEFAULT_FUNDS_DOCUMENT_CHECKS } from "@/types";
import type { FundData, FundsDocumentChecks } from "@/types";

interface FundOriginAssessmentProps {
  onScoreUpdate: (score: number, level: string) => void;
}

const paymentMethods = [
  { value: 'cheque', label: 'Chèque' },
  { value: 'virement', label: 'Virement bancaire' },
  { value: 'especes', label: 'Espèces' },
  { value: 'autre', label: 'Autre' },
];

const fundOrigins = [
  { value: 'salaire', label: 'Salaire' },
  { value: 'heritage', label: 'Héritage' },
  { value: 'vente_bien', label: 'Vente de bien' },
  { value: 'epargne', label: 'Épargne' },
  { value: 'investissement', label: 'Investissement' },
  { value: 'pret_bancaire', label: 'Prêt bancaire' },
  { value: 'autre', label: 'Autre' },
];

const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="text-sm text-red-500 mt-1">{message}</p> : null;

const RiskBadge = ({ level }: { level: string }) => {
  const cls = level === 'Faible' ? 'bg-green-100 text-green-800'
    : level === 'Modéré' ? 'bg-yellow-100 text-yellow-800'
    : 'bg-red-100 text-red-800';
  const Icon = level === 'Faible' ? CheckCircle : level === 'Modéré' ? AlertTriangle : XCircle;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      <Icon className="h-3 w-3" />
      {level}
    </span>
  );
};

const FundOriginAssessment = ({ onScoreUpdate }: FundOriginAssessmentProps) => {
  const [checks, setChecks] = useLocalStorage<Record<string, boolean>>('fundOriginChecks', { ...defaultFundRiskChecks });
  const [fundData, setFundData] = useLocalStorage<FundData>('fundData', {
    originDescription: '',
    bankDetails: '',
    transactionAmount: '',
    paymentMethod: '',
    justificationDocuments: '',
    additionalNotes: '',
    bankLoan: '',
    lenderBank: '',
  });

  const [fundsDocChecks, setFundsDocChecks] = useLocalStorage<FundsDocumentChecks>('fundsDocumentChecks', { ...DEFAULT_FUNDS_DOCUMENT_CHECKS });

  const { register, formState: { errors }, setValue, watch, reset } = useForm<FundDataFormData>({
    resolver: zodResolver(fundDataSchema),
    mode: 'onBlur',
    defaultValues: fundData,
  });

  const bankLoanValue = watch('bankLoan');

  useEffect(() => {
    reset(fundData, { keepErrors: true, keepDirty: true, keepTouched: true });
  }, [fundData, reset]);

  // Fund pre-checking: auto-flag based on fund data
  const [autoFlags, setAutoFlags] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const newFlags: Record<string, boolean> = {};

    // legitimateSource: true if fund origin is identified
    const hasLegitimateSource =
      (fundData.bankLoan === 'oui' && fundData.lenderBank.trim() !== '') ||
      (fundData.originDescription !== '' && fundData.originDescription !== 'autre');

    if (hasLegitimateSource) {
      newFlags.legitimateSource = true;
    }

    // cashTransaction: true if payment method is cash
    if (fundData.paymentMethod === 'especes') {
      newFlags.cashTransaction = true;
    }

    setAutoFlags(newFlags);

    // Apply flags to checks
    const updatedChecks = { ...checks };
    let changed = false;

    for (const [questionId, flagValue] of Object.entries(newFlags)) {
      if (updatedChecks[questionId] !== flagValue) {
        updatedChecks[questionId] = flagValue;
        changed = true;
      }
    }

    if (changed) {
      setChecks(updatedChecks);
    }
  }, [fundData.bankLoan, fundData.lenderBank, fundData.originDescription, fundData.paymentMethod]);

  const autoFilledCount = useMemo(() => Object.keys(autoFlags).length, [autoFlags]);

  const score = calculateScore(checks, fundOriginQuestions);
  const riskLevel = getRiskLevel(score);

  const stableOnScoreUpdate = useCallback(onScoreUpdate, [onScoreUpdate]);

  useEffect(() => {
    stableOnScoreUpdate(score, riskLevel);
  }, [score, riskLevel, stableOnScoreUpdate]);

  const handleCheck = (id: string, checked: boolean) => {
    setChecks(prev => ({ ...prev, [id]: checked }));
  };

  const handleInputChange = (field: string, value: string) => {
    setFundData(prev => ({ ...prev, [field]: value }));
  };

  const handleAmountChange = (value: string) => {
    const formatted = Intl.NumberFormat('fr-FR', { useGrouping: true, maximumFractionDigits: 0 })
      .format(Number(value.replace(/\D/g, '')) || 0);
    const newValue = value.replace(/\D/g, '') === '' ? '' : formatted;
    setFundData(prev => ({ ...prev, transactionAmount: newValue }));
    setValue('transactionAmount', newValue, { shouldValidate: true });
  };

  const fundField = (field: keyof FundDataFormData) => {
    const reg = register(field);
    return {
      ...reg,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        reg.onChange(e);
        handleInputChange(field, e.target.value);
      },
    };
  };

  const handleSave = () => {
    toast.success("Données de provenance des fonds sauvegardées avec succès !");
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <FundsDocumentChecklist
          checklist={fundsDocChecks}
          onChange={setFundsDocChecks}
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Informations sur la Provenance des Fonds
            </CardTitle>
            <CardDescription>
              Détails sur l'origine et la nature des fonds utilisés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="transactionAmount">Montant de la transaction (€) *</Label>
                  <Input
                    id="transactionAmount"
                    value={fundData.transactionAmount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    onBlur={() => register('transactionAmount').onBlur({ target: { name: 'transactionAmount', value: fundData.transactionAmount } } as React.FocusEvent<HTMLInputElement>)}
                    placeholder="Exemple: 250 000"
                  />
                  <FieldError message={errors.transactionAmount?.message} />
                </div>
                <div>
                  <Label htmlFor="paymentMethod">Mode de paiement *</Label>
                  <Select
                    value={fundData.paymentMethod}
                    onValueChange={(value) => {
                      handleInputChange('paymentMethod', value);
                      setValue('paymentMethod', value, { shouldValidate: true });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le mode de paiement" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((m) => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError message={errors.paymentMethod?.message} />
                </div>
              </div>

              <div>
                <Label htmlFor="originDescription">Origine des fonds *</Label>
                <Select
                  value={fundData.originDescription}
                  onValueChange={(value) => {
                    handleInputChange('originDescription', value);
                    setValue('originDescription', value, { shouldValidate: true });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner l'origine des fonds" />
                  </SelectTrigger>
                  <SelectContent>
                    {fundOrigins.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError message={errors.originDescription?.message} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Présence d'un prêt bancaire</Label>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant={fundData.bankLoan === 'oui' ? 'default' : 'outline'}
                      onClick={() => {
                        handleInputChange('bankLoan', 'oui');
                        setValue('bankLoan', 'oui', { shouldValidate: true });
                      }}
                      className="flex-1"
                    >
                      Oui
                    </Button>
                    <Button
                      variant={fundData.bankLoan === 'non' ? 'default' : 'outline'}
                      onClick={() => {
                        handleInputChange('bankLoan', 'non');
                        setValue('bankLoan', 'non', { shouldValidate: true });
                        setValue('lenderBank', '', { shouldValidate: true });
                      }}
                      className="flex-1"
                    >
                      Non
                    </Button>
                  </div>
                </div>
                {bankLoanValue === 'oui' && (
                  <div>
                    <Label htmlFor="lenderBank">Banque prêteuse *</Label>
                    <Input
                      id="lenderBank"
                      {...fundField('lenderBank')}
                      value={fundData.lenderBank}
                      placeholder="Nom de la banque prêteuse"
                    />
                    <FieldError message={errors.lenderBank?.message} />
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="bankDetails">Détails bancaires</Label>
                <Textarea
                  id="bankDetails"
                  {...fundField('bankDetails')}
                  value={fundData.bankDetails}
                  placeholder="Banque, IBAN, historique des comptes..."
                />
              </div>

              <div>
                <Label htmlFor="justificationDocuments">Documents justificatifs</Label>
                <Textarea
                  id="justificationDocuments"
                  {...fundField('justificationDocuments')}
                  value={fundData.justificationDocuments}
                  placeholder="Liste des documents fournis"
                />
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Risk profile indicator */}
        {riskLevel === 'Faible' && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm">
            <CheckCircle className="h-4 w-4" />
            <span>Profil de risque probable : <strong>Faible</strong> — basé sur les données saisies</span>
          </div>
        )}
        {riskLevel === 'Modéré' && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>Profil de risque probable : <strong>Modéré</strong> — vérifiez les critères de risque</span>
          </div>
        )}
        {riskLevel === 'Élevé' && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
            <XCircle className="h-4 w-4" />
            <span>Profil de risque probable : <strong>Élevé</strong> — vigilance renforcée requise</span>
          </div>
        )}

        <Collapsible>
          <div className="rounded-lg border p-4">
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between text-left">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                  <div>
                    <span className="font-medium">
                      Évaluation des risques — Provenance des fonds
                    </span>
                    <p className="text-sm text-gray-500">
                      {autoFilledCount > 0
                        ? `${autoFilledCount} critère(s) pré-rempli(s) automatiquement`
                        : 'Aucun critère pré-rempli — évaluation manuelle requise'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold">{score}/20</span>
                  <RiskBadge level={riskLevel} />
                  <ChevronDown className="h-4 w-4 text-gray-400 transition-transform [[data-state=open]_&]:rotate-180" />
                </div>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <RiskAssessmentTable
                questions={fundOriginQuestions}
                checks={checks}
                onCheckChange={handleCheck}
                score={score}
                riskLevel={riskLevel}
                title="Provenance des Fonds"
                autoFlags={autoFlags}
              />
            </CollapsibleContent>
          </div>
        </Collapsible>

        <div className="text-center">
          <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
            <Save className="h-4 w-4 mr-2" />
            Sauvegarder les données de provenance
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default FundOriginAssessment;
