
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, AlertCircle } from "lucide-react";

interface VendorAssessmentProps {
  onScoreUpdate: (score: number, level: string) => void;
}

const VendorAssessment = ({ onScoreUpdate }: VendorAssessmentProps) => {
  const [checks, setChecks] = useState({
    identityVerified: false,
    sanctionsList: false,
    highRiskCountry: false
  });

  const questions = [
    {
      id: 'identityVerified',
      label: 'Identité du vendeur vérifiée',
      description: 'Documents d\'identité valides et vérifiés',
      risk: 'Faible'
    },
    {
      id: 'sanctionsList',
      label: 'Présence sur listes de sanctions',
      description: 'Vérification des listes de sanctions internationales',
      risk: 'Élevé'
    },
    {
      id: 'highRiskCountry',
      label: 'Pays à haut risque',
      description: 'Vendeur originaire d\'un pays à haut risque',
      risk: 'Modéré'
    }
  ];

  const calculateScore = () => {
    let score = 0;
    if (!checks.identityVerified) score += 1;
    if (checks.sanctionsList) score += 3;
    if (checks.highRiskCountry) score += 2;
    return score;
  };

  const getRiskLevel = (score: number) => {
    if (score === 0) return 'Faible';
    if (score <= 2) return 'Modéré';
    return 'Élevé';
  };

  useEffect(() => {
    const score = calculateScore();
    const level = getRiskLevel(score);
    onScoreUpdate(score, level);
  }, [checks, onScoreUpdate]);

  const handleCheck = (id: string, checked: boolean) => {
    setChecks(prev => ({ ...prev, [id]: checked }));
  };

  const score = calculateScore();
  const riskLevel = getRiskLevel(score);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Évaluation des Vendeurs
        </CardTitle>
        <CardDescription>
          Analyse des risques liés aux vendeurs impliqués dans la transaction
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Critère d'évaluation</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Niveau de risque</TableHead>
                <TableHead className="text-center">Oui/Non</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((question) => (
                <TableRow key={question.id}>
                  <TableCell className="font-medium">{question.label}</TableCell>
                  <TableCell className="text-sm text-gray-600">{question.description}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      question.risk === 'Faible' ? 'bg-green-100 text-green-800' :
                      question.risk === 'Modéré' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {question.risk}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={checks[question.id as keyof typeof checks]}
                      onCheckedChange={(checked) => handleCheck(question.id, checked as boolean)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Score de risque vendeur:</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-2xl font-bold">{score}/6</span>
              <span className={`px-3 py-1 rounded-full font-medium ${
                riskLevel === 'Faible' ? 'bg-green-100 text-green-800' :
                riskLevel === 'Modéré' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {riskLevel}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VendorAssessment;
