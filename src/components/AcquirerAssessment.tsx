
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building, AlertCircle, User, Building2, Upload, ExternalLink } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import CountryAutocomplete from "./CountryAutocomplete";

interface AcquirerAssessmentProps {
  onScoreUpdate: (score: number, level: string) => void;
}

const AcquirerAssessment = ({ onScoreUpdate }: AcquirerAssessmentProps) => {
  const [checks, setChecks] = useState({
    identityVerified: false,
    sanctionsList: false,
    highRiskCountry: false,
    unreliableInfo: false,
    actingForThird: false,
    atypicalOperation: false,
    knownInfractions: false,
    noClientInfo: false
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
      country: '',
      city: '',
      postalCode: '',
      phone: '',
      email: '',
      idDocument: '',
      idDocumentOther: '',
      idNumber: '',
      profession: '',
      income: '',
      countryOrigin: ''
    },
    // Personne morale
    legalEntity: {
      companyName: '',
      legalForm: '',
      siret: '',
      address: '',
      country: '',
      city: '',
      postalCode: '',
      phone: '',
      email: '',
      activity: '',
      representativeName: '',
      representativePosition: '',
      countryOrigin: ''
    }
  });

  const [personType, setPersonType] = useState<'physical' | 'legal'>('physical');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [sanctionsScreenshots, setSanctionsScreenshots] = useState<File[]>([]);
  const [gafiScreenshots, setGafiScreenshots] = useState<File[]>([]);

  const questions = [
    {
      id: 'identityVerified',
      label: 'Identité de l\'acquéreur vérifiée',
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
      description: 'Acquéreur originaire d\'un pays à haut risque',
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
      description: 'L\'acquéreur agit pour le compte d\'une tierce personne',
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
      label: 'Acquéreur connu pour infractions',
      description: 'L\'acquéreur est connu pour diverses infractions',
      risk: 'Élevé'
    },
    {
      id: 'noClientInfo',
      label: 'Absence de renseignements de l\'acquéreur',
      description: 'L\'acquéreur ne fournit aucun renseignement demandé',
      risk: 'Élevé'
    }
  ];

  const calculateScore = () => {
    let score = 0;
    if (!checks.identityVerified) score += 1;
    if (checks.sanctionsList) score += 3;
    if (checks.highRiskCountry) score += 2;
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

  const handleInputChange = (section: 'physicalPerson' | 'legalEntity', field: string, value: string) => {
    setAcquirerData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const handleSanctionsUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSanctionsScreenshots(prev => [...prev, ...files]);
  };

  const handleGafiUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setGafiScreenshots(prev => [...prev, ...files]);
  };

  const removeFile = (index: number, type: 'identity' | 'sanctions' | 'gafi') => {
    if (type === 'identity') {
      setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    } else if (type === 'sanctions') {
      setSanctionsScreenshots(prev => prev.filter((_, i) => i !== index));
    } else {
      setGafiScreenshots(prev => prev.filter((_, i) => i !== index));
    }
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
                    <CountryAutocomplete
                      id="acq-nationality"
                      label="Nationalité"
                      value={acquirerData.physicalPerson.nationality}
                      onChange={(value) => handleInputChange('physicalPerson', 'nationality', value)}
                      placeholder="Commencez à taper pour voir les suggestions..."
                    />
                    <CountryAutocomplete
                      id="acq-countryOrigin"
                      label="Pays d'origine"
                      value={acquirerData.physicalPerson.countryOrigin}
                      onChange={(value) => handleInputChange('physicalPerson', 'countryOrigin', value)}
                      placeholder="Commencez à taper pour voir les suggestions..."
                    />
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
                      <Label htmlFor="acq-email">Email</Label>
                      <Input
                        id="acq-email"
                        type="email"
                        value={acquirerData.physicalPerson.email}
                        onChange={(e) => handleInputChange('physicalPerson', 'email', e.target.value)}
                        placeholder="Adresse email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="acq-idDocument">Type de pièce d'identité</Label>
                      <Select 
                        value={acquirerData.physicalPerson.idDocument} 
                        onValueChange={(value) => handleInputChange('physicalPerson', 'idDocument', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez le type de pièce d'identité" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cni">Carte nationale d'identité</SelectItem>
                          <SelectItem value="passeport">Passeport</SelectItem>
                          <SelectItem value="permis">Permis de conduire</SelectItem>
                          <SelectItem value="autre">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                      {acquirerData.physicalPerson.idDocument === 'autre' && (
                        <div className="mt-2">
                          <Input
                            value={acquirerData.physicalPerson.idDocumentOther}
                            onChange={(e) => handleInputChange('physicalPerson', 'idDocumentOther', e.target.value)}
                            placeholder="Précisez le type de pièce d'identité"
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="acq-idNumber">Numéro de pièce d'identité</Label>
                      <Input
                        id="acq-idNumber"
                        value={acquirerData.physicalPerson.idNumber}
                        onChange={(e) => handleInputChange('physicalPerson', 'idNumber', e.target.value)}
                        placeholder="Numéro de la pièce d'identité"
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <CountryAutocomplete
                      id="acq-country"
                      label="Pays"
                      value={acquirerData.physicalPerson.country}
                      onChange={(value) => handleInputChange('physicalPerson', 'country', value)}
                      placeholder="Commencez à taper pour voir les suggestions..."
                    />
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
                    <CountryAutocomplete
                      id="acq-companyCountryOrigin"
                      label="Pays d'origine"
                      value={acquirerData.legalEntity.countryOrigin}
                      onChange={(value) => handleInputChange('legalEntity', 'countryOrigin', value)}
                      placeholder="Commencez à taper pour voir les suggestions..."
                    />
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
                      <Label htmlFor="acq-companyEmail">Email</Label>
                      <Input
                        id="acq-companyEmail"
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <CountryAutocomplete
                      id="acq-companyCountry"
                      label="Pays"
                      value={acquirerData.legalEntity.country}
                      onChange={(value) => handleInputChange('legalEntity', 'country', value)}
                      placeholder="Commencez à taper pour voir les suggestions..."
                    />
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

            {/* Zone de téléchargement de pièces d'identité */}
            <div>
              <Label htmlFor="acq-identityUpload">Pièces d'identité et documents</Label>
              <div className="mt-2">
                <Input
                  id="acq-identityUpload"
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
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
                          onClick={() => removeFile(index, 'identity')}
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
            Liens vers les sites officiels pour les vérifications et capture d'écran
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
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
              <div>
                <Label htmlFor="acq-sanctionsUpload">Capture d'écran des vérifications</Label>
                <Input
                  id="acq-sanctionsUpload"
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleSanctionsUpload}
                  className="mt-2"
                />
                {sanctionsScreenshots.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {sanctionsScreenshots.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{file.name}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFile(index, 'sanctions')}
                        >
                          Supprimer
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
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
              <div>
                <Label htmlFor="acq-gafiUpload">Capture d'écran GAFI</Label>
                <Input
                  id="acq-gafiUpload"
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleGafiUpload}
                  className="mt-2"
                />
                {gafiScreenshots.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {gafiScreenshots.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{file.name}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFile(index, 'gafi')}
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
                      <div className="flex items-center justify-center gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`acq-${question.id}-oui`}
                            checked={checks[question.id as keyof typeof checks]}
                            onCheckedChange={(checked) => handleCheck(question.id, checked as boolean)}
                          />
                          <Label htmlFor={`acq-${question.id}-oui`} className="text-sm font-medium">
                            Oui
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`acq-${question.id}-non`}
                            checked={!checks[question.id as keyof typeof checks]}
                            onCheckedChange={(checked) => handleCheck(question.id, !(checked as boolean))}
                          />
                          <Label htmlFor={`acq-${question.id}-non`} className="text-sm font-medium">
                            Non
                          </Label>
                        </div>
                      </div>
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

export default AcquirerAssessment;
