import { getApimoCredentials } from '@/config/apimo';
import type {
  ApimoProperty,
  ApimoPropertiesResponse,
  ApimoContact,
} from '@/types/apimo';

// In dev, requests go through Vite's proxy to avoid CORS.
// In production, requests go through the Express proxy at /api/apimo.
const APIMO_BASE_URL = import.meta.env.PROD
  ? '/api/apimo'
  : '/apimo-api';

export class ApimoError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApimoError';
  }
}

let _cachedAgencyId: string | null = null;

class ApimoService {
  private getAuthHeader(): string | null {
    // In production, the proxy server handles auth
    if (import.meta.env.PROD) return null;
    const creds = getApimoCredentials();
    if (!creds) throw new ApimoError(0, 'Apimo non configuré');
    return 'Basic ' + btoa(`${creds.providerId}:${creds.token}`);
  }

  private async getAgencyId(): Promise<string> {
    if (!import.meta.env.PROD) {
      const creds = getApimoCredentials();
      if (!creds) throw new ApimoError(0, 'Apimo non configuré');
      return creds.agencyId;
    }

    if (_cachedAgencyId !== null) return _cachedAgencyId;

    try {
      const res = await fetch('/api/config');
      const config = await res.json() as { apimoAgencyId?: string };
      _cachedAgencyId = config.apimoAgencyId || '';
      return _cachedAgencyId;
    } catch {
      console.error('[Apimo] Failed to fetch config');
      return '';
    }
  }

  private async request<T>(endpoint: string): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const auth = this.getAuthHeader();
    if (auth) headers['Authorization'] = auth;

    const response = await fetch(`${APIMO_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({})) as Record<string, unknown>;
      throw new ApimoError(
        response.status,
        (error.detail as string) || (error.title as string) || `Erreur API Apimo (${response.status})`
      );
    }

    return response.json() as Promise<T>;
  }

  /**
   * List active properties (step=1) for the configured agency.
   * TODO: pagination if total_items > limit (max 1000 per request)
   */
  async getProperties(): Promise<ApimoProperty[]> {
    const agencyId = await this.getAgencyId();
    const data = await this.request<ApimoPropertiesResponse>(
      `/agencies/${agencyId}/properties?step=1&limit=1000`
    );
    return data.properties ?? [];
  }

  /**
   * Get full details of a single property.
   * Note: contacts are referenced by ID (owner, tenant), not embedded.
   */
  async getProperty(propertyId: number): Promise<ApimoProperty> {
    const agencyId = await this.getAgencyId();
    return this.request<ApimoProperty>(
      `/agencies/${agencyId}/properties/${propertyId}`
    );
  }

  /**
   * Get a contact by ID.
   */
  async getContact(contactId: string | number): Promise<ApimoContact> {
    const agencyId = await this.getAgencyId();
    return this.request<ApimoContact>(
      `/agencies/${agencyId}/contacts/${contactId}`
    );
  }

  /**
   * Upload un document PDF vers un bien Apimo.
   */
  async uploadDocument(
    propertyId: number,
    fileBlob: Blob,
    fileName: string,
    label?: string,
  ): Promise<void> {
    const agencyId = await this.getAgencyId();
    const formData = new FormData();
    formData.append('file', fileBlob, fileName);
    formData.append('label', label ?? `Évaluation TRACKFIN — ${new Date().toLocaleDateString('fr-FR')}`);

    const headers: Record<string, string> = {};
    const auth = this.getAuthHeader();
    if (auth) headers['Authorization'] = auth;

    const response = await fetch(
      `${APIMO_BASE_URL}/agencies/${agencyId}/properties/${propertyId}/documents`,
      {
        method: 'POST',
        headers,
        body: formData,
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({})) as Record<string, unknown>;
      throw new ApimoError(
        response.status,
        (error.detail as string) || (error.title as string) || `Erreur upload document Apimo (${response.status})`,
      );
    }
  }

  /**
   * Quick connectivity test — tries to list properties.
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getProperties();
      return true;
    } catch {
      return false;
    }
  }
}

export const apimoService = new ApimoService();
