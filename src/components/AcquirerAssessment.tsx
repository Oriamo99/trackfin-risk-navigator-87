
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building, AlertCircle } from "lucide-react";

interface AcquirerAssessmentProps {
  onScoreUpdate: (score: number, level: string) => void;
}

const AcquirerAssessment = ({ onScoreUpdate }: AcquirerAssessmentProps) => {
  const [checks, setChecks] = useState({
    companyRegistered: false,
    beneficialOwners: false,
    suspiciousActivity: false
  });

  const questions = [
    {
      id: 'companyRegistered',
      label: 'Société enregistrée légalement',
      description: 'Vérification du registre des entreprises',
      risk: 'Faible'
    },
    {
      id: 'beneficialOwners',
      label: 'Bénéficiaires effectifs identifiés',
      description: 'Identification claire des bénéficiaires effectifs',
      risk: 'Modéré'
    },
    {
      id: 'suspiciousActivity',
      label: 'Activités suspectes détectées',
      description: 'Historique d\'activités suspectes ou frauduleuses',
      risk: 'Élevé'
    }
  ];

  const calculateScore = () => {
    let score = 0;
    if (!checks.companyRegistered) score += 1;
    if (!checks.beneficialOwners) score += 2;
    if (checks.suspiciousActivity) score += 3;
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
          <Building className="h-5 w-5" />
          Évaluation des Acquéreurs
        </CardTitle>
        <CardDescription>
          Analyse des risques liés aux acquéreurs impliqués dans la transaction
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
              <span className="font-medium">Score de risque acquéreur:</span>
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

export default AcquirerAssessment;
