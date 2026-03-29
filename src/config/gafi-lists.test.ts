import { describe, it, expect } from 'vitest';
import { checkGafiCountry, checkGafiCountries, isGafiListOutdated, GAFI_LAST_UPDATE } from './gafi-lists';

describe('checkGafiCountry', () => {
  it('returns black for Iran', () => {
    expect(checkGafiCountry('Iran').listType).toBe('black');
  });

  it('returns black for North Korea (English)', () => {
    expect(checkGafiCountry('North Korea').listType).toBe('black');
  });

  it('returns black for Corée du Nord (French)', () => {
    expect(checkGafiCountry('Corée du Nord').listType).toBe('black');
  });

  it('returns black for Myanmar / Burma alias', () => {
    expect(checkGafiCountry('Myanmar').listType).toBe('black');
    expect(checkGafiCountry('Burma').listType).toBe('black');
    expect(checkGafiCountry('Birmanie').listType).toBe('black');
  });

  it('returns black for ISO2 codes', () => {
    expect(checkGafiCountry('KP').listType).toBe('black');
    expect(checkGafiCountry('IR').listType).toBe('black');
    expect(checkGafiCountry('MM').listType).toBe('black');
  });

  it('returns grey for grey-listed countries (English)', () => {
    expect(checkGafiCountry('Algeria').listType).toBe('grey');
    expect(checkGafiCountry('Lebanon').listType).toBe('grey');
    expect(checkGafiCountry('Syria').listType).toBe('grey');
  });

  it('returns grey for grey-listed countries (French)', () => {
    expect(checkGafiCountry('Algérie').listType).toBe('grey');
    expect(checkGafiCountry('Liban').listType).toBe('grey');
    expect(checkGafiCountry('Syrie').listType).toBe('grey');
  });

  it('returns grey for new Feb 2026 additions', () => {
    expect(checkGafiCountry('Kuwait').listType).toBe('grey');
    expect(checkGafiCountry('Koweït').listType).toBe('grey');
    expect(checkGafiCountry('Papua New Guinea').listType).toBe('grey');
    expect(checkGafiCountry('Papouasie-Nouvelle-Guinée').listType).toBe('grey');
    expect(checkGafiCountry('Bolivia').listType).toBe('grey');
    expect(checkGafiCountry('Bolivie').listType).toBe('grey');
    expect(checkGafiCountry('British Virgin Islands').listType).toBe('grey');
    expect(checkGafiCountry('Îles Vierges britanniques').listType).toBe('grey');
  });

  it('returns none for countries removed from grey list', () => {
    expect(checkGafiCountry('Nigeria').listType).toBe('none');
    expect(checkGafiCountry('Croatia').listType).toBe('none');
    expect(checkGafiCountry('Croatie').listType).toBe('none');
    expect(checkGafiCountry('Philippines').listType).toBe('none');
    expect(checkGafiCountry('Mali').listType).toBe('none');
    expect(checkGafiCountry('Tanzania').listType).toBe('none');
    expect(checkGafiCountry('Burkina Faso').listType).toBe('none');
    expect(checkGafiCountry('Mozambique').listType).toBe('none');
  });

  it('returns none for safe countries', () => {
    expect(checkGafiCountry('France').listType).toBe('none');
    expect(checkGafiCountry('Germany').listType).toBe('none');
  });

  it('returns none for empty string', () => {
    const result = checkGafiCountry('');
    expect(result.listType).toBe('none');
    expect(result.country).toBe('');
  });

  it('is case-insensitive', () => {
    expect(checkGafiCountry('IRAN').listType).toBe('black');
    expect(checkGafiCountry('ALGERIA').listType).toBe('grey');
    expect(checkGafiCountry('NORTH KOREA').listType).toBe('black');
  });

  it('matches by ISO2 code for grey list', () => {
    expect(checkGafiCountry('DZ').listType).toBe('grey');
    expect(checkGafiCountry('KW').listType).toBe('grey');
    expect(checkGafiCountry('VG').listType).toBe('grey');
  });

  it('includes checkedAt timestamp', () => {
    const result = checkGafiCountry('France');
    expect(result.checkedAt).toBeTruthy();
    expect(() => new Date(result.checkedAt)).not.toThrow();
  });
});

describe('checkGafiCountries', () => {
  it('returns the worst result (black > grey > none)', () => {
    expect(checkGafiCountries(['France', 'Iran']).listType).toBe('black');
    expect(checkGafiCountries(['France', 'Algeria']).listType).toBe('grey');
    expect(checkGafiCountries(['France', 'Germany']).listType).toBe('none');
  });

  it('handles empty array', () => {
    expect(checkGafiCountries([]).listType).toBe('none');
  });

  it('filters out empty strings', () => {
    expect(checkGafiCountries(['', '', 'Iran']).listType).toBe('black');
  });
});

describe('isGafiListOutdated', () => {
  it('returns a boolean', () => {
    expect(typeof isGafiListOutdated()).toBe('boolean');
  });

  it('GAFI_LAST_UPDATE is a valid date string', () => {
    const d = new Date(GAFI_LAST_UPDATE);
    expect(d.getTime()).not.toBeNaN();
  });

  it('GAFI_LAST_UPDATE is Feb 2026', () => {
    expect(GAFI_LAST_UPDATE).toBe('2026-02-13');
  });
});
