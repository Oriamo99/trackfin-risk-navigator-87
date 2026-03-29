import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, AlertTriangle, CheckCircle, XCircle, Users, Building, Coins, FileText, Save, Zap } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useGlobalDataContext } from "@/contexts/GlobalDataContext";
import { PdfPreviewModal } from "@/components/assessment/PdfPreviewModal";
import { SignaturePad } from "@/components/forms/SignaturePad";
import { PartyRiskOverview } from "@/components/assessment/PartyRiskOverview";
import { documentInfoSchema } from "@/config/validation-schemas";
import type { DocumentInfoFormData } from "@/config/validation-schemas";
import { partyQuestions } from "@/config/risk-questions";
import { calculateScore, getRiskLevel } from "@/config/risk-scoring";
import type { Assessment, DocumentInfo, AppSnapshot, PartyScoring } from "@/types";
import { emptyDocumentInfo } from "@/types";

function pluralize(count: number, singular: string): string {
  return count === 1 ? `1 ${singular}` : `${count} ${singular}s`;
}

interface RiskSummaryProps {
  assessments: {
    vendor: Assessment;
    acquirer: Assessment;
    fundOrigin: Assessment;
  };
  totalScore: number;
  overallRisk: string;
  apimoPropertyId: number | null;
  onNavigateToTab: (tab: string) => void;
  onApimoUploadSuccess: () => void;
  onResetRequest: () => void;
}

const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="text-sm text-red-500 mt-1">{message}</p> : null;

const RiskSummary = ({ assessments, totalScore, overallRisk, apimoPropertyId, onNavigateToTab, onApimoUploadSuccess, onResetRequest }: RiskSummaryProps) => {
  const { globalData, updateSummaryData, exportAllData } = useGlobalDataContext();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pdfSnapshot, setPdfSnapshot] = useState<AppSnapshot | null>(null);
  const vendorCount = globalData.vendor.parties.length;
  const acquirerCount = globalData.acquirer.parties.length;
  const [documentInfo, setDocumentInfo] = useLocalStorage<DocumentInfo>(
    'riskSummaryDocumentInfo',
    { ...emptyDocumentInfo }
  );

  const vendorScorings: PartyScoring[] = useMemo(() =>
    globalData.vendor.parties.map(party => {
      const score = calculateScore(party.riskChecks, partyQuestions);
      return { partyId: party.id, score, level: getRiskLevel(score) };
    }), [globalData.vendor.parties]);

  const acquirerScorings: PartyScoring[] = useMemo(() =>
    globalData.acquirer.parties.map(party => {
      const score = calculateScore(party.riskChecks, partyQuestions);
      return { partyId: party.id, score, level: getRiskLevel(score) };
    }), [globalData.acquirer.parties]);

  const fastModeAvailable = useMemo(() => {
    const allPartiesVerified = [
      ...globalData.vendor.parties,
      ...globalData.acquirer.parties,
    ].every(p => {
      const vr = p.verificationResult;
      if (!vr?.completedAt) return false;
      if (vr.sanctions.status === 'hit') return false;
      if (vr.gafi.listType === 'black' || vr.gafi.listType === 'grey') return false;
      if (vr.ppe.status === 'declared') return false;
      return true;
    });

    return allPartiesVerified && totalScore <= 5;
  }, [globalData.vendor.parties, globalData.acquirer.parties, totalScore]);

  const handleFastValidation = () => {
    toast.success("Évaluation validée — vous pouvez prévisualiser le PDF");
    document.getElementById('finalization-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const { register, formState: { errors }, trigger, reset } = useForm<DocumentInfoFormData>({
    resolver: zodResolver(documentInfoSchema),
    mode: 'onBlur',
    defaultValues: documentInfo,
  });

  useEffect(() => {
    reset(documentInfo, { keepErrors: true, keepDirty: true, keepTouched: true });
  }, [documentInfo, reset]);

  const docField = (field: keyof DocumentInfoFormData) => {
    const reg = register(field);
    return {
      ...reg,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        reg.onChange(e);
        setDocumentInfo(prev => ({ ...prev, [field]: e.target.value }));
      },
    };
  };

  const categories = [
    { name: `Vendeurs (${pluralize(vendorCount, 'partie')})`, icon: Users, ...assessments.vendor },
    { name: `Acquéreurs (${pluralize(acquirerCount, 'partie')})`, icon: Building, ...assessments.acquirer },
    { name: 'Provenance des fonds', icon: Coins, ...assessments.fundOrigin },
  ];

  const getRecommendation = (risk: string) => {
    switch (risk) {
      case 'Faible':   return 'Transaction autorisée. Surveillance standard recommandée.';
      case 'Modéré':   return 'Surveillance renforcée recommandée. Vérifications supplémentaires nécessaires.';
      case 'Élevé':    return 'Transaction à haut risque. Enquête approfondie requise avant autorisation.';
      default:         return '';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'Faible': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'Modéré': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'Élevé':  return <XCircle className="h-5 w-5 text-red-600" />;
      default:       return <AlertTriangle className="h-5 w-5 text-gray-600" />;
    }
  };

  const handleFinalSave = () => {
    updateSummaryData({
      assessments,
      totalScore,
      overallRisk,
      documentInfo,
      finalSaveTimestamp: new Date().toISOString(),
    });
    toast.success("Enregistrement final effectué avec succès ! Toutes les données ont été sauvegardées.");
  };

  const validateBeforeExport = (): boolean => {
    const warnings: string[] = [];

    const allParties = [...globalData.vendor.parties, ...globalData.acquirer.parties];
    const unverified = allParties.filter(p => !p.verificationResult?.completedAt);
    if (unverified.length > 0) {
      warnings.push(`${unverified.length} partie(s) non vérifiée(s)`);
    }

    if (!globalData.vendor.parties.some(p =>
      p.personType === 'physical' ? !!(p.physicalPerson.lastName && p.physicalPerson.firstName) : !!p.legalEntity.companyName
    )) {
      warnings.push("Aucun vendeur identifié");
    }
    if (!globalData.acquirer.parties.some(p =>
      p.personType === 'physical' ? !!(p.physicalPerson.lastName && p.physicalPerson.firstName) : !!p.legalEntity.companyName
    )) {
      warnings.push("Aucun acquéreur identifié");
    }

    if (warnings.length > 0) {
      return window.confirm(
        `Attention :\n• ${warnings.join('\n• ')}\n\nVoulez-vous tout de même générer le PDF ?`
      );
    }
    return true;
  };

  const handlePreviewPDF = async () => {
    const valid = await trigger();
    if (!valid) {
      toast.error("Veuillez remplir tous les champs obligatoires avant de prévisualiser");
      return;
    }

    if (!validateBeforeExport()) return;

    const snapshot = exportAllData();
    snapshot.global.summary.assessments = assessments;
    snapshot.global.summary.totalScore = totalScore;
    snapshot.global.summary.overallRisk = overallRisk;
    snapshot.documentInfo = documentInfo;

    setPdfSnapshot(snapshot);
    setPreviewOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Résumé de l'évaluation des risques
          </CardTitle>
          <CardDescription>
            Synthèse complète de l'analyse de risque de blanchiment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Catégorie</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead className="text-center">Niveau de risque</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <TableRow key={category.name}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {category.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {category.score}/20
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          {getRiskIcon(category.level)}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            category.level === 'Faible' ? 'bg-green-100 text-green-800' :
                            category.level === 'Modéré' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {category.level}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <div className="border-t pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-2">
                  <CardHeader className="text-center">
                    <CardTitle className="text-lg">Score Total</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{totalScore}/60</div>
                  </CardContent>
                </Card>

                <Card className={`border-2 ${
                  overallRisk === 'Faible' ? 'border-green-200 bg-green-50' :
                  overallRisk === 'Modéré' ? 'border-yellow-200 bg-yellow-50' :
                  'border-red-200 bg-red-50'
                }`}>
                  <CardHeader className="text-center">
                    <CardTitle className="text-lg">Risque Global</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      {getRiskIcon(overallRisk)}
                      <span className="text-2xl font-bold">{overallRisk}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg text-blue-900">Recommandation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-800 font-medium">{getRecommendation(overallRisk)}</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Per-party risk detail */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Détail des risques par partie
          </CardTitle>
          <CardDescription>
            Cliquez sur "Modifier" pour ajuster les critères de risque d'une partie
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PartyRiskOverview
            parties={globalData.vendor.parties}
            scorings={vendorScorings}
            sideLabel="Vendeur"
            tabValue="vendor"
            onNavigateToTab={onNavigateToTab}
          />
          <Separator className="my-4" />
          <PartyRiskOverview
            parties={globalData.acquirer.parties}
            scorings={acquirerScorings}
            sideLabel="Acquéreur"
            tabValue="acquirer"
            onNavigateToTab={onNavigateToTab}
          />
        </CardContent>
      </Card>

      {/* Fast validation mode */}
      {fastModeAvailable && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Validation rapide disponible</p>
                  <p className="text-sm text-green-700">
                    Toutes les vérifications sont conformes. Vous pouvez valider l'évaluation
                    et passer directement à la prévisualisation du PDF.
                  </p>
                </div>
              </div>
              <Button
                onClick={handleFastValidation}
                className="bg-green-600 hover:bg-green-700"
              >
                <Zap className="h-4 w-4 mr-2" />
                Validation rapide
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card id="finalization-section">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Finalisation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-md">
            <Label htmlFor="redactorName">Rédigé par *</Label>
            <Input
              id="redactorName"
              {...docField('redactorName')}
              value={documentInfo.redactorName}
              placeholder="Nom et prénom de l'agent"
            />
            <FieldError message={errors.redactorName?.message} />
          </div>
          <div className="max-w-md mt-4">
            <Label>Signature</Label>
            <SignaturePad
              value={documentInfo.signature ?? null}
              onChange={(sig) => setDocumentInfo(prev => ({ ...prev, signature: sig }))}
              height={120}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 pt-4">
        <Button onClick={handleFinalSave} className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
          <Save className="h-4 w-4 mr-2" />
          Enregistrement final
        </Button>
        <Button onClick={handlePreviewPDF} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
          <FileText className="h-4 w-4 mr-2" />
          Prévisualiser le PDF
        </Button>
      </div>

      <div className="text-center mt-6">
        <Button
          variant="ghost"
          className="text-gray-500"
          onClick={onResetRequest}
        >
          Réinitialiser et commencer un nouveau dossier
        </Button>
      </div>

      {pdfSnapshot && (
        <PdfPreviewModal
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          snapshot={pdfSnapshot}
          apimoPropertyId={apimoPropertyId}
          onApimoUploadSuccess={() => {
            setPreviewOpen(false);
            onApimoUploadSuccess();
          }}
        />
      )}
    </div>
  );
};

export default RiskSummary;
