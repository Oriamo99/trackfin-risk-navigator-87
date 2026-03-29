export interface ApimoCredentials {
  providerId: string;
  token: string;
  agencyId: string;
}

const SESSION_KEY = 'apimo_credentials';

/**
 * Resolve Apimo credentials by priority:
 * 1. Vite environment variables (production)
 * 2. sessionStorage (manual config, current session only)
 * 3. null (not configured)
 */
export function getApimoCredentials(): ApimoCredentials | null {
  // Priority 1: env vars
  const envProvider = import.meta.env.VITE_APIMO_PROVIDER_ID as string | undefined;
  const envToken = import.meta.env.VITE_APIMO_TOKEN as string | undefined;
  const envAgency = import.meta.env.VITE_APIMO_AGENCY_ID as string | undefined;

  if (envProvider && envToken && envAgency) {
    return { providerId: envProvider, token: envToken, agencyId: envAgency };
  }

  // Priority 2: sessionStorage
  const stored = sessionStorage.getItem(SESSION_KEY);
  if (stored) {
    try {
      const parsed: unknown = JSON.parse(stored);
      if (
        typeof parsed === 'object' && parsed !== null &&
        'providerId' in parsed && 'token' in parsed && 'agencyId' in parsed
      ) {
        const creds = parsed as ApimoCredentials;
        if (creds.providerId && creds.token && creds.agencyId) {
          return creds;
        }
      }
    } catch {
      return null;
    }
  }

  return null;
}

export function saveApimoCredentials(creds: ApimoCredentials): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(creds));
}

export function clearApimoCredentials(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function isApimoConfigured(): boolean {
  return getApimoCredentials() !== null;
}
