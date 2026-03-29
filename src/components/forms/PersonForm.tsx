import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { User, Building2 } from "lucide-react";
import { CountrySelect } from "@/components/forms/CountrySelect";
import { physicalPersonSchema, legalEntitySchema } from "@/config/validation-schemas";
import type { PhysicalPersonFormData, LegalEntityFormData } from "@/config/validation-schemas";
import type { PartyData } from "@/types";

interface PersonFormProps {
  data: PartyData;
  personType: 'physical' | 'legal';
  onPersonTypeChange: (type: 'physical' | 'legal') => void;
  onInputChange: (section: 'physicalPerson' | 'legalEntity', field: string, value: string) => void;
  idPrefix: string;
  showAcquirerFields?: boolean;
}

const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="text-sm text-red-500 mt-1">{message}</p> : null;

export const PersonForm = ({
  data,
  personType,
  onPersonTypeChange,
  onInputChange,
  idPrefix: p,
  showAcquirerFields = false,
}: PersonFormProps) => {
  // Physical person form
  const physForm = useForm<PhysicalPersonFormData>({
    resolver: zodResolver(physicalPersonSchema),
    mode: 'onBlur',
    defaultValues: data.physicalPerson,
  });

  // Legal entity form
  const legalForm = useForm<LegalEntityFormData>({
    resolver: zodResolver(legalEntitySchema),
    mode: 'onBlur',
    defaultValues: data.legalEntity,
  });

  // Sync form values when props change (e.g. localStorage reload)
  useEffect(() => {
    physForm.reset(data.physicalPerson, { keepErrors: true, keepDirty: true, keepTouched: true });
  }, [data.physicalPerson, physForm]);

  useEffect(() => {
    legalForm.reset(data.legalEntity, { keepErrors: true, keepDirty: true, keepTouched: true });
  }, [data.legalEntity, legalForm]);

  const pe = physForm.formState.errors;
  const le = legalForm.formState.errors;

  // Helper to create input props that sync with both react-hook-form and localStorage
  const physField = (field: keyof PhysicalPersonFormData) => {
    const reg = physForm.register(field);
    return {
      ...reg,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        reg.onChange(e);
        onInputChange('physicalPerson', field, e.target.value);
      },
    };
  };

  const legalField = (field: keyof LegalEntityFormData) => {
    const reg = legalForm.register(field);
    return {
      ...reg,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        reg.onChange(e);
        onInputChange('legalEntity', field, e.target.value);
      },
    };
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`${p}-physical`}
            checked={personType === 'physical'}
            onCheckedChange={() => onPersonTypeChange('physical')}
          />
          <Label htmlFor={`${p}-physical`} className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Personne physique
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`${p}-legal`}
            checked={personType === 'legal'}
            onCheckedChange={() => onPersonTypeChange('legal')}
          />
          <Label htmlFor={`${p}-legal`} className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Personne morale
          </Label>
        </div>
      </div>

      {personType === 'physical' && (
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex items-center gap-2 font-medium text-left w-full">
            <User className="h-4 w-4" />
            Détails de la personne physique
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`${p}-lastName`}>Nom de famille *</Label>
                <Input id={`${p}-lastName`} {...physField('lastName')} value={data.physicalPerson.lastName} placeholder="Nom de famille" />
                <FieldError message={pe.lastName?.message} />
              </div>
              <div>
                <Label htmlFor={`${p}-firstName`}>Prénom *</Label>
                <Input id={`${p}-firstName`} {...physField('firstName')} value={data.physicalPerson.firstName} placeholder="Prénom" />
                <FieldError message={pe.firstName?.message} />
              </div>
              <div>
                <Label htmlFor={`${p}-birthDate`}>Date de naissance</Label>
                <Input id={`${p}-birthDate`} type="date" {...physField('birthDate')} value={data.physicalPerson.birthDate} />
              </div>
              <div>
                <Label htmlFor={`${p}-birthPlace`}>Lieu de naissance</Label>
                <Input id={`${p}-birthPlace`} {...physField('birthPlace')} value={data.physicalPerson.birthPlace} placeholder="Lieu de naissance" />
              </div>
              <CountrySelect
                id={`${p}-nationality`}
                label="Nationalité"
                value={data.physicalPerson.nationality}
                onChange={(value) => { physForm.setValue('nationality', value); onInputChange('physicalPerson', 'nationality', value); }}
                placeholder="Commencez à taper pour voir les suggestions..."
              />
              <CountrySelect
                id={`${p}-fiscalResidence`}
                label="Résidence fiscale"
                value={data.physicalPerson.fiscalResidence}
                onChange={(value) => { physForm.setValue('fiscalResidence', value); onInputChange('physicalPerson', 'fiscalResidence', value); }}
                placeholder="Commencez à taper pour voir les suggestions..."
              />
              <div>
                <Label htmlFor={`${p}-phone`}>Téléphone</Label>
                <Input id={`${p}-phone`} {...physField('phone')} value={data.physicalPerson.phone} placeholder="Numéro de téléphone" />
                <FieldError message={pe.phone?.message} />
              </div>
              <div>
                <Label htmlFor={`${p}-email`}>Email</Label>
                <Input id={`${p}-email`} type="email" {...physField('email')} value={data.physicalPerson.email} placeholder="Adresse email" />
                <FieldError message={pe.email?.message} />
              </div>
              {showAcquirerFields && (
                <>
                  <div>
                    <Label htmlFor={`${p}-profession`}>Profession</Label>
                    <Input id={`${p}-profession`} {...physField('profession')} value={data.physicalPerson.profession} placeholder="Profession" />
                  </div>
                  <div>
                    <Label htmlFor={`${p}-income`}>Revenus annuels</Label>
                    <Input id={`${p}-income`} {...physField('income')} value={data.physicalPerson.income} placeholder="Revenus annuels estimés" />
                  </div>
                </>
              )}
            </div>
            <div>
              <Label htmlFor={`${p}-address`}>Adresse complète</Label>
              <Textarea id={`${p}-address`} {...physField('address')} value={data.physicalPerson.address} placeholder="Adresse complète" />
            </div>
            <div className={`grid grid-cols-1 ${showAcquirerFields ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
              {showAcquirerFields && (
                <CountrySelect
                  id={`${p}-country`}
                  label="Pays"
                  value={data.physicalPerson.country}
                  onChange={(value) => { physForm.setValue('country', value); onInputChange('physicalPerson', 'country', value); }}
                  placeholder="Commencez à taper pour voir les suggestions..."
                />
              )}
              <div>
                <Label htmlFor={`${p}-city`}>Ville</Label>
                <Input id={`${p}-city`} {...physField('city')} value={data.physicalPerson.city} placeholder="Ville" />
              </div>
              <div>
                <Label htmlFor={`${p}-postalCode`}>Code postal</Label>
                <Input id={`${p}-postalCode`} {...physField('postalCode')} value={data.physicalPerson.postalCode} placeholder="Code postal" />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {personType === 'legal' && (
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex items-center gap-2 font-medium text-left w-full">
            <Building2 className="h-4 w-4" />
            Détails de la personne morale
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`${p}-companyName`}>Raison sociale *</Label>
                <Input id={`${p}-companyName`} {...legalField('companyName')} value={data.legalEntity.companyName} placeholder="Raison sociale" />
                <FieldError message={le.companyName?.message} />
              </div>
              <div>
                <Label htmlFor={`${p}-legalForm`}>Forme juridique</Label>
                <Input id={`${p}-legalForm`} {...legalField('legalForm')} value={data.legalEntity.legalForm} placeholder="SARL, SAS, SA, etc." />
              </div>
              <div>
                <Label htmlFor={`${p}-siret`}>N° SIRET</Label>
                <Input id={`${p}-siret`} {...legalField('siret')} value={data.legalEntity.siret} placeholder="Numéro SIRET" />
                <FieldError message={le.siret?.message} />
              </div>
              {showAcquirerFields && (
                <div>
                  <Label htmlFor={`${p}-activity`}>Secteur d'activité</Label>
                  <Input id={`${p}-activity`} {...legalField('activity')} value={data.legalEntity.activity} placeholder="Secteur d'activité" />
                </div>
              )}
              <CountrySelect
                id={`${p}-companyFiscalResidence`}
                label="Résidence fiscale"
                value={data.legalEntity.fiscalResidence}
                onChange={(value) => { legalForm.setValue('fiscalResidence', value); onInputChange('legalEntity', 'fiscalResidence', value); }}
                placeholder="Commencez à taper pour voir les suggestions..."
              />
              <div>
                <Label htmlFor={`${p}-companyPhone`}>Téléphone</Label>
                <Input id={`${p}-companyPhone`} {...legalField('phone')} value={data.legalEntity.phone} placeholder="Numéro de téléphone" />
                <FieldError message={le.phone?.message} />
              </div>
              <div>
                <Label htmlFor={`${p}-companyEmail`}>Email</Label>
                <Input id={`${p}-companyEmail`} type="email" {...legalField('email')} value={data.legalEntity.email} placeholder="Adresse email" />
                <FieldError message={le.email?.message} />
              </div>
            </div>
            <div>
              <Label htmlFor={`${p}-companyAddress`}>Adresse du siège social</Label>
              <Textarea id={`${p}-companyAddress`} {...legalField('address')} value={data.legalEntity.address} placeholder="Adresse complète du siège social" />
            </div>
            <div className={`grid grid-cols-1 ${showAcquirerFields ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
              {showAcquirerFields && (
                <CountrySelect
                  id={`${p}-companyCountry`}
                  label="Pays"
                  value={data.legalEntity.country}
                  onChange={(value) => { legalForm.setValue('country', value); onInputChange('legalEntity', 'country', value); }}
                  placeholder="Commencez à taper pour voir les suggestions..."
                />
              )}
              <div>
                <Label htmlFor={`${p}-companyCity`}>Ville</Label>
                <Input id={`${p}-companyCity`} {...legalField('city')} value={data.legalEntity.city} placeholder="Ville" />
              </div>
              <div>
                <Label htmlFor={`${p}-companyPostalCode`}>Code postal</Label>
                <Input id={`${p}-companyPostalCode`} {...legalField('postalCode')} value={data.legalEntity.postalCode} placeholder="Code postal" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`${p}-representativeName`}>Représentant légal</Label>
                <Input id={`${p}-representativeName`} {...legalField('representativeName')} value={data.legalEntity.representativeName} placeholder="Nom du représentant légal" />
              </div>
              <div>
                <Label htmlFor={`${p}-representativePosition`}>Fonction</Label>
                <Input id={`${p}-representativePosition`} {...legalField('representativePosition')} value={data.legalEntity.representativePosition} placeholder="Fonction du représentant" />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};
