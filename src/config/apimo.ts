export interface ApimoCredentials {
  providerId: string;
  token: string;
  agencyId: string;
}

/**
 * Resolve Apimo credentials from Vite environment variables.
 * Set VITE_APIMO_* in .env.local (never commit real tokens).
 */
export function getApimoCredentials(): ApimoCredentials | null {
  const providerId = import.meta.env.VITE_APIMO_PROVIDER_ID as string | undefined;
  const token = import.meta.env.VITE_APIMO_TOKEN as string | undefined;
  const agencyId = import.meta.env.VITE_APIMO_AGENCY_ID as string | undefined;

  if (providerId && token && agencyId) {
    return { providerId, token, agencyId };
  }
  return null;
}

export function isApimoConfigured(): boolean {
  return getApimoCredentials() !== null;
}
