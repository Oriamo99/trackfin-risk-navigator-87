import { describe, it, expect } from 'vitest';
import { calculateScore, getRiskLevel, getGlobalRiskLevel } from './risk-scoring';
import type { RiskQuestion } from './risk-questions';

const questions: RiskQuestion[] = [
  { id: 'q1', label: 'Q1', description: '', risk: 'Faible', weight: 3 },
  { id: 'q2', label: 'Q2', description: '', risk: 'Modéré', weight: 5 },
  { id: 'q3', label: 'Q3', description: '', risk: 'Élevé', weight: 2, invertedLogic: true },
];

describe('calculateScore', () => {
  it('returns 0 when no checks are true', () => {
    expect(calculateScore({ q1: false, q2: false, q3: true }, questions)).toBe(0);
  });

  it('sums weights of checked normal questions', () => {
    expect(calculateScore({ q1: true, q2: false, q3: true }, questions)).toBe(3);
  });

  it('adds weight for unchecked invertedLogic questions', () => {
    // q3 has invertedLogic: unchecked → adds weight
    expect(calculateScore({ q1: false, q2: false, q3: false }, questions)).toBe(2);
  });

  it('sums all weights correctly', () => {
    // q1 checked (3) + q2 checked (5) + q3 unchecked inverted (2) = 10
    expect(calculateScore({ q1: true, q2: true, q3: false }, questions)).toBe(10);
  });

  it('handles missing checks as false', () => {
    // q3 not in checks → false → invertedLogic adds 2
    expect(calculateScore({}, questions)).toBe(2);
  });
});

describe('getRiskLevel', () => {
  it('returns Faible for score 0', () => {
    expect(getRiskLevel(0)).toBe('Faible');
  });

  it('returns Modéré for scores 1-5', () => {
    expect(getRiskLevel(1)).toBe('Modéré');
    expect(getRiskLevel(5)).toBe('Modéré');
  });

  it('returns Élevé for scores > 5', () => {
    expect(getRiskLevel(6)).toBe('Élevé');
    expect(getRiskLevel(20)).toBe('Élevé');
  });
});

describe('getGlobalRiskLevel', () => {
  it('returns Faible for total 0-5', () => {
    expect(getGlobalRiskLevel(0)).toBe('Faible');
    expect(getGlobalRiskLevel(5)).toBe('Faible');
  });

  it('returns Modéré for total 6-15', () => {
    expect(getGlobalRiskLevel(6)).toBe('Modéré');
    expect(getGlobalRiskLevel(15)).toBe('Modéré');
  });

  it('returns Élevé for total > 15', () => {
    expect(getGlobalRiskLevel(16)).toBe('Élevé');
    expect(getGlobalRiskLevel(60)).toBe('Élevé');
  });
});
