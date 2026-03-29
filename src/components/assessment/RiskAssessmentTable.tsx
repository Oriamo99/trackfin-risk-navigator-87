import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle } from "lucide-react";
import type { RiskQuestion } from "@/config/risk-questions";

interface RiskAssessmentTableProps {
  questions: RiskQuestion[];
  checks: Record<string, boolean>;
  onCheckChange: (id: string, checked: boolean) => void;
  score: number;
  riskLevel: string;
  title: string;
  /** Auto-flags from automated verifications. Keys are question IDs. */
  autoFlags?: Record<string, boolean>;
}

export const RiskAssessmentTable = ({
  questions,
  checks,
  onCheckChange,
  score,
  riskLevel,
  title,
  autoFlags,
}: RiskAssessmentTableProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Évaluation des Risques - {title}
        </CardTitle>
        <CardDescription>
          Analyse des risques liés {title === 'Vendeurs' ? 'aux vendeurs' : title === 'Acquéreurs' ? 'aux acquéreurs' : 'à la provenance des fonds'}
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
                <TableHead className="text-center">Réponse</TableHead>
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
                    <div className="flex items-center justify-center gap-2">
                      <RadioGroup
                        value={checks[question.id] ? 'oui' : 'non'}
                        onValueChange={(val) => onCheckChange(question.id, val === 'oui')}
                        className="flex items-center justify-center gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="oui" id={`${question.id}-oui`} />
                          <Label htmlFor={`${question.id}-oui`} className="text-sm font-medium">Oui</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="non" id={`${question.id}-non`} />
                          <Label htmlFor={`${question.id}-non`} className="text-sm font-medium">Non</Label>
                        </div>
                      </RadioGroup>
                      {autoFlags && question.id in autoFlags && (
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            autoFlags[question.id]
                              ? 'bg-red-50 text-red-600 border border-red-200'
                              : 'bg-green-50 text-green-600 border border-green-200'
                          }`}
                          title={autoFlags[question.id] ? 'Risque détecté automatiquement' : 'Vérifié automatiquement — aucun risque'}
                        >
                          Auto
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Score de risque {title} :</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-2xl font-bold">{score}/20</span>
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
