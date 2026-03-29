import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, AlertTriangle, CheckCircle, XCircle, Users, Building, Coins, FileText, Download, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useGlobalData } from "@/hooks/useGlobalData";
import { generatePDF } from "@/lib/pdf-export";
import { documentInfoSchema } from "@/config/validation-schemas";
import type { DocumentInfoFormData } from "@/config/validation-schemas";
import type { Assessment, DocumentInfo } from "@/types";
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
}

const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="text-sm text-red-500 mt-1">{message}</p> : null;

const RiskSummary = ({ assessments, totalScore, overallRisk }: RiskSummaryProps) => {
  const { globalData, updateSummaryData, exportAllData } = useGlobalData();
  const vendorCount = globalData.vendor.parties.length;
  const acquirerCount = globalData.acquirer.parties.length;
  const [documentInfo, setDocumentInfo] = useLocalStorage<DocumentInfo>(
    'riskSummaryDocumentInfo',
    {
      ...emptyDocumentInfo,
      date: new Date().toISOString().split('T')[0],
    }
  );

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

  const handleExportPDF = async () => {
    const valid = await trigger();
    if (!valid) {
      toast.error("Veuillez remplir tous les champs obligatoires avant d'exporter");
      return;
    }
    try {
      const snapshot = exportAllData();
      snapshot.global.summary.assessments = assessments;
      snapshot.global.summary.totalScore = totalScore;
      snapshot.global.summary.overallRisk = overallRisk;
      snapshot.documentInfo = documentInfo;
      generatePDF(snapshot);
      toast.success("PDF exporté avec succès !");
    } catch (error) {
      console.error("Erreur export PDF:", error);
      toast.error("Erreur lors de l'export PDF. Veuillez réessayer.");
    }
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Finalisation du Document
          </CardTitle>
          <CardDescription>
            Informations et signatures pour la validation du rapport
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Date de rédaction *</Label>
                <Input
                  id="date"
                  type="date"
                  {...docField('date')}
                  value={documentInfo.date}
                />
                <FieldError message={errors.date?.message} />
              </div>
              <div>
                <Label htmlFor="location">Lieu *</Label>
                <Input
                  id="location"
                  {...docField('location')}
                  value={documentInfo.location}
                  placeholder="Ville, bureau..."
                />
                <FieldError message={errors.location?.message} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-dashed border-2 border-gray-300">
                <CardHeader className="text-center">
                  <CardTitle className="text-base">Signature du Conseiller *</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Input
                      {...docField('advisorSignature')}
                      value={documentInfo.advisorSignature}
                      placeholder="Nom et prénom du conseiller"
                    />
                    <FieldError message={errors.advisorSignature?.message} />
                    <div className="h-24 border-2 border-dashed border-gray-200 rounded bg-gray-50 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">Zone de signature</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-dashed border-2 border-gray-300">
                <CardHeader className="text-center">
                  <CardTitle className="text-base">Signature du Responsable *</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Input
                      {...docField('managerSignature')}
                      value={documentInfo.managerSignature}
                      placeholder="Nom et prénom du responsable"
                    />
                    <FieldError message={errors.managerSignature?.message} />
                    <div className="h-24 border-2 border-dashed border-gray-200 rounded bg-gray-50 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">Zone de signature</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap justify-center gap-4 pt-4">
        <Button onClick={handleFinalSave} className="bg-green-600 hover:bg-green-700">
          <Save className="h-4 w-4 mr-2" />
          Enregistrement final
        </Button>
        <Button onClick={handleExportPDF} className="bg-red-600 hover:bg-red-700">
          <Download className="h-4 w-4 mr-2" />
          Exporter PDF
        </Button>
      </div>
    </div>
  );
};

export default RiskSummary;
