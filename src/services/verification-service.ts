// ─── Unified Verification Service ────────────────────────────────────────────
// Orchestrates DG Trésor sanctions, GAFI country, and PPE checks.
// Returns a combined result with auto-flag recommendations.

import { checkSanctions, type SanctionCheckResult } from '@/services/sanctions-check';
import { checkGafiCountries, type GafiCheckResult } from '@/config/gafi-lists';
import { evaluatePpe, type PpeCheckResult, type PpeDeclaration, emptyPpeDeclaration } from '@/config/ppe';
import type { Party, VerificationResult } from '@/types';

export type { VerificationResult };

export const emptyVerificationResult: VerificationResult = {
  sanctions: { status: 'pending', matches: [], checkedAt: '' },
  gafi: { listType: 'none', country: '', checkedAt: '' },
  ppe: { status: 'clear', declaration: emptyPpeDeclaration, checkedAt: '' },
  autoFlags: {},
  completedAt: '',
};

// ─── Auto-flag calculation ───────────────────────────────────────────────────
// Maps verification results to risk question IDs from risk-questions.ts

function computeAutoFlags(
  sanctions: SanctionCheckResult,
  gafi: GafiCheckResult,
  ppe: PpeCheckResult,
): Record<string, boolean> {
  const flags: Record<string, boolean> = {};

  // sanctionsList question: flagged if sanctions hit
  if (sanctions.status === 'hit') {
    flags.sanctionsList = true;
  } else if (sanctions.status === 'clear') {
    flags.sanctionsList = false;
  }
  // If 'error' or 'pending', we don't auto-flag (leave to manual)

  // highRiskCountry question: flagged if GAFI black or grey
  if (gafi.listType === 'black' || gafi.listType === 'grey') {
    flags.highRiskCountry = true;
  } else if (gafi.listType === 'none' && gafi.checkedAt) {
    flags.highRiskCountry = false;
  }

  // PPE doesn't map to an existing risk question, but we track it
  // for display purposes in the verification panel

  return flags;
}

/**
 * Compute auto-flags from OCR document analysis results.
 * Depends on party data (documentChecks), not API results.
 */
export function computeOcrAutoFlags(party: Party): Record<string, boolean> {
  const flags: Record<string, boolean> = {};

  // identityVerified: true if OCR successfully detected a CNI or passport
  if (party.documentChecks.pieceIdentite) {
    flags.identityVerified = true;
  }

  return flags;
}

// ─── Main orchestrator ───────────────────────────────────────────────────────

export async function runVerifications(
  party: Party,
  ppeDeclaration?: PpeDeclaration,
): Promise<VerificationResult> {
  const isPhysical = party.personType === 'physical';

  // Gather identity fields
  const lastName = isPhysical ? party.physicalPerson.lastName : '';
  const firstName = isPhysical ? party.physicalPerson.firstName : '';
  const entityName = !isPhysical ? party.legalEntity.companyName : undefined;

  // Gather countries to check
  const countries: string[] = [];
  if (isPhysical) {
    if (party.physicalPerson.nationality) countries.push(party.physicalPerson.nationality);
    if (party.physicalPerson.country) countries.push(party.physicalPerson.country);
    if (party.physicalPerson.fiscalResidence) countries.push(party.physicalPerson.fiscalResidence);
  } else {
    if (party.legalEntity.country) countries.push(party.legalEntity.country);
    if (party.legalEntity.fiscalResidence) countries.push(party.legalEntity.fiscalResidence);
  }

  // Run sanctions and GAFI in parallel, PPE is synchronous
  const [sanctions, gafi] = await Promise.all([
    checkSanctions(lastName, firstName, entityName),
    Promise.resolve(checkGafiCountries(countries)),
  ]);

  const ppe = evaluatePpe(ppeDeclaration ?? emptyPpeDeclaration);
  const autoFlags = computeAutoFlags(sanctions, gafi, ppe);

  return {
    sanctions,
    gafi,
    ppe,
    autoFlags,
    completedAt: new Date().toISOString(),
  };
}
