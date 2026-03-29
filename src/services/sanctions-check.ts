// ─── DG Trésor Sanctions Registry Check ─────────────────────────────────────
// Public API: https://gels-avoirs.dgtresor.gouv.fr/ApiPublic
// No authentication required. Registry is cached in memory after first fetch.

export interface SanctionEntry {
  id: string;
  nature: string;          // 'Personne physique' | 'Entité'
  lastName?: string;
  firstName?: string;
  entityName?: string;
  birthDate?: string;
  nationality?: string;
  registryId: string;
}

export interface SanctionCheckResult {
  status: 'clear' | 'hit' | 'error' | 'pending';
  matches: SanctionEntry[];
  checkedAt: string;        // ISO timestamp
  errorMessage?: string;
}

// ─── Module-level cache ──────────────────────────────────────────────────────

let cachedRegistry: SanctionEntry[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

interface DGTresorRegistreNational {
  Registre_detail_get_registre_actifResult?: {
    RegistreNational?: DGTresorEntry[];
  };
}

interface DGTresorEntry {
  IdRegistre?: string;
  Nature?: string;
  Nom?: string;
  Prenom?: string;
  Denomination?: string;
  DateNaissance?: string;
  Nationalite?: string;
}

function mapEntry(raw: DGTresorEntry): SanctionEntry {
  return {
    id: raw.IdRegistre ?? '',
    nature: raw.Nature ?? '',
    lastName: raw.Nom ?? undefined,
    firstName: raw.Prenom ?? undefined,
    entityName: raw.Denomination ?? undefined,
    birthDate: raw.DateNaissance ?? undefined,
    nationality: raw.Nationalite ?? undefined,
    registryId: raw.IdRegistre ?? '',
  };
}

async function loadRegistry(): Promise<SanctionEntry[]> {
  const now = Date.now();
  if (cachedRegistry && now - cacheTimestamp < CACHE_TTL) {
    return cachedRegistry;
  }

  const response = await fetch(
    'https://gels-avoirs.dgtresor.gouv.fr/ApiPublic/api/v1/Registre_detail/get_registre_actif',
    { headers: { Accept: 'application/json' } },
  );

  if (!response.ok) {
    throw new Error(`DG Trésor API error: ${response.status}`);
  }

  const data: DGTresorRegistreNational = await response.json();
  const entries = data?.Registre_detail_get_registre_actifResult?.RegistreNational ?? [];

  cachedRegistry = entries.map(mapEntry);
  cacheTimestamp = now;
  return cachedRegistry;
}

export function clearSanctionsCache(): void {
  cachedRegistry = null;
  cacheTimestamp = 0;
}

// ─── Main check function ─────────────────────────────────────────────────────

export async function checkSanctions(
  lastName: string,
  firstName: string,
  entityName?: string,
): Promise<SanctionCheckResult> {
  const checkedAt = new Date().toISOString();

  if (!lastName && !entityName) {
    return { status: 'clear', matches: [], checkedAt };
  }

  try {
    const registry = await loadRegistry();

    const nLast = normalize(lastName);
    const nFirst = normalize(firstName);
    const nEntity = entityName ? normalize(entityName) : '';

    const matches = registry.filter((entry) => {
      // Physical person match
      if (nLast && entry.lastName) {
        const entryLast = normalize(entry.lastName);
        if (entryLast.includes(nLast) || nLast.includes(entryLast)) {
          // If first name provided, require partial match too
          if (nFirst && entry.firstName) {
            const entryFirst = normalize(entry.firstName);
            return entryFirst.includes(nFirst) || nFirst.includes(entryFirst);
          }
          return true;
        }
      }

      // Entity match
      if (nEntity && entry.entityName) {
        const entryEntity = normalize(entry.entityName);
        return entryEntity.includes(nEntity) || nEntity.includes(entryEntity);
      }

      return false;
    });

    return {
      status: matches.length > 0 ? 'hit' : 'clear',
      matches,
      checkedAt,
    };
  } catch (err) {
    return {
      status: 'error',
      matches: [],
      checkedAt,
      errorMessage: err instanceof Error ? err.message : 'Erreur inconnue',
    };
  }
}
