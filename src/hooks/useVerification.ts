import { useState, useEffect, useRef, useCallback } from 'react';
import { runVerifications, emptyVerificationResult, type VerificationResult } from '@/services/verification-service';
import { evaluatePpe } from '@/config/ppe';
import type { PpeDeclaration } from '@/config/ppe';
import type { Party } from '@/types';

interface UseVerificationReturn {
  result: VerificationResult;
  loading: boolean;
  /** Manually trigger a check */
  recheck: () => void;
  /** PPE declaration state + setter */
  ppeDeclaration: PpeDeclaration;
  setPpeDeclaration: (decl: PpeDeclaration) => void;
}

export function useVerification(
  party: Party | undefined,
): UseVerificationReturn {
  const [result, setResult] = useState<VerificationResult>(emptyVerificationResult);
  const [loading, setLoading] = useState(false);
  const [ppeDeclaration, setPpeDeclaration] = useState<PpeDeclaration>({
    isPpe: false,
    categoryId: null,
    relationship: null,
    details: '',
  });

  const abortRef = useRef(0);

  const doCheck = useCallback(async (p: Party, ppe: PpeDeclaration) => {
    const gen = ++abortRef.current;
    setLoading(true);
    try {
      const res = await runVerifications(p, ppe);
      if (gen === abortRef.current) {
        setResult(res);
      }
    } finally {
      if (gen === abortRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Auto-update PPE only (declarative, no network)
  useEffect(() => {
    if (!party) return;
    const ppe = evaluatePpe(ppeDeclaration);
    setResult(prev => ({ ...prev, ppe }));
  }, [ppeDeclaration, party]);

  const recheck = useCallback(() => {
    if (party) {
      doCheck(party, ppeDeclaration);
    }
  }, [party, ppeDeclaration, doCheck]);

  return { result, loading, recheck, ppeDeclaration, setPpeDeclaration };
}
