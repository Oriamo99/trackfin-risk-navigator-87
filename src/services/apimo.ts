import { getApimoCredentials } from '@/config/apimo';
import type {
  ApimoProperty,
  ApimoPropertiesResponse,
  ApimoContact,
} from '@/types/apimo';

// In dev, requests go through Vite's proxy to avoid CORS.
// In production, set VITE_APIMO_PROXY_URL to your backend proxy.
const APIMO_BASE_URL = import.meta.env.DEV
  ? '/apimo-api'
  : (import.meta.env.VITE_APIMO_PROXY_URL as string || 'https://api.apimo.pro');

export class ApimoError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApimoError';
  }
}

class ApimoService {
  private getAuthHeader(): string {
    const creds = getApimoCredentials();
    if (!creds) throw new ApimoError(0, 'Apimo non configuré');
    return 'Basic ' + btoa(`${creds.providerId}:${creds.token}`);
  }

  private getAgencyId(): string {
    const creds = getApimoCredentials();
    if (!creds) throw new ApimoError(0, 'Apimo non configuré');
    return creds.agencyId;
  }

  private async request<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${APIMO_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': this.getAuthHeader(),
        'Content-Type': 'application/json',
      },
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
    const agencyId = this.getAgencyId();
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
    const agencyId = this.getAgencyId();
    return this.request<ApimoProperty>(
      `/agencies/${agencyId}/properties/${propertyId}`
    );
  }

  /**
   * Get a contact by ID.
   */
  async getContact(contactId: string | number): Promise<ApimoContact> {
    const agencyId = this.getAgencyId();
    return this.request<ApimoContact>(
      `/agencies/${agencyId}/contacts/${contactId}`
    );
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
