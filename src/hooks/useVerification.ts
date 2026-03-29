import { useState, useEffect, useRef, useCallback } from 'react';
import { runVerifications, emptyVerificationResult, type VerificationResult } from '@/services/verification-service';
import type { PpeDeclaration } from '@/config/ppe';
import type { Party } from '@/types';

interface UseVerificationOptions {
  /** Debounce delay in ms (default 1000) */
  debounceMs?: number;
}

interface UseVerificationReturn {
  result: VerificationResult;
  loading: boolean;
  /** Manually trigger a re-check */
  recheck: () => void;
  /** PPE declaration state + setter */
  ppeDeclaration: PpeDeclaration;
  setPpeDeclaration: (decl: PpeDeclaration) => void;
}

export function useVerification(
  party: Party | undefined,
  options: UseVerificationOptions = {},
): UseVerificationReturn {
  const { debounceMs = 1000 } = options;

  const [result, setResult] = useState<VerificationResult>(emptyVerificationResult);
  const [loading, setLoading] = useState(false);
  const [ppeDeclaration, setPpeDeclaration] = useState<PpeDeclaration>({
    isPpe: false,
    categoryId: null,
    relationship: null,
    details: '',
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef(0); // generation counter to discard stale results

  const doCheck = useCallback(async (p: Party, ppe: PpeDeclaration) => {
    const gen = ++abortRef.current;
    setLoading(true);
    try {
      const res = await runVerifications(p, ppe);
      // Only apply if this is still the latest request
      if (gen === abortRef.current) {
        setResult(res);
      }
    } finally {
      if (gen === abortRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Debounced auto-check when party identity fields change
  useEffect(() => {
    if (!party) return;

    // Build a fingerprint from the fields that matter for verification
    const fp = party.personType === 'physical'
      ? `${party.physicalPerson.lastName}|${party.physicalPerson.firstName}|${party.physicalPerson.nationality}|${party.physicalPerson.country}|${party.physicalPerson.fiscalResidence}`
      : `${party.legalEntity.companyName}|${party.legalEntity.country}|${party.legalEntity.fiscalResidence}`;

    // Skip if all fields are empty
    const hasData = fp.split('|').some(s => s.trim() !== '');
    if (!hasData) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      doCheck(party, ppeDeclaration);
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [party, ppeDeclaration, debounceMs, doCheck]);

  const recheck = useCallback(() => {
    if (party) {
      doCheck(party, ppeDeclaration);
    }
  }, [party, ppeDeclaration, doCheck]);

  return { result, loading, recheck, ppeDeclaration, setPpeDeclaration };
}
