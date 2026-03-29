// ─── PPE (Personne Politiquement Exposée) ────────────────────────────────────
// Categories per article R.561-18 Code monétaire et financier.
// This is a declarative check — the agent selects a category based on
// the party's declared profession/position.

export interface PpeCategory {
  id: string;
  label: string;
  description: string;
}

export const PPE_CATEGORIES: PpeCategory[] = [
  {
    id: 'head_of_state',
    label: 'Chef d\'État ou de gouvernement',
    description: 'Chef d\'État, chef de gouvernement, membre de gouvernement national ou de la Commission européenne',
  },
  {
    id: 'parliament',
    label: 'Membre de parlement',
    description: 'Membre d\'une assemblée parlementaire nationale ou du Parlement européen',
  },
  {
    id: 'political_party',
    label: 'Dirigeant de parti politique',
    description: 'Membre de la direction d\'un parti ou groupement politique',
  },
  {
    id: 'supreme_court',
    label: 'Membre de cour suprême',
    description: 'Membre de cour suprême, de cour constitutionnelle ou d\'une autre haute juridiction',
  },
  {
    id: 'court_of_auditors',
    label: 'Membre de cour des comptes',
    description: 'Membre d\'une cour des comptes ou d\'un conseil d\'administration de banque centrale',
  },
  {
    id: 'ambassador',
    label: 'Ambassadeur ou chargé d\'affaires',
    description: 'Ambassadeur, chargé d\'affaires, consul général ou consul de carrière',
  },
  {
    id: 'military',
    label: 'Officier général ou officier supérieur',
    description: 'Officier général ou officier supérieur assurant le commandement d\'une armée',
  },
  {
    id: 'state_enterprise',
    label: 'Dirigeant d\'entreprise publique',
    description: 'Membre d\'un organe d\'administration, de direction ou de surveillance d\'une entreprise publique',
  },
  {
    id: 'international_org',
    label: 'Dirigeant d\'organisation internationale',
    description: 'Dirigeant ou membre de la direction d\'une organisation internationale publique',
  },
];

export interface PpeDeclaration {
  isPpe: boolean;
  categoryId: string | null;
  relationship: 'direct' | 'family' | 'associate' | null;
  details: string;
}

export const emptyPpeDeclaration: PpeDeclaration = {
  isPpe: false,
  categoryId: null,
  relationship: null,
  details: '',
};

export interface PpeCheckResult {
  status: 'clear' | 'declared';
  declaration: PpeDeclaration;
  checkedAt: string;
}

export function evaluatePpe(declaration: PpeDeclaration): PpeCheckResult {
  return {
    status: declaration.isPpe ? 'declared' : 'clear',
    declaration,
    checkedAt: new Date().toISOString(),
  };
}
