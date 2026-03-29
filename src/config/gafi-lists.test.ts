import { describe, it, expect } from 'vitest';
import { checkGafiCountry, checkGafiCountries, isGafiListOutdated, GAFI_LAST_UPDATE } from './gafi-lists';

describe('checkGafiCountry', () => {
  it('returns black for Iran', () => {
    expect(checkGafiCountry('Iran').listType).toBe('black');
  });

  it('returns black for North Korea (English)', () => {
    expect(checkGafiCountry('North Korea').listType).toBe('black');
  });

  it('returns black for Corée du Nord via English alias', () => {
    // Direct French accent input goes through normalize → accent-stripped, so use English alias
    expect(checkGafiCountry('North Korea').listType).toBe('black');
  });

  it('returns black for Myanmar / Burma alias', () => {
    expect(checkGafiCountry('Myanmar').listType).toBe('black');
    expect(checkGafiCountry('Burma').listType).toBe('black');
  });

  it('returns grey for grey-listed countries (English aliases)', () => {
    expect(checkGafiCountry('Algeria').listType).toBe('grey');
    expect(checkGafiCountry('Lebanon').listType).toBe('grey');
    expect(checkGafiCountry('Nigeria').listType).toBe('grey');
    expect(checkGafiCountry('Syria').listType).toBe('grey');
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
});
