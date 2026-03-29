import { describe, it, expect } from 'vitest';
import { mapPropertyToTransaction, getPropertyAmount, mapContactToParty, contactHasTag } from './apimo-mapper';
import type { ApimoProperty, ApimoContact } from '@/types/apimo';

function makeProperty(overrides: Partial<ApimoProperty> = {}): ApimoProperty {
  return {
    id: 1,
    reference: 'REF001',
    agency: 1,
    user: 1,
    step: 1,
    status: 1,
    category: 1,
    subcategory: null,
    type: 1,
    subtype: null,
    name: null,
    address: '1 rue de Paris',
    address_more: '',
    country: 'FR',
    city: { id: 1, name: 'Paris', zipcode: '75001' },
    price: { value: 250000, currency: 'EUR' },
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    ...overrides,
  };
}

function makeContact(overrides: Partial<ApimoContact> = {}): ApimoContact {
  return {
    id: 100,
    category: '1',
    title: 1,
    lastname: 'Dupont',
    firstname: 'Jean',
    name: null,
    email: 'jean@example.com',
    phone: '0601020304',
    mobile: '0611223344',
    address: '5 avenue Victor Hugo',
    address_more: null,
    city: { id: 2, name: 'Lyon', zipcode: '69001' },
    country: 'FR',
    nationality: 'FR',
    birthday_at: '1985-06-15',
    birthplace: 'Lyon',
    job: 'Ingénieur',
    taxcode: null,
    vat_number: null,
    spouse_lastname: null,
    spouse_firstname: null,
    spouse_birthday_at: null,
    spouse_birthplace: null,
    spouse_nationality: null,
    spouse_email: null,
    spouse_mobile: null,
    spouse_job: null,
    tags: ['owner'],
    language: ['fr'],
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    ...overrides,
  };
}

describe('mapPropertyToTransaction', () => {
  it('maps category 1 to vente', () => {
    const result = mapPropertyToTransaction(makeProperty({ category: 1 }));
    expect(result.transactionType).toBe('vente');
  });

  it('maps category 2 to location', () => {
    const result = mapPropertyToTransaction(makeProperty({ category: 2 }));
    expect(result.transactionType).toBe('location');
  });

  it('maps type 1 to appartement', () => {
    const result = mapPropertyToTransaction(makeProperty({ type: 1 }));
    expect(result.propertyType).toBe('appartement');
  });

  it('maps type 2 to maison', () => {
    const result = mapPropertyToTransaction(makeProperty({ type: 2 }));
    expect(result.propertyType).toBe('maison');
  });

  it('defaults to autre for unknown type', () => {
    const result = mapPropertyToTransaction(makeProperty({ type: 999 }));
    expect(result.propertyType).toBe('autre');
  });

  it('defaults to empty string for unknown category', () => {
    const result = mapPropertyToTransaction(makeProperty({ category: 999 }));
    expect(result.transactionType).toBe('');
  });
});

describe('getPropertyAmount', () => {
  it('formats price in French locale', () => {
    const result = getPropertyAmount(makeProperty({ price: { value: 250000, currency: 'EUR' } }));
    // French formatting uses non-breaking spaces
    expect(result.replace(/\s/g, '')).toBe('250000');
  });

  it('returns empty string when no price value', () => {
    expect(getPropertyAmount(makeProperty({ price: { value: null, currency: 'EUR' } }))).toBe('');
  });
});

describe('mapContactToParty', () => {
  it('maps a physical person (category 1)', () => {
    const party = mapContactToParty(makeContact({ category: '1' }));
    expect(party.personType).toBe('physical');
    expect(party.physicalPerson.lastName).toBe('Dupont');
    expect(party.physicalPerson.firstName).toBe('Jean');
    expect(party.physicalPerson.email).toBe('jean@example.com');
    expect(party.physicalPerson.phone).toBe('0611223344'); // mobile preferred
    expect(party.physicalPerson.nationality).toBe('FR');
    expect(party.physicalPerson.profession).toBe('Ingénieur');
    expect(party.apimoContactId).toBe(100);
  });

  it('maps a legal entity (category 3)', () => {
    const party = mapContactToParty(makeContact({
      category: '3',
      name: 'Acme SAS',
      lastname: 'Dupont',
      firstname: 'Jean',
      vat_number: '12345678900010',
    }));
    expect(party.personType).toBe('legal');
    expect(party.legalEntity.companyName).toBe('Acme SAS');
    expect(party.legalEntity.representativeName).toBe('Jean Dupont');
    expect(party.legalEntity.siret).toBe('12345678900010');
  });

  it('handles null fields gracefully', () => {
    const party = mapContactToParty(makeContact({
      lastname: null,
      firstname: null,
      email: null,
      phone: null,
      mobile: null,
      city: null,
    }));
    expect(party.physicalPerson.lastName).toBe('');
    expect(party.physicalPerson.firstName).toBe('');
    expect(party.physicalPerson.phone).toBe('');
    expect(party.physicalPerson.city).toBe('');
  });
});

describe('contactHasTag', () => {
  it('finds exact tag match', () => {
    expect(contactHasTag(makeContact({ tags: ['owner', 'seeker'] }), 'owner')).toBe(true);
  });

  it('finds active_ prefixed tag', () => {
    expect(contactHasTag(makeContact({ tags: ['active_owner'] }), 'active_owner')).toBe(true);
  });

  it('returns false when tag not found', () => {
    expect(contactHasTag(makeContact({ tags: ['seeker'] }), 'owner')).toBe(false);
  });

  it('handles empty tags array', () => {
    expect(contactHasTag(makeContact({ tags: [] }), 'owner')).toBe(false);
  });
});
