
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, AlertCircle, User, Building2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface VendorAssessmentProps {
  onScoreUpdate: (score: number, level: string) => void;
}

const VendorAssessment = ({ onScoreUpdate }: VendorAssessmentProps) => {
  const [checks, setChecks] = useState({
    identityVerified: false,
    sanctionsList: false,
    highRiskCountry: false
  });

  const [vendorData, setVendorData] = useState({
    // Personne physique
    physicalPerson: {
      lastName: '',
      firstName: '',
      birthDate: '',
      birthPlace: '',
      nationality: '',
      address: '',
      city: '',
      postalCode: '',
      phone: '',
      email: '',
      idDocument: '',
      idNumber: ''
    },
    // Personne morale
    legalEntity: {
      companyName: '',
      legalForm: '',
      siret: '',
      address: '',
      city: '',
      postalCode: '',
      phone: '',
      email: '',
      representativeName: '',
      representativePosition: ''
    }
  });

  const [personType, setPersonType] = useState<'physical' | 'legal'>('physical');

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

  const handleInputChange = (section: 'physicalPerson' | 'legalEntity', field: string, value: string) => {
    setVendorData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const score = calculateScore();
  const riskLevel = getRiskLevel(score);

  return (
    <div className="space-y-6">
      {/* Formulaire de saisie */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Informations du Vendeur
          </CardTitle>
          <CardDescription>
            Saisie des informations détaillées du vendeur
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Type de personne */}
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="physical" 
                  checked={personType === 'physical'}
                  onCheckedChange={() => setPersonType('physical')}
                />
                <Label htmlFor="physical" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Personne physique
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="legal" 
                  checked={personType === 'legal'}
                  onCheckedChange={() => setPersonType('legal')}
                />
                <Label htmlFor="legal" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Personne morale
                </Label>
              </div>
            </div>

            {/* Formulaire personne physique */}
            {personType === 'physical' && (
              <Collapsible defaultOpen>
                <CollapsibleTrigger className="flex items-center gap-2 font-medium text-left w-full">
                  <User className="h-4 w-4" />
                  Détails de la personne physique
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="lastName">Nom de famille *</Label>
                      <Input
                        id="lastName"
                        value={vendorData.physicalPerson.lastName}
                        onChange={(e) => handleInputChange('physicalPerson', 'lastName', e.target.value)}
                        placeholder="Nom de famille"
                      />
                    </div>
                    <div>
                      <Label htmlFor="firstName">Prénom *</Label>
                      <Input
                        id="firstName"
                        value={vendorData.physicalPerson.firstName}
                        onChange={(e) => handleInputChange('physicalPerson', 'firstName', e.target.value)}
                        placeholder="Prénom"
                      />
                    </div>
                    <div>
                      <Label htmlFor="birthDate">Date de naissance</Label>
                      <Input
                        id="birthDate"
                        type="date"
                        value={vendorData.physicalPerson.birthDate}
                        onChange={(e) => handleInputChange('physicalPerson', 'birthDate', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="birthPlace">Lieu de naissance</Label>
                      <Input
                        id="birthPlace"
                        value={vendorData.physicalPerson.birthPlace}
                        onChange={(e) => handleInputChange('physicalPerson', 'birthPlace', e.target.value)}
                        placeholder="Lieu de naissance"
                      />
                    </div>
                    <div>
                      <Label htmlFor="nationality">Nationalité</Label>
                      <Input
                        id="nationality"
                        value={vendorData.physicalPerson.nationality}
                        onChange={(e) => handleInputChange('physicalPerson', 'nationality', e.target.value)}
                        placeholder="Nationalité"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Téléphone</Label>
                      <Input
                        id="phone"
                        value={vendorData.physicalPerson.phone}
                        onChange={(e) => handleInputChange('physicalPerson', 'phone', e.target.value)}
                        placeholder="Numéro de téléphone"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address">Adresse complète</Label>
                    <Textarea
                      id="address"
                      value={vendorData.physicalPerson.address}
                      onChange={(e) => handleInputChange('physicalPerson', 'address', e.target.value)}
                      placeholder="Adresse complète"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">Ville</Label>
                      <Input
                        id="city"
                        value={vendorData.physicalPerson.city}
                        onChange={(e) => handleInputChange('physicalPerson', 'city', e.target.value)}
                        placeholder="Ville"
                      />
                    </div>
                    <div>
                      <Label htmlFor="postalCode">Code postal</Label>
                      <Input
                        id="postalCode"
                        value={vendorData.physicalPerson.postalCode}
                        onChange={(e) => handleInputChange('physicalPerson', 'postalCode', e.target.value)}
                        placeholder="Code postal"
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Formulaire personne morale */}
            {personType === 'legal' && (
              <Collapsible defaultOpen>
                <CollapsibleTrigger className="flex items-center gap-2 font-medium text-left w-full">
                  <Building2 className="h-4 w-4" />
                  Détails de la personne morale
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="companyName">Raison sociale *</Label>
                      <Input
                        id="companyName"
                        value={vendorData.legalEntity.companyName}
                        onChange={(e) => handleInputChange('legalEntity', 'companyName', e.target.value)}
                        placeholder="Raison sociale"
                      />
                    </div>
                    <div>
                      <Label htmlFor="legalForm">Forme juridique</Label>
                      <Input
                        id="legalForm"
                        value={vendorData.legalEntity.legalForm}
                        onChange={(e) => handleInputChange('legalEntity', 'legalForm', e.target.value)}
                        placeholder="SARL, SAS, SA, etc."
                      />
                    </div>
                    <div>
                      <Label htmlFor="siret">N° SIRET</Label>
                      <Input
                        id="siret"
                        value={vendorData.legalEntity.siret}
                        onChange={(e) => handleInputChange('legalEntity', 'siret', e.target.value)}
                        placeholder="Numéro SIRET"
                      />
                    </div>
                    <div>
                      <Label htmlFor="companyPhone">Téléphone</Label>
                      <Input
                        id="companyPhone"
                        value={vendorData.legalEntity.phone}
                        onChange={(e) => handleInputChange('legalEntity', 'phone', e.target.value)}
                        placeholder="Numéro de téléphone"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="companyAddress">Adresse du siège social</Label>
                    <Textarea
                      id="companyAddress"
                      value={vendorData.legalEntity.address}
                      onChange={(e) => handleInputChange('legalEntity', 'address', e.target.value)}
                      placeholder="Adresse complète du siège social"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="companyCity">Ville</Label>
                      <Input
                        id="companyCity"
                        value={vendorData.legalEntity.city}
                        onChange={(e) => handleInputChange('legalEntity', 'city', e.target.value)}
                        placeholder="Ville"
                      />
                    </div>
                    <div>
                      <Label htmlFor="companyPostalCode">Code postal</Label>
                      <Input
                        id="companyPostalCode"
                        value={vendorData.legalEntity.postalCode}
                        onChange={(e) => handleInputChange('legalEntity', 'postalCode', e.target.value)}
                        placeholder="Code postal"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="representativeName">Représentant légal</Label>
                      <Input
                        id="representativeName"
                        value={vendorData.legalEntity.representativeName}
                        onChange={(e) => handleInputChange('legalEntity', 'representativeName', e.target.value)}
                        placeholder="Nom du représentant légal"
                      />
                    </div>
                    <div>
                      <Label htmlFor="representativePosition">Fonction</Label>
                      <Input
                        id="representativePosition"
                        value={vendorData.legalEntity.representativePosition}
                        onChange={(e) => handleInputChange('legalEntity', 'representativePosition', e.target.value)}
                        placeholder="Fonction du représentant"
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Évaluation des risques */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Évaluation des Risques - Vendeurs
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
    </div>
  );
};

export default VendorAssessment;
