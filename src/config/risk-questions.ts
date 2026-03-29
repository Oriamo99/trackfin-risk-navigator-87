export interface RiskQuestion {
  id: string;
  label: string;
  description: string;
  risk: 'Faible' | 'Modéré' | 'Élevé';
  weight: number;
  invertedLogic?: boolean;
}

export const partyQuestions: RiskQuestion[] = [
  {
    id: 'identityVerified',
    label: 'Identité vérifiée',
    description: "Documents d'identité valides et vérifiés",
    risk: 'Faible',
    weight: 1,
    invertedLogic: true,
  },
  {
    id: 'sanctionsList',
    label: 'Présence sur listes de sanctions',
    description: 'Vérification des listes de sanctions internationales',
    risk: 'Élevé',
    weight: 3,
  },
  {
    id: 'highRiskCountry',
    label: 'Pays à haut risque',
    description: "Originaire d'un pays à haut risque",
    risk: 'Modéré',
    weight: 2,
  },
  {
    id: 'unreliableInfo',
    label: 'Renseignements incohérents ou non fiables',
    description: 'Les informations fournies sont contradictoires ou douteuses',
    risk: 'Élevé',
    weight: 3,
  },
  {
    id: 'actingForThird',
    label: 'Client agissant pour un tiers',
    description: "Agit pour le compte d'une tierce personne",
    risk: 'Modéré',
    weight: 2,
  },
  {
    id: 'atypicalOperation',
    label: "Caractéristiques atypiques de l'opération",
    description: "Complexité, prix ou rotation atypique de l'opération",
    risk: 'Élevé',
    weight: 3,
  },
  {
    id: 'knownInfractions',
    label: 'Connu pour infractions',
    description: 'Connu pour diverses infractions',
    risk: 'Élevé',
    weight: 3,
  },
  {
    id: 'noClientInfo',
    label: 'Absence de renseignements',
    description: 'Ne fournit aucun renseignement demandé',
    risk: 'Élevé',
    weight: 3,
  },
];

export const fundOriginQuestions: RiskQuestion[] = [
  {
    id: 'legitimateSource',
    label: 'Source légitime des fonds',
    description: "Les fonds proviennent d'une source identifiable et légitime",
    risk: 'Faible',
    weight: 1,
    invertedLogic: true,
  },
  {
    id: 'unusualPattern',
    label: 'Schéma de transaction inhabituel',
    description: 'Les transactions présentent des schémas inhabituels ou suspects',
    risk: 'Élevé',
    weight: 3,
  },
  {
    id: 'cashTransaction',
    label: 'Transaction en espèces importante',
    description: 'Montant important payé en espèces',
    risk: 'Modéré',
    weight: 2,
  },
  {
    id: 'unreliableInfo',
    label: 'Renseignements incohérents ou non fiables',
    description: 'Les informations fournies sont contradictoires ou douteuses',
    risk: 'Élevé',
    weight: 3,
  },
  {
    id: 'actingForThird',
    label: 'Client agissant pour un tiers',
    description: "Le client agit pour le compte d'une tierce personne",
    risk: 'Modéré',
    weight: 2,
  },
  {
    id: 'atypicalOperation',
    label: "Caractéristiques atypiques de l'opération",
    description: "Complexité, prix ou rotation atypique de l'opération",
    risk: 'Élevé',
    weight: 3,
  },
  {
    id: 'knownInfractions',
    label: 'Client connu pour infractions',
    description: 'Le client est connu pour diverses infractions',
    risk: 'Élevé',
    weight: 3,
  },
  {
    id: 'noClientInfo',
    label: 'Absence de renseignements du client',
    description: 'Le client ne fournit aucun renseignement demandé',
    risk: 'Élevé',
    weight: 3,
  },
];
