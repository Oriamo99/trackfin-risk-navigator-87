import type { ApimoProperty, ApimoContact } from '@/types/apimo';
import type { Party, TransactionInfo } from '@/types';
import { createEmptyParty } from '@/types';

// ─── Apimo referentials ──────────────────────────────────────────────────

// category = transaction type
const TRANSACTION_TYPE_MAP: Record<number, string> = {
  1: 'vente',
  2: 'location',
  3: 'location',    // saisonnière → location
  5: 'vente',       // viager → vente
  6: 'vente',       // enchère → vente
};

// type = property type
const PROPERTY_TYPE_MAP: Record<number, string> = {
  1: 'appartement',
  2: 'maison',
  3: 'terrain',
  4: 'commerce',
  5: 'garage',
  6: 'autre',       // immeuble
  7: 'bureau',
  8: 'autre',       // bateau
  9: 'entrepot',    // locaux d'activité / entrepôts
  10: 'autre',      // cave / box
};

// ─── Property → Transaction info ─────────────────────────────────────────

export function mapPropertyToTransaction(property: ApimoProperty): Partial<TransactionInfo> {
  return {
    transactionType: TRANSACTION_TYPE_MAP[property.category] ?? '',
    propertyType: PROPERTY_TYPE_MAP[property.type] ?? 'autre',
  };
}

/**
 * Extract the formatted transaction amount from an Apimo property.
 */
export function getPropertyAmount(property: ApimoProperty): string {
  const value = property.price?.value;
  if (!value) return '';
  return Intl.NumberFormat('fr-FR', { useGrouping: true, maximumFractionDigits: 0 }).format(value);
}

// ─── Contact → Party ─────────────────────────────────────────────────────

/**
 * Map an Apimo contact to a Party object for the TRACKFIN form.
 * Contact category: "1" = particulier, "2" = couple, "3" = société.
 */
export function mapContactToParty(contact: ApimoContact): Party {
  const party = createEmptyParty();

  // category "3" = société (legal entity)
  const isLegal = contact.category === '3';

  if (isLegal) {
    party.personType = 'legal';
    party.legalEntity = {
      ...party.legalEntity,
      companyName: contact.name ?? '',
      phone: contact.mobile ?? contact.phone ?? '',
      email: contact.email ?? '',
      address: contact.address ?? '',
      city: contact.city?.name ?? '',
      postalCode: contact.city?.zipcode ?? '',
      country: contact.country ?? '',
      representativeName: [contact.firstname, contact.lastname].filter(Boolean).join(' '),
      siret: contact.vat_number ?? '',
    };
  } else {
    party.personType = 'physical';
    party.physicalPerson = {
      ...party.physicalPerson,
      lastName: contact.lastname ?? '',
      firstName: contact.firstname ?? '',
      nationality: contact.nationality ?? '',
      birthDate: contact.birthday_at ?? '',
      birthPlace: contact.birthplace ?? '',
      phone: contact.mobile ?? contact.phone ?? '',
      email: contact.email ?? '',
      address: contact.address ?? '',
      city: contact.city?.name ?? '',
      postalCode: contact.city?.zipcode ?? '',
      country: contact.country ?? '',
      profession: contact.job ?? '',
    };
  }

  party.apimoContactId = contact.id;
  return party;
}

/**
 * Check if a contact has a specific role tag.
 */
export function contactHasTag(contact: ApimoContact, tag: string): boolean {
  return (contact.tags ?? []).some(t => t === tag || t === `active_${tag}`);
}
