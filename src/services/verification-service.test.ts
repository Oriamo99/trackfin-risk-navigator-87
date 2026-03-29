import { describe, it, expect } from 'vitest';
import { computeOcrAutoFlags } from './verification-service';
import type { Party } from '@/types';
import { createEmptyParty } from '@/types';

function makeParty(overrides: Partial<Party> = {}): Party {
  return { ...createEmptyParty(), ...overrides };
}

describe('computeOcrAutoFlags', () => {
  it('sets identityVerified when pieceIdentite is checked', () => {
    const party = makeParty({
      documentChecks: { justificatifDomicile: false, titrePropriete: false, pieceIdentite: true, kbis: false },
    });
    const flags = computeOcrAutoFlags(party);
    expect(flags.identityVerified).toBe(true);
  });

  it('does not set identityVerified without pieceIdentite', () => {
    const party = makeParty({
      documentChecks: { justificatifDomicile: false, titrePropriete: false, pieceIdentite: false, kbis: true },
    });
    const flags = computeOcrAutoFlags(party);
    expect(flags.identityVerified).toBeUndefined();
  });

  it('returns empty flags for default party', () => {
    const party = makeParty();
    const flags = computeOcrAutoFlags(party);
    expect(Object.keys(flags)).toHaveLength(0);
  });
});
