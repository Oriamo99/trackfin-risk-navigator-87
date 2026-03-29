// ─── GAFI Black & Grey Lists ─────────────────────────────────────────────────
// Static config, updated ~3x/year following GAFI plenary sessions.
// Last update: February 2026 (GAFI plenary).
// Source: https://www.fatf-gafi.org/fr/countries/liste-noire-et-liste-gris.html

/** Date of last GAFI list update (set manually after each plenary) */
export const GAFI_LAST_UPDATE = '2026-02-13';

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

export interface GafiCountry {
  nameFr: string;
  nameEn: string;
  aliases: string[];
  iso2: string;
}

// ─── Black list (High-Risk Jurisdictions Subject to a Call for Action) ───────
// 3 countries — unchanged since October 2024.

export const GAFI_BLACK_LIST: GafiCountry[] = [
  {
    nameFr: 'Corée du Nord',
    nameEn: 'North Korea',
    aliases: ['DPRK', 'Democratic People\'s Republic of Korea', 'RPDC', 'République populaire démocratique de Corée'],
    iso2: 'KP',
  },
  {
    nameFr: 'Iran',
    nameEn: 'Iran',
    aliases: ['République islamique d\'Iran', 'Islamic Republic of Iran'],
    iso2: 'IR',
  },
  {
    nameFr: 'Myanmar',
    nameEn: 'Myanmar',
    aliases: ['Burma', 'Birmanie'],
    iso2: 'MM',
  },
];

// ─── Grey list (Jurisdictions Under Increased Monitoring) ────────────────────
// 22 countries — February 2026 plenary.
// Changes from Feb 2025:
//   Added: Bolivia, British Virgin Islands (June 2025), Kuwait, Papua New Guinea (Feb 2026)
//   Removed: Croatia, Mali, Tanzania (June 2025), Philippines (Feb 2025),
//            Burkina Faso, Mozambique, Nigeria, South Africa (Oct 2025)

export const GAFI_GREY_LIST: GafiCountry[] = [
  { nameFr: 'Algérie', nameEn: 'Algeria', aliases: [], iso2: 'DZ' },
  { nameFr: 'Angola', nameEn: 'Angola', aliases: [], iso2: 'AO' },
  { nameFr: 'Bolivie', nameEn: 'Bolivia', aliases: ['État plurinational de Bolivie', 'Plurinational State of Bolivia'], iso2: 'BO' },
  { nameFr: 'Bulgarie', nameEn: 'Bulgaria', aliases: [], iso2: 'BG' },
  { nameFr: 'Cameroun', nameEn: 'Cameroon', aliases: [], iso2: 'CM' },
  { nameFr: 'Côte d\'Ivoire', nameEn: 'Côte d\'Ivoire', aliases: ['Ivory Coast'], iso2: 'CI' },
  { nameFr: 'République démocratique du Congo', nameEn: 'Democratic Republic of the Congo', aliases: ['RDC', 'DRC', 'Congo-Kinshasa', 'DR Congo'], iso2: 'CD' },
  { nameFr: 'Haïti', nameEn: 'Haiti', aliases: [], iso2: 'HT' },
  { nameFr: 'Kenya', nameEn: 'Kenya', aliases: [], iso2: 'KE' },
  { nameFr: 'Koweït', nameEn: 'Kuwait', aliases: [], iso2: 'KW' },
  { nameFr: 'Laos', nameEn: 'Lao PDR', aliases: ['Lao People\'s Democratic Republic', 'LPDR', 'République démocratique populaire lao'], iso2: 'LA' },
  { nameFr: 'Liban', nameEn: 'Lebanon', aliases: [], iso2: 'LB' },
  { nameFr: 'Monaco', nameEn: 'Monaco', aliases: [], iso2: 'MC' },
  { nameFr: 'Namibie', nameEn: 'Namibia', aliases: [], iso2: 'NA' },
  { nameFr: 'Népal', nameEn: 'Nepal', aliases: [], iso2: 'NP' },
  { nameFr: 'Papouasie-Nouvelle-Guinée', nameEn: 'Papua New Guinea', aliases: ['PNG'], iso2: 'PG' },
  { nameFr: 'Soudan du Sud', nameEn: 'South Sudan', aliases: [], iso2: 'SS' },
  { nameFr: 'Syrie', nameEn: 'Syria', aliases: ['Syrian Arab Republic', 'République arabe syrienne'], iso2: 'SY' },
  { nameFr: 'Venezuela', nameEn: 'Venezuela', aliases: ['République bolivarienne du Venezuela', 'Bolivarian Republic of Venezuela'], iso2: 'VE' },
  { nameFr: 'Vietnam', nameEn: 'Vietnam', aliases: ['Viet Nam', 'Viêt Nam'], iso2: 'VN' },
  { nameFr: 'Îles Vierges britanniques', nameEn: 'Virgin Islands (UK)', aliases: ['British Virgin Islands', 'BVI', 'IVB'], iso2: 'VG' },
  { nameFr: 'Yémen', nameEn: 'Yemen', aliases: [], iso2: 'YE' },
];

// ─── Lookup helpers ──────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** Build a lookup Set from all names/aliases in a country list (normalized). */
function buildLookup(list: GafiCountry[]): Set<string> {
  const set = new Set<string>();
  for (const c of list) {
    set.add(normalize(c.nameFr));
    set.add(normalize(c.nameEn));
    set.add(c.iso2.toLowerCase());
    for (const alias of c.aliases) {
      set.add(normalize(alias));
    }
  }
  return set;
}

const BLACK_LOOKUP = buildLookup(GAFI_BLACK_LIST);
const GREY_LOOKUP = buildLookup(GAFI_GREY_LIST);

export function checkGafiCountry(country: string): GafiCheckResult {
  const checkedAt = new Date().toISOString();

  if (!country.trim()) {
    return { listType: 'none', country: '', checkedAt };
  }

  const n = normalize(country);

  if (BLACK_LOOKUP.has(n)) {
    return { listType: 'black', country: n, checkedAt };
  }

  if (GREY_LOOKUP.has(n)) {
    return { listType: 'grey', country: n, checkedAt };
  }

  return { listType: 'none', country: n, checkedAt };
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
