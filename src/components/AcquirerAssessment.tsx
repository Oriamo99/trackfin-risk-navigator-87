
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building, AlertCircle, User, Building2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface AcquirerAssessmentProps {
  onScoreUpdate: (score: number, level: string) => void;
}

const AcquirerAssessment = ({ onScoreUpdate }: AcquirerAssessmentProps) => {
  const [checks, setChecks] = useState({
    companyRegistered: false,
    beneficialOwners: false,
    suspiciousActivity: false
  });

  const [acquirerData, setAcquirerData] = useState({
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
      profession: '',
      income: ''
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
      activity: '',
      representativeName: '',
      representativePosition: ''
    }
  });

  const [personType, setPersonType] = useState<'physical' | 'legal'>('physical');

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

  const handleInputChange = (section: 'physicalPerson' | 'legalEntity', field: string, value: string) => {
    setAcquirerData(prev => ({
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
            <Building className="h-5 w-5" />
            Informations de l'Acquéreur
          </CardTitle>
          <CardDescription>
            Saisie des informations détaillées de l'acquéreur
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Type de personne */}
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="acquirer-physical" 
                  checked={personType === 'physical'}
                  onCheckedChange={() => setPersonType('physical')}
                />
                <Label htmlFor="acquirer-physical" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Personne physique
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="acquirer-legal" 
                  checked={personType === 'legal'}
                  onCheckedChange={() => setPersonType('legal')}
                />
                <Label htmlFor="acquirer-legal" className="flex items-center gap-2">
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
                      <Label htmlFor="acq-lastName">Nom de famille *</Label>
                      <Input
                        id="acq-lastName"
                        value={acquirerData.physicalPerson.lastName}
                        onChange={(e) => handleInputChange('physicalPerson', 'lastName', e.target.value)}
                        placeholder="Nom de famille"
                      />
                    </div>
                    <div>
                      <Label htmlFor="acq-firstName">Prénom *</Label>
                      <Input
                        id="acq-firstName"
                        value={acquirerData.physicalPerson.firstName}
                        onChange={(e) => handleInputChange('physicalPerson', 'firstName', e.target.value)}
                        placeholder="Prénom"
                      />
                    </div>
                    <div>
                      <Label htmlFor="acq-birthDate">Date de naissance</Label>
                      <Input
                        id="acq-birthDate"
                        type="date"
                        value={acquirerData.physicalPerson.birthDate}
                        onChange={(e) => handleInputChange('physicalPerson', 'birthDate', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="acq-birthPlace">Lieu de naissance</Label>
                      <Input
                        id="acq-birthPlace"
                        value={acquirerData.physicalPerson.birthPlace}
                        onChange={(e) => handleInputChange('physicalPerson', 'birthPlace', e.target.value)}
                        placeholder="Lieu de naissance"
                      />
                    </div>
                    <div>
                      <Label htmlFor="acq-nationality">Nationalité</Label>
                      <Input
                        id="acq-nationality"
                        value={acquirerData.physicalPerson.nationality}
                        onChange={(e) => handleInputChange('physicalPerson', 'nationality', e.target.value)}
                        placeholder="Nationalité"
                      />
                    </div>
                    <div>
                      <Label htmlFor="acq-profession">Profession</Label>
                      <Input
                        id="acq-profession"
                        value={acquirerData.physicalPerson.profession}
                        onChange={(e) => handleInputChange('physicalPerson', 'profession', e.target.value)}
                        placeholder="Profession"
                      />
                    </div>
                    <div>
                      <Label htmlFor="acq-phone">Téléphone</Label>
                      <Input
                        id="acq-phone"
                        value={acquirerData.physicalPerson.phone}
                        onChange={(e) => handleInputChange('physicalPerson', 'phone', e.target.value)}
                        placeholder="Numéro de téléphone"
                      />
                    </div>
                    <div>
                      <Label htmlFor="acq-income">Revenus annuels</Label>
                      <Input
                        id="acq-income"
                        value={acquirerData.physicalPerson.income}
                        onChange={(e) => handleInputChange('physicalPerson', 'income', e.target.value)}
                        placeholder="Revenus annuels estimés"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="acq-address">Adresse complète</Label>
                    <Textarea
                      id="acq-address"
                      value={acquirerData.physicalPerson.address}
                      onChange={(e) => handleInputChange('physicalPerson', 'address', e.target.value)}
                      placeholder="Adresse complète"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="acq-city">Ville</Label>
                      <Input
                        id="acq-city"
                        value={acquirerData.physicalPerson.city}
                        onChange={(e) => handleInputChange('physicalPerson', 'city', e.target.value)}
                        placeholder="Ville"
                      />
                    </div>
                    <div>
                      <Label htmlFor="acq-postalCode">Code postal</Label>
                      <Input
                        id="acq-postalCode"
                        value={acquirerData.physicalPerson.postalCode}
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
                      <Label htmlFor="acq-companyName">Raison sociale *</Label>
                      <Input
                        id="acq-companyName"
                        value={acquirerData.legalEntity.companyName}
                        onChange={(e) => handleInputChange('legalEntity', 'companyName', e.target.value)}
                        placeholder="Raison sociale"
                      />
                    </div>
                    <div>
                      <Label htmlFor="acq-legalForm">Forme juridique</Label>
                      <Input
                        id="acq-legalForm"
                        value={acquirerData.legalEntity.legalForm}
                        onChange={(e) => handleInputChange('legalEntity', 'legalForm', e.target.value)}
                        placeholder="SARL, SAS, SA, etc."
                      />
                    </div>
                    <div>
                      <Label htmlFor="acq-siret">N° SIRET</Label>
                      <Input
                        id="acq-siret"
                        value={acquirerData.legalEntity.siret}
                        onChange={(e) => handleInputChange('legalEntity', 'siret', e.target.value)}
                        placeholder="Numéro SIRET"
                      />
                    </div>
                    <div>
                      <Label htmlFor="acq-activity">Secteur d'activité</Label>
                      <Input
                        id="acq-activity"
                        value={acquirerData.legalEntity.activity}
                        onChange={(e) => handleInputChange('legalEntity', 'activity', e.target.value)}
                        placeholder="Secteur d'activité"
                      />
                    </div>
                    <div>
                      <Label htmlFor="acq-companyPhone">Téléphone</Label>
                      <Input
                        id="acq-companyPhone"
                        value={acquirerData.legalEntity.phone}
                        onChange={(e) => handleInputChange('legalEntity', 'phone', e.target.value)}
                        placeholder="Numéro de téléphone"
                      />
                    </div>
                    <div>
                      <Label htmlFor="acq-email">Email</Label>
                      <Input
                        id="acq-email"
                        type="email"
                        value={acquirerData.legalEntity.email}
                        onChange={(e) => handleInputChange('legalEntity', 'email', e.target.value)}
                        placeholder="Adresse email"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="acq-companyAddress">Adresse du siège social</Label>
                    <Textarea
                      id="acq-companyAddress"
                      value={acquirerData.legalEntity.address}
                      onChange={(e) => handleInputChange('legalEntity', 'address', e.target.value)}
                      placeholder="Adresse complète du siège social"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="acq-companyCity">Ville</Label>
                      <Input
                        id="acq-companyCity"
                        value={acquirerData.legalEntity.city}
                        onChange={(e) => handleInputChange('legalEntity', 'city', e.target.value)}
                        placeholder="Ville"
                      />
                    </div>
                    <div>
                      <Label htmlFor="acq-companyPostalCode">Code postal</Label>
                      <Input
                        id="acq-companyPostalCode"
                        value={acquirerData.legalEntity.postalCode}
                        onChange={(e) => handleInputChange('legalEntity', 'postalCode', e.target.value)}
                        placeholder="Code postal"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="acq-representativeName">Représentant légal</Label>
                      <Input
                        id="acq-representativeName"
                        value={acquirerData.legalEntity.representativeName}
                        onChange={(e) => handleInputChange('legalEntity', 'representativeName', e.target.value)}
                        placeholder="Nom du représentant légal"
                      />
                    </div>
                    <div>
                      <Label htmlFor="acq-representativePosition">Fonction</Label>
                      <Input
                        id="acq-representativePosition"
                        value={acquirerData.legalEntity.representativePosition}
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
            Évaluation des Risques - Acquéreurs
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
    </div>
  );
};

export default AcquirerAssessment;
