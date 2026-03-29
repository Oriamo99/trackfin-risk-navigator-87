// ─── Apimo API response types ────────────────────────────────────────────
// Verified against live API responses (March 2026).

export interface ApimoProperty {
  id: number;
  reference: number | string;
  agency: number;
  user: { id: string; agency: string } | number;
  step: number;                // 1=In progress, 2=Standby, 3=Closed, 4=Deleted
  status: number;              // 1=En cours, 22=Sous offre, 24=Sous contrat, 25=Attente acte, etc.
  category: number;            // Transaction type: 1=Vente, 2=Location, 3=Saisonnière, 4=Programme, 5=Viager, 6=Enchère
  subcategory: number | null;
  type: number;                // Property type: 1=Appartement, 2=Maison, 3=Terrain, 4=Commerce, 5=Garage, 6=Immeuble, 7=Bureau, 8=Bateau, 9=Entrepôts, 10=Cave/Box
  subtype: number | null;
  name: string | null;
  address: string;
  address_more: string;
  country: string;             // ISO 2-letter code (e.g. "FR")
  city: {
    id: number;
    name: string;
    zipcode: string;
  };
  district?: {
    id: number;
    name: string;
  } | null;
  price: {
    value: number | null;
    currency: string;
    fees?: number | null;
    sold?: number | null;
  };
  area?: {
    value: number;
    unit: number;
    total?: number | null;
  };
  rooms?: number;
  bedrooms?: number;
  // Contacts are referenced by ID, not embedded
  owner?: string | null;       // Contact ID of the owner
  tenant?: string | null;      // Contact ID of the tenant
  created_at: string;
  updated_at: string;
}

// ─── Contact ─────────────────────────────────────────────────────────────

export interface ApimoContact {
  id: number;
  category: string;            // "1" = particulier, "2" = couple/co-indivision, "3" = société
  title: number | null;        // Civility (1=Mr, 2=Mrs, etc.)
  lastname: string | null;
  firstname: string | null;
  name: string | null;         // Company/entity name
  email: string | null;
  phone: string | null;
  mobile: string | null;
  address: string | null;
  address_more: string | null;
  city: {
    id: number;
    name: string;
    zipcode: string;
  } | null;
  country: string | null;      // ISO 2-letter code
  nationality: string | null;
  birthday_at: string | null;  // Date of birth
  birthplace: string | null;
  job: string | null;
  taxcode: string | null;      // Tax ID / NIF
  vat_number: string | null;   // VAT number (companies)
  // Spouse fields (for couples)
  spouse_lastname: string | null;
  spouse_firstname: string | null;
  spouse_birthday_at: string | null;
  spouse_birthplace: string | null;
  spouse_nationality: string | null;
  spouse_email: string | null;
  spouse_mobile: string | null;
  spouse_job: string | null;
  // Metadata
  tags: string[];              // Roles: "owner", "active_owner", "seeker", "active_seeker"
  language: string[];
  created_at: string;
  updated_at: string;
}

// ─── API list response wrappers ──────────────────────────────────────────

export interface ApimoPropertiesResponse {
  total_items: number;
  properties: ApimoProperty[];
}

export interface ApimoContactsResponse {
  total_items: number;
  contacts: ApimoContact[];
}
