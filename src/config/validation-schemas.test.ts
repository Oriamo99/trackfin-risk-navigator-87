import { describe, it, expect } from 'vitest';
import { fundDataSchema, documentInfoSchema } from './validation-schemas';

describe('fundDataSchema', () => {
  it('accepts valid fund data', () => {
    const result = fundDataSchema.safeParse({
      transactionAmount: '500000',
      paymentMethod: 'virement',
      originDescription: 'Prêt bancaire',
      bankLoan: 'oui',
      lenderBank: 'BNP Paribas',
    });
    expect(result.success).toBe(true);
  });

  it('requires lenderBank when bankLoan is oui', () => {
    const result = fundDataSchema.safeParse({
      transactionAmount: '500000',
      paymentMethod: 'virement',
      originDescription: 'Prêt bancaire',
      bankLoan: 'oui',
      lenderBank: '',
    });
    expect(result.success).toBe(false);
  });

  it('does not require lenderBank when bankLoan is not oui', () => {
    const result = fundDataSchema.safeParse({
      transactionAmount: '500000',
      paymentMethod: 'virement',
      originDescription: 'Épargne',
      bankLoan: 'non',
      lenderBank: '',
    });
    expect(result.success).toBe(true);
  });

  it('requires transactionAmount', () => {
    const result = fundDataSchema.safeParse({
      transactionAmount: '',
      paymentMethod: 'virement',
      originDescription: 'Épargne',
    });
    expect(result.success).toBe(false);
  });

  it('requires paymentMethod', () => {
    const result = fundDataSchema.safeParse({
      transactionAmount: '500000',
      paymentMethod: '',
      originDescription: 'Épargne',
    });
    expect(result.success).toBe(false);
  });

  it('requires originDescription', () => {
    const result = fundDataSchema.safeParse({
      transactionAmount: '500000',
      paymentMethod: 'virement',
      originDescription: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('documentInfoSchema', () => {
  it('accepts valid document info', () => {
    const result = documentInfoSchema.safeParse({
      redactorName: 'Jean Dupont',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty redactor name', () => {
    const result = documentInfoSchema.safeParse({
      redactorName: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects whitespace-only redactor name', () => {
    const result = documentInfoSchema.safeParse({
      redactorName: '   ',
    });
    expect(result.success).toBe(false);
  });
});
