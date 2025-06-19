
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Coins, AlertCircle, CreditCard, Banknote, Building } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface FundOriginAssessmentProps {
  onScoreUpdate: (score: number, level: string) => void;
}

const FundOriginAssessment = ({ onScoreUpdate }: FundOriginAssessmentProps) => {
  const [checks, setChecks] = useState({
    sourceDocumented: false,
    cashTransaction: false,
    unexpectedSource: false
  });

  const [fundData, setFundData] = useState({
    propertyAddress: '',
    propertyCity: '',
    propertyPostalCode: '',
    operationType: 'vente', // vente ou location
    operationAmount: '',
    paymentMethod: '',
    bankDetails: {
      bankName: '',
      accountHolder: '',
      iban: '',
      swiftCode: ''
    },
    fundOrigin: {
      source: '',
      description: '',
      justification: '',
      previousTransactions: ''
    }
  });

  const questions = [
    {
      id: 'sourceDocumented',
      label: 'Source des fonds documentée',
      description: 'Justificatifs de l\'origine des fonds fournis',
      risk: 'Faible'
    },
    {
      id: 'cashTransaction',
      label: 'Transaction en espèces importante',
      description: 'Montant élevé payé en espèces',
      risk: 'Élevé'
    },
    {
      id: 'unexpectedSource',
      label: 'Source inattendue des fonds',
      description: 'Origine des fonds incompatible avec le profil',
      risk: 'Modéré'
    }
  ];

  const calculateScore = () => {
    let score = 0;
    if (!checks.sourceDocumented) score += 2;
    if (checks.cashTransaction) score += 3;
    if (checks.unexpectedSource) score += 1;
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

  const handleInputChange = (section: string, field: string, value: string) => {
    if (section === 'main') {
      setFundData(prev => ({ ...prev, [field]: value }));
    } else {
      setFundData(prev => ({
        ...prev,
        [section]: {
          ...prev[section as keyof typeof prev],
          [field]: value
        }
      }));
    }
  };

  const score = calculateScore();
  const riskLevel = getRiskLevel(score);

  return (
    <div className="space-y-6">
      {/* Informations sur le bien et l'opération */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Adresse du Bien et Nature de l'Opération
          </CardTitle>
          <CardDescription>
            Détails sur le bien immobilier et le type d'opération
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="propertyAddress">Adresse du bien</Label>
              <Textarea
                id="propertyAddress"
                value={fundData.propertyAddress}
                onChange={(e) => handleInputChange('main', 'propertyAddress', e.target.value)}
                placeholder="Adresse complète du bien immobilier"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="propertyCity">Ville</Label>
                <Input
                  id="propertyCity"
                  value={fundData.propertyCity}
                  onChange={(e) => handleInputChange('main', 'propertyCity', e.target.value)}
                  placeholder="Ville"
                />
              </div>
              <div>
                <Label htmlFor="propertyPostalCode">Code postal</Label>
                <Input
                  id="propertyPostalCode"
                  value={fundData.propertyPostalCode}
                  onChange={(e) => handleInputChange('main', 'propertyPostalCode', e.target.value)}
                  placeholder="Code postal"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="operationType">Nature de l'opération</Label>
                <div className="flex gap-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="vente" 
                      checked={fundData.operationType === 'vente'}
                      onCheckedChange={() => handleInputChange('main', 'operationType', 'vente')}
                    />
                    <Label htmlFor="vente">Vente</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="location" 
                      checked={fundData.operationType === 'location'}
                      onCheckedChange={() => handleInputChange('main', 'operationType', 'location')}
                    />
                    <Label htmlFor="location">Location</Label>
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="operationAmount">Montant de l'opération (€)</Label>
                <Input
                  id="operationAmount"
                  type="number"
                  value={fundData.operationAmount}
                  onChange={(e) => handleInputChange('main', 'operationAmount', e.target.value)}
                  placeholder="Montant en euros"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informations bancaires et paiement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Modalités de Paiement
          </CardTitle>
          <CardDescription>
            Détails sur les moyens de paiement et informations bancaires
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="paymentMethod">Moyen de paiement</Label>
              <Input
                id="paymentMethod"
                value={fundData.paymentMethod}
                onChange={(e) => handleInputChange('main', 'paymentMethod', e.target.value)}
                placeholder="Virement, chèque, espèces, etc."
              />
            </div>
            
            <Collapsible>
              <CollapsibleTrigger className="flex items-center gap-2 font-medium text-left w-full">
                <Banknote className="h-4 w-4" />
                Informations bancaires
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bankName">Nom de la banque</Label>
                    <Input
                      id="bankName"
                      value={fundData.bankDetails.bankName}
                      onChange={(e) => handleInputChange('bankDetails', 'bankName', e.target.value)}
                      placeholder="Nom de l'établissement bancaire"
                    />
                  </div>
                  <div>
                    <Label htmlFor="accountHolder">Titulaire du compte</Label>
                    <Input
                      id="accountHolder"
                      value={fundData.bankDetails.accountHolder}
                      onChange={(e) => handleInputChange('bankDetails', 'accountHolder', e.target.value)}
                      placeholder="Nom du titulaire"
                    />
                  </div>
                  <div>
                    <Label htmlFor="iban">IBAN</Label>
                    <Input
                      id="iban"
                      value={fundData.bankDetails.iban}
                      onChange={(e) => handleInputChange('bankDetails', 'iban', e.target.value)}
                      placeholder="Numéro IBAN"
                    />
                  </div>
                  <div>
                    <Label htmlFor="swiftCode">Code SWIFT/BIC</Label>
                    <Input
                      id="swiftCode"
                      value={fundData.bankDetails.swiftCode}
                      onChange={(e) => handleInputChange('bankDetails', 'swiftCode', e.target.value)}
                      placeholder="Code SWIFT ou BIC"
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </CardContent>
      </Card>

      {/* Origine des fonds */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Origine des Fonds
          </CardTitle>
          <CardDescription>
            Justification de la provenance des fonds utilisés
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="fundSource">Source principale des fonds</Label>
              <Input
                id="fundSource"
                value={fundData.fundOrigin.source}
                onChange={(e) => handleInputChange('fundOrigin', 'source', e.target.value)}
                placeholder="Salaire, héritage, vente immobilière, etc."
              />
            </div>
            <div>
              <Label htmlFor="fundDescription">Description détaillée</Label>
              <Textarea
                id="fundDescription"
                value={fundData.fundOrigin.description}
                onChange={(e) => handleInputChange('fundOrigin', 'description', e.target.value)}
                placeholder="Description détaillée de l'origine des fonds"
              />
            </div>
            <div>
              <Label htmlFor="justification">Justificatifs fournis</Label>
              <Textarea
                id="justification"
                value={fundData.fundOrigin.justification}
                onChange={(e) => handleInputChange('fundOrigin', 'justification', e.target.value)}
                placeholder="Liste des documents justificatifs fournis"
              />
            </div>
            <div>
              <Label htmlFor="previousTransactions">Transactions antérieures</Label>
              <Textarea
                id="previousTransactions"
                value={fundData.fundOrigin.previousTransactions}
                onChange={(e) => handleInputChange('fundOrigin', 'previousTransactions', e.target.value)}
                placeholder="Historique des transactions liées"
              />
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
            Analyse des risques liés à l'origine des fonds dans la transaction
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
    </div>
  );
};

export default FundOriginAssessment;
