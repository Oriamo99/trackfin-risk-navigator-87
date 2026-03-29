import { describe, it, expect } from 'vitest';
import { generatePDF } from './pdf-export';
import type { AppSnapshot } from '@/types';
import { createEmptyParty, emptyDocumentInfo, defaultGlobalAppData, DEFAULT_FUNDS_DOCUMENT_CHECKS, defaultFundRiskChecks } from '@/types';

function makeSnapshot(overrides: Partial<AppSnapshot> = {}): AppSnapshot {
  return {
    global: { ...defaultGlobalAppData },
    fund: {
      data: {
        originDescription: '',
        bankDetails: '',
        transactionAmount: '',
        paymentMethod: '',
        justificationDocuments: '',
        additionalNotes: '',
        bankLoan: '',
        lenderBank: '',
      },
      checks: { ...defaultFundRiskChecks },
      documentChecks: { ...DEFAULT_FUNDS_DOCUMENT_CHECKS },
    },
    documentInfo: { ...emptyDocumentInfo },
    ...overrides,
  };
}

describe('generatePDF smoke test', () => {
  it('generates a PDF without crashing on minimal data', () => {
    const result = generatePDF(makeSnapshot());
    expect(result.blob).toBeInstanceOf(Blob);
    expect(result.blob.size).toBeGreaterThan(0);
    expect(result.fileName).toMatch(/^TRACKFIN_Evaluation_\d{4}-\d{2}-\d{2}\.pdf$/);
  });

  it('generates a PDF with filled party data', () => {
    const party = createEmptyParty();
    party.personType = 'physical';
    party.physicalPerson.lastName = 'DUPONT';
    party.physicalPerson.firstName = 'Jean';

    const snapshot = makeSnapshot();
    snapshot.global.vendor.parties = [party];
    snapshot.global.summary.assessments.vendor = { score: 3, level: 'Modéré' };
    snapshot.global.summary.totalScore = 3;
    snapshot.global.summary.overallRisk = 'Faible';
    snapshot.documentInfo = { redactorName: 'Agent Test', signature: null };

    const result = generatePDF(snapshot);
    expect(result.blob).toBeInstanceOf(Blob);
    expect(result.blob.size).toBeGreaterThan(1000);
  });
});
