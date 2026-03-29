// ─── GAFI Black & Grey Lists ─────────────────────────────────────────────────
// Static config, updated ~3x/year following GAFI plenary sessions.
// Last update: February 2025 (GAFI plenary).
// Source: https://www.fatf-gafi.org/fr/countries/liste-noire-et-liste-gris.html

/** Date of last GAFI list update (set manually after each plenary) */
export const GAFI_LAST_UPDATE = '2025-02-01';

/** Returns true if GAFI lists are potentially outdated (>6 months old) */
export function isGafiListOutdated(): boolean {
  const lastUpdate = new Date(GAFI_LAST_UPDATE);
  const now = new Date();
  const diffMs = now.getTime() - lastUpdate.getTime();
  const sixMonthsMs = 6 * 30 * 24 * 60 * 60 * 1000;
  return diffMs > sixMonthsMs;
}

export type GafiListType = 'black' | 'grey' | 'none';

export interface GafiCheckResult {
  listType: GafiListType;
  country: string;
  checkedAt: string;
}

// ─── Black list (High-Risk Jurisdictions Subject to a Call for Action) ───────
// These countries have significant strategic deficiencies in their AML/CFT regimes.

const BLACK_LIST = new Set([
  'corée du nord',
  'iran',
  'myanmar',
]);

// ─── Grey list (Jurisdictions Under Increased Monitoring) ────────────────────

const GREY_LIST = new Set([
  'algérie',
  'angola',
  'bulgarie',
  'burkina faso',
  'cameroun',
  'côte d\'ivoire',
  'croatie',
  'haïti',
  'kenya',
  'liban',
  'mali',
  'monaco',
  'mozambique',
  'namibie',
  'nigéria',
  'philippines',
  'république démocratique du congo',
  'sénégal',
  'soudan du sud',
  'syrie',
  'tanzanie',
  'venezuela',
  'vietnam',
  'yémen',
]);

// ─── English → French country name mapping (for Apimo data) ─────────────────

const COUNTRY_ALIASES: Record<string, string> = {
  'north korea': 'corée du nord',
  'south korea': 'corée du sud',
  'iran': 'iran',
  'myanmar': 'myanmar',
  'burma': 'myanmar',
  'algeria': 'algérie',
  'angola': 'angola',
  'bulgaria': 'bulgarie',
  'burkina faso': 'burkina faso',
  'cameroon': 'cameroun',
  'ivory coast': 'côte d\'ivoire',
  'croatia': 'croatie',
  'haiti': 'haïti',
  'kenya': 'kenya',
  'lebanon': 'liban',
  'mali': 'mali',
  'monaco': 'monaco',
  'mozambique': 'mozambique',
  'namibia': 'namibie',
  'nigeria': 'nigéria',
  'philippines': 'philippines',
  'democratic republic of the congo': 'république démocratique du congo',
  'senegal': 'sénégal',
  'south sudan': 'soudan du sud',
  'syria': 'syrie',
  'tanzania': 'tanzanie',
  'venezuela': 'venezuela',
  'vietnam': 'vietnam',
  'yemen': 'yémen',
};

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function toFrench(country: string): string {
  const n = normalize(country);
  // Check alias table first (handles English names)
  for (const [en, fr] of Object.entries(COUNTRY_ALIASES)) {
    if (normalize(en) === n) return fr;
  }
  // Return normalized input (assume already French)
  return n;
}

export function checkGafiCountry(country: string): GafiCheckResult {
  const checkedAt = new Date().toISOString();

  if (!country.trim()) {
    return { listType: 'none', country: '', checkedAt };
  }

  const fr = toFrench(country);

  if (BLACK_LIST.has(fr)) {
    return { listType: 'black', country: fr, checkedAt };
  }

  if (GREY_LIST.has(fr)) {
    return { listType: 'grey', country: fr, checkedAt };
  }

  return { listType: 'none', country: fr, checkedAt };
}

/** Check multiple countries at once, return the worst result. */
export function checkGafiCountries(countries: string[]): GafiCheckResult {
  const results = countries.filter(Boolean).map(checkGafiCountry);

  const black = results.find(r => r.listType === 'black');
  if (black) return black;

  const grey = results.find(r => r.listType === 'grey');
  if (grey) return grey;

  return {
    listType: 'none',
    country: '',
    checkedAt: new Date().toISOString(),
  };
}
