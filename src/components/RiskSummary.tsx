
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, AlertTriangle, CheckCircle, XCircle, Users, Building, Coins, FileText, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface Assessment {
  score: number;
  level: string;
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

const RiskSummary = ({ assessments, totalScore, overallRisk }: RiskSummaryProps) => {
  const [documentInfo, setDocumentInfo] = useState({
    date: new Date().toISOString().split('T')[0],
    location: '',
    advisorSignature: '',
    managerSignature: ''
  });

  const categories = [
    {
      name: 'Vendeurs',
      icon: Users,
      ...assessments.vendor
    },
    {
      name: 'Acquéreurs',
      icon: Building,
      ...assessments.acquirer
    },
    {
      name: 'Provenance des fonds',
      icon: Coins,
      ...assessments.fundOrigin
    }
  ];

  const getRecommendation = (risk: string) => {
    switch (risk) {
      case 'Faible':
        return 'Transaction autorisée. Surveillance standard recommandée.';
      case 'Modéré':
        return 'Surveillance renforcée recommandée. Vérifications supplémentaires nécessaires.';
      case 'Élevé':
        return 'Transaction à haut risque. Enquête approfondie requise avant autorisation.';
      default:
        return '';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'Faible':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'Modéré':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'Élevé':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-600" />;
    }
  };

  const handleDocumentInfoChange = (field: string, value: string) => {
    setDocumentInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleExportPDF = () => {
    console.log('Export PDF functionality would be implemented here');
    // Here you would implement the PDF export functionality
    // For now, we'll just log the action
    alert('Fonctionnalité d\'export PDF à implémenter avec une bibliothèque PDF');
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
                        {category.score}/6
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
                    <div className="text-3xl font-bold text-blue-600">{totalScore}/18</div>
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

      {/* Informations du document et signatures */}
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
            {/* Date et lieu */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Date de rédaction</Label>
                <Input
                  id="date"
                  type="date"
                  value={documentInfo.date}
                  onChange={(e) => handleDocumentInfoChange('date', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="location">Lieu</Label>
                <Input
                  id="location"
                  value={documentInfo.location}
                  onChange={(e) => handleDocumentInfoChange('location', e.target.value)}
                  placeholder="Ville, bureau..."
                />
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-dashed border-2 border-gray-300">
                <CardHeader className="text-center">
                  <CardTitle className="text-base">Signature du Conseiller</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Input
                      value={documentInfo.advisorSignature}
                      onChange={(e) => handleDocumentInfoChange('advisorSignature', e.target.value)}
                      placeholder="Nom et prénom du conseiller"
                    />
                    <div className="h-24 border-2 border-dashed border-gray-200 rounded bg-gray-50 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">Zone de signature</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-dashed border-2 border-gray-300">
                <CardHeader className="text-center">
                  <CardTitle className="text-base">Signature du Responsable</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Input
                      value={documentInfo.managerSignature}
                      onChange={(e) => handleDocumentInfoChange('managerSignature', e.target.value)}
                      placeholder="Nom et prénom du responsable"
                    />
                    <div className="h-24 border-2 border-dashed border-gray-200 rounded bg-gray-50 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">Zone de signature</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Export PDF */}
            <div className="text-center pt-4">
              <Button onClick={handleExportPDF} className="bg-red-600 hover:bg-red-700">
                <Download className="h-4 w-4 mr-2" />
                Exporter en PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RiskSummary;
