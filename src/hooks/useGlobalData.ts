import { useCallback, useEffect, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';
import {
  defaultGlobalAppData,
  emptyDocumentInfo,
  defaultFundRiskChecks,
  createEmptyParty,
  emptyPhysicalPerson,
  emptyLegalEntity,
  emptyDocumentChecks,
  defaultRiskChecks,
} from '@/types';
import type {
  GlobalAppData,
  SummaryData,
  TransactionInfo,
  AppSnapshot,
  FundData,
  DocumentInfo,
  Party,
  PartyData,
  DocumentChecks,
} from '@/types';

// ─── localStorage keys still used ───────────────────────────────────────

const STORAGE_KEYS = [
  'tracfinGlobalData',
  'fundOriginChecks',
  'fundData',
  'fundsDocumentChecks',
  'riskSummaryDocumentInfo',
] as const;

// Old keys from pre-multi-party era (used only in migration)
const OLD_PARTY_KEYS = [
  'vendorData', 'vendorPersonType', 'vendorChecks', 'vendorDocumentChecks',
  'acquirerData', 'acquirerPersonType', 'acquirerChecks', 'acquirerDocumentChecks',
] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────

function readKey<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

// ─── Migration from old single-party format ──────────────────────────────

function migrateOldData(): GlobalAppData | null {
  const hasOldKeys = OLD_PARTY_KEYS.some(k => window.localStorage.getItem(k) !== null);
  if (!hasOldKeys) return null;

  // Read existing global data as base
  const existing = readKey<GlobalAppData>('tracfinGlobalData', defaultGlobalAppData);

  // Already migrated? (has parties with data)
  if (existing.vendor?.parties?.length > 0 && existing.vendor.parties[0].physicalPerson.lastName !== '') {
    // Clean up old keys just in case
    OLD_PARTY_KEYS.forEach(k => window.localStorage.removeItem(k));
    return null;
  }

  // Migrate vendor
  const vendorData = readKey<PartyData>('vendorData', { physicalPerson: { ...emptyPhysicalPerson }, legalEntity: { ...emptyLegalEntity } });
  const vendorPersonType = readKey<'physical' | 'legal'>('vendorPersonType', 'physical');
  const vendorChecks = readKey<Record<string, boolean>>('vendorChecks', { ...defaultRiskChecks });
  const vendorDocChecks = readKey<DocumentChecks>('vendorDocumentChecks', { ...emptyDocumentChecks });

  const vendorParty: Party = {
    id: crypto.randomUUID(),
    personType: vendorPersonType,
    physicalPerson: vendorData.physicalPerson,
    legalEntity: vendorData.legalEntity,
    documentChecks: vendorDocChecks,
    riskChecks: vendorChecks,
  };

  // Migrate acquirer
  const acquirerData = readKey<PartyData>('acquirerData', { physicalPerson: { ...emptyPhysicalPerson }, legalEntity: { ...emptyLegalEntity } });
  const acquirerPersonType = readKey<'physical' | 'legal'>('acquirerPersonType', 'physical');
  const acquirerChecks = readKey<Record<string, boolean>>('acquirerChecks', { ...defaultRiskChecks });
  const acquirerDocChecks = readKey<DocumentChecks>('acquirerDocumentChecks', { ...emptyDocumentChecks });

  const acquirerParty: Party = {
    id: crypto.randomUUID(),
    personType: acquirerPersonType,
    physicalPerson: acquirerData.physicalPerson,
    legalEntity: acquirerData.legalEntity,
    documentChecks: acquirerDocChecks,
    riskChecks: acquirerChecks,
  };

  const migrated: GlobalAppData = {
    ...existing,
    vendor: { parties: [vendorParty] },
    acquirer: { parties: [acquirerParty] },
  };

  // Remove old keys
  OLD_PARTY_KEYS.forEach(k => window.localStorage.removeItem(k));

  return migrated;
}

// ─── Hook ────────────────────────────────────────────────────────────────

export const useGlobalData = () => {
  const [globalData, setGlobalData] = useLocalStorage<GlobalAppData>(
    'tracfinGlobalData',
    defaultGlobalAppData
  );

  // Run migration once on mount
  const migrated = useRef(false);
  useEffect(() => {
    if (migrated.current) return;
    migrated.current = true;
    const result = migrateOldData();
    if (result) {
      setGlobalData(result);
    }
  }, [setGlobalData]);

  const updateSummaryData = useCallback((data: Partial<SummaryData>) => {
    setGlobalData(prev => ({
      ...prev,
      summary: { ...prev.summary, ...data },
    }));
  }, [setGlobalData]);

  const updateTransactionInfo = useCallback((data: Partial<TransactionInfo>) => {
    setGlobalData(prev => ({
      ...prev,
      transactionInfo: { ...prev.transactionInfo, ...data },
    }));
  }, [setGlobalData]);

  // ─── Party management ────────────────────────────────────────────────

  const addParty = useCallback((side: 'vendor' | 'acquirer') => {
    setGlobalData(prev => ({
      ...prev,
      [side]: {
        parties: [...prev[side].parties, createEmptyParty()],
      },
    }));
  }, [setGlobalData]);

  const removeParty = useCallback((side: 'vendor' | 'acquirer', partyId: string) => {
    setGlobalData(prev => {
      if (prev[side].parties.length <= 1) return prev; // Never remove the last one
      return {
        ...prev,
        [side]: {
          parties: prev[side].parties.filter(p => p.id !== partyId),
        },
      };
    });
  }, [setGlobalData]);

  const updateParty = useCallback((side: 'vendor' | 'acquirer', partyId: string, data: Partial<Party>) => {
    setGlobalData(prev => ({
      ...prev,
      [side]: {
        parties: prev[side].parties.map(p =>
          p.id === partyId ? { ...p, ...data } : p
        ),
      },
    }));
  }, [setGlobalData]);

  // ─── Reset & export ──────────────────────────────────────────────────

  const resetAllData = useCallback(() => {
    STORAGE_KEYS.forEach(key => window.localStorage.removeItem(key));
    OLD_PARTY_KEYS.forEach(key => window.localStorage.removeItem(key));
    setGlobalData(defaultGlobalAppData);
  }, [setGlobalData]);

  const exportAllData = useCallback((): AppSnapshot => ({
    global: readKey<GlobalAppData>('tracfinGlobalData', defaultGlobalAppData),
    fund: {
      data: readKey<FundData>('fundData', {
        originDescription: '',
        bankDetails: '',
        transactionAmount: '',
        paymentMethod: '',
        justificationDocuments: '',
        additionalNotes: '',
        bankLoan: '',
        lenderBank: '',
      }),
      checks: readKey<Record<string, boolean>>('fundOriginChecks', { ...defaultFundRiskChecks }),
    },
    documentInfo: readKey<DocumentInfo>('riskSummaryDocumentInfo', { ...emptyDocumentInfo }),
  }), []);

  return {
    globalData,
    updateSummaryData,
    updateTransactionInfo,
    addParty,
    removeParty,
    updateParty,
    resetAllData,
    exportAllData,
    setGlobalData,
  };
};
