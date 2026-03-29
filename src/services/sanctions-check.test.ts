import { describe, it, expect } from 'vitest';
import { normalizeName, matchesEntry, type SanctionEntry } from './sanctions-check';

describe('normalizeName', () => {
  it('removes accents', () => {
    expect(normalizeName('José García')).toBe('jose garcia');
  });

  it('lowercases', () => {
    expect(normalizeName('DUPONT')).toBe('dupont');
  });

  it('trims whitespace', () => {
    expect(normalizeName('  Jean  Dupont  ')).toBe('jean  dupont');
  });

  it('handles empty string', () => {
    expect(normalizeName('')).toBe('');
  });

  it('handles accented French names', () => {
    expect(normalizeName('Héloïse')).toBe('heloise');
    expect(normalizeName('François')).toBe('francois');
  });
});

describe('matchesEntry', () => {
  const entry: SanctionEntry = {
    id: '1',
    nature: 'Personne physique',
    lastName: 'AL-QAHTANI',
    firstName: 'Mohammed',
    registryId: '1',
  };

  it('matches exact name', () => {
    expect(matchesEntry('AL-QAHTANI', 'Mohammed', entry)).toBe(true);
  });

  it('matches case-insensitive', () => {
    expect(matchesEntry('al-qahtani', 'mohammed', entry)).toBe(true);
  });

  it('does not match unrelated name', () => {
    expect(matchesEntry('DUPONT', 'Jean', entry)).toBe(false);
  });

  it('matches on last name only when no first name given', () => {
    expect(matchesEntry('AL-QAHTANI', '', entry)).toBe(true);
  });

  it('matches entity by name', () => {
    const entityEntry: SanctionEntry = {
      id: '2',
      nature: 'Entité',
      entityName: 'ACME Corporation',
      registryId: '2',
    };
    expect(matchesEntry('', '', entityEntry, 'ACME Corporation')).toBe(true);
    expect(matchesEntry('', '', entityEntry, 'acme')).toBe(true);
    expect(matchesEntry('', '', entityEntry, 'Unknown Corp')).toBe(false);
  });

  it('returns false when both names are empty', () => {
    expect(matchesEntry('', '', entry)).toBe(false);
  });
});
