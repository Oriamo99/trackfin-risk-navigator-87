
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertTriangle, CheckCircle, XCircle, Users, Building, Coins } from "lucide-react";

interface Assessment {
  score: number;
  level: string;
}

interface RiskTableProps {
  assessments: {
    vendor: Assessment;
    acquirer: Assessment;
    fundOrigin: Assessment;
  };
  totalScore: number;
  overallRisk: string;
}

const RiskTable = ({ assessments, totalScore, overallRisk }: RiskTableProps) => {
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

  return (
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
  );
};

export default RiskTable;
