import type { SanctionCheckResult } from '@/services/sanctions-check';
import type { GafiCheckResult } from '@/config/gafi-lists';
import type { PpeCheckResult } from '@/config/ppe';

// ─── Verification result (defined here to avoid circular imports) ────────

export interface VerificationResult {
  sanctions: SanctionCheckResult;
  gafi: GafiCheckResult;
  ppe: PpeCheckResult;
  autoFlags: Record<string, boolean>;
  completedAt: string;
}

// ─── Entity types ──────────────────────────────────────────────────────────

export interface PhysicalPerson {
  lastName: string;
  firstName: string;
  birthDate: string;
  birthPlace: string;
  nationality: string;
  address: string;
  country: string;
  city: string;
  postalCode: string;
  phone: string;
  email: string;
  idDocument: string;
  idDocumentOther: string;
  idNumber: string;
  profession: string;
  income: string;
  fiscalResidence: string;
}

export interface LegalEntity {
  companyName: string;
  legalForm: string;
  siret: string;
  address: string;
  country: string;
  city: string;
  postalCode: string;
  phone: string;
  email: string;
  activity: string;
  representativeName: string;
  representativePosition: string;
  fiscalResidence: string;
}

export interface PartyData {
  physicalPerson: PhysicalPerson;
  legalEntity: LegalEntity;
}

export interface DocumentChecks {
  justificatifDomicile: boolean;
  titrePropriete: boolean;
  pieceIdentite: boolean;
}

export interface FundData {
  originDescription: string;
  bankDetails: string;
  transactionAmount: string;
  paymentMethod: string;
  justificationDocuments: string;
  additionalNotes: string;
  bankLoan: string;
  lenderBank: string;
}

// ─── Party (individual vendor or acquirer) ───────────────────────────────

export interface Party {
  id: string;
  personType: 'physical' | 'legal';
  physicalPerson: PhysicalPerson;
  legalEntity: LegalEntity;
  documentChecks: DocumentChecks;
  riskChecks: Record<string, boolean>;
  apimoContactId?: number;
  verificationResult?: VerificationResult;
}

export interface PartyScoring {
  partyId: string;
  partyLabel: string;
  score: number;
  level: string;
}

// ─── Assessment / scoring ─────────────────────────────────────────────────

export interface Assessment {
  score: number;
  level: string;
}

// ─── Document & summary ───────────────────────────────────────────────────

export interface DocumentInfo {
  date: string;
  location: string;
  advisorSignature: string;
  managerSignature: string;
}

export interface SummaryData {
  assessments: Record<'vendor' | 'acquirer' | 'fundOrigin', Assessment>;
  totalScore: number;
  overallRisk: string;
  documentInfo: DocumentInfo;
  finalSaveTimestamp?: string;
}

export interface TransactionInfo {
  transactionType: string;
  propertyType: string;
}

// ─── Global app state (stored under key "tracfinGlobalData") ──────────────

export interface GlobalAppData {
  summary: SummaryData;
  transactionInfo: TransactionInfo;
  vendor: { parties: Party[] };
  acquirer: { parties: Party[] };
}

// ─── Full export snapshot (aggregates all localStorage keys) ──────────────

export interface AppSnapshot {
  global: GlobalAppData;
  fund: {
    data: FundData;
    checks: Record<string, boolean>;
  };
  documentInfo: DocumentInfo;
}

// ─── Empty / default values ───────────────────────────────────────────────

export const emptyPhysicalPerson: PhysicalPerson = {
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
  fiscalResidence: '',
};

export const emptyLegalEntity: LegalEntity = {
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
  fiscalResidence: '',
};

export const emptyPartyData: PartyData = {
  physicalPerson: { ...emptyPhysicalPerson },
  legalEntity: { ...emptyLegalEntity },
};

export const emptyDocumentChecks: DocumentChecks = {
  justificatifDomicile: false,
  titrePropriete: false,
  pieceIdentite: false,
};

export const emptyDocumentInfo: DocumentInfo = {
  date: '',
  location: '',
  advisorSignature: '',
  managerSignature: '',
};

export const defaultRiskChecks: Record<string, boolean> = {
  identityVerified: false,
  sanctionsList: false,
  highRiskCountry: false,
  unreliableInfo: false,
  actingForThird: false,
  atypicalOperation: false,
  knownInfractions: false,
  noClientInfo: false,
};

export const defaultFundRiskChecks: Record<string, boolean> = {
  legitimateSource: false,
  unusualPattern: false,
  cashTransaction: false,
  unreliableInfo: false,
  actingForThird: false,
  atypicalOperation: false,
  knownInfractions: false,
  noClientInfo: false,
};

export function createEmptyParty(): Party {
  return {
    id: crypto.randomUUID(),
    personType: 'physical',
    physicalPerson: { ...emptyPhysicalPerson },
    legalEntity: { ...emptyLegalEntity },
    documentChecks: { ...emptyDocumentChecks },
    riskChecks: { ...defaultRiskChecks },
  };
}

export const defaultGlobalAppData: GlobalAppData = {
  summary: {
    assessments: {
      vendor: { score: 0, level: 'Faible' },
      acquirer: { score: 0, level: 'Faible' },
      fundOrigin: { score: 0, level: 'Faible' },
    },
    totalScore: 0,
    overallRisk: 'Faible',
    documentInfo: { ...emptyDocumentInfo },
  },
  transactionInfo: {
    transactionType: '',
    propertyType: '',
  },
  vendor: { parties: [createEmptyParty()] },
  acquirer: { parties: [createEmptyParty()] },
};
