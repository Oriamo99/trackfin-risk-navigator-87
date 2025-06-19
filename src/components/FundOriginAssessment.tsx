
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Coins, AlertCircle, Upload, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FundOriginAssessmentProps {
  onScoreUpdate: (score: number, level: string) => void;
}

const FundOriginAssessment = ({ onScoreUpdate }: FundOriginAssessmentProps) => {
  const [checks, setChecks] = useState({
    legitimateSource: false,
    unusualPattern: false,
    cashTransaction: false,
    unreliableInfo: false,
    actingForThird: false,
    atypicalOperation: false,
    knownInfractions: false,
    noClientInfo: false
  });

  const [fundData, setFundData] = useState({
    originDescription: '',
    bankDetails: '',
    transactionAmount: '',
    paymentMethod: '',
    justificationDocuments: '',
    additionalNotes: ''
  });

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const questions = [
    {
      id: 'legitimateSource',
      label: 'Source légitime des fonds',
      description: 'Les fonds proviennent d\'une source identifiable et légitime',
      risk: 'Faible'
    },
    {
      id: 'unusualPattern',
      label: 'Schéma de transaction inhabituel',
      description: 'Les transactions présentent des schémas inhabituels ou suspects',
      risk: 'Élevé'
    },
    {
      id: 'cashTransaction',
      label: 'Transaction en espèces importante',
      description: 'Montant important payé en espèces',
      risk: 'Modéré'
    },
    {
      id: 'unreliableInfo',
      label: 'Renseignements incohérents ou non fiables',
      description: 'Les informations fournies sont contradictoires ou douteuses',
      risk: 'Élevé'
    },
    {
      id: 'actingForThird',
      label: 'Client agissant pour un tiers',
      description: 'Le client agit pour le compte d\'une tierce personne',
      risk: 'Modéré'
    },
    {
      id: 'atypicalOperation',
      label: 'Caractéristiques atypiques de l\'opération',
      description: 'Complexité, prix ou rotation atypique de l\'opération',
      risk: 'Élevé'
    },
    {
      id: 'knownInfractions',
      label: 'Client connu pour infractions',
      description: 'Le client est connu pour diverses infractions',
      risk: 'Élevé'
    },
    {
      id: 'noClientInfo',
      label: 'Absence de renseignements du client',
      description: 'Le client ne fournit aucun renseignement demandé',
      risk: 'Élevé'
    }
  ];

  const calculateScore = () => {
    let score = 0;
    if (!checks.legitimateSource) score += 1;
    if (checks.unusualPattern) score += 3;
    if (checks.cashTransaction) score += 2;
    if (checks.unreliableInfo) score += 3;
    if (checks.actingForThird) score += 2;
    if (checks.atypicalOperation) score += 3;
    if (checks.knownInfractions) score += 3;
    if (checks.noClientInfo) score += 3;
    return score;
  };

  const getRiskLevel = (score: number) => {
    if (score === 0) return 'Faible';
    if (score <= 5) return 'Modéré';
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

  const handleInputChange = (field: string, value: string) => {
    setFundData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const score = calculateScore();
  const riskLevel = getRiskLevel(score);

  return (
    <div className="space-y-6">
      {/* Informations sur la provenance des fonds */}
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
                <Label htmlFor="transactionAmount">Montant de la transaction</Label>
                <Input
                  id="transactionAmount"
                  value={fundData.transactionAmount}
                  onChange={(e) => handleInputChange('transactionAmount', e.target.value)}
                  placeholder="Montant en euros"
                />
              </div>
              <div>
                <Label htmlFor="paymentMethod">Mode de paiement</Label>
                <Input
                  id="paymentMethod"
                  value={fundData.paymentMethod}
                  onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                  placeholder="Chèque, virement, espèces..."
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="originDescription">Description de l'origine des fonds</Label>
              <Textarea
                id="originDescription"
                value={fundData.originDescription}
                onChange={(e) => handleInputChange('originDescription', e.target.value)}
                placeholder="Salaire, héritage, vente de bien..."
              />
            </div>

            <div>
              <Label htmlFor="bankDetails">Détails bancaires</Label>
              <Textarea
                id="bankDetails"
                value={fundData.bankDetails}
                onChange={(e) => handleInputChange('bankDetails', e.target.value)}
                placeholder="Banque, IBAN, historique des comptes..."
              />
            </div>

            <div>
              <Label htmlFor="justificationDocuments">Documents justificatifs</Label>
              <Textarea
                id="justificationDocuments"
                value={fundData.justificationDocuments}
                onChange={(e) => handleInputChange('justificationDocuments', e.target.value)}
                placeholder="Liste des documents fournis"
              />
            </div>

            {/* Zone de téléchargement de fichiers */}
            <div>
              <Label htmlFor="fileUpload">Documents joints</Label>
              <div className="mt-2">
                <Input
                  id="fileUpload"
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="mb-2"
                />
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{file.name}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          Supprimer
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liens vers les sites officiels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Vérifications Officielles
          </CardTitle>
          <CardDescription>
            Liens vers les sites officiels pour les vérifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Gel des Avoirs - DG Trésor</h4>
                <p className="text-sm text-gray-600">Vérification des listes de sanctions internationales</p>
              </div>
              <Button variant="outline" asChild>
                <a href="https://gels-avoirs.dgtresor.gouv.fr/" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Accéder
                </a>
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">GAFI - Pays à Haut Risque</h4>
                <p className="text-sm text-gray-600">Liste noire et grise du GAFI</p>
              </div>
              <Button variant="outline" asChild>
                <a href="https://www.fatf-gafi.org/fr/countries/liste-noire-et-liste-gris.html" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Accéder
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Évaluation des risques */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Évaluation des Risques - Provenance des Fonds
          </CardTitle>
          <CardDescription>
            Analyse des risques liés à la provenance des fonds
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
                <span className="font-medium">Score de risque provenance:</span>
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
    </div>
  );
};

export default FundOriginAssessment;
