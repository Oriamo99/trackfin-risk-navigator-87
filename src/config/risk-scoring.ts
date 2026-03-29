import type { RiskQuestion } from './risk-questions';

export type RiskLevel = 'Faible' | 'Modéré' | 'Élevé';

export function calculateScore(checks: Record<string, boolean>, questions: RiskQuestion[]): number {
  let score = 0;
  for (const q of questions) {
    const checked = checks[q.id] ?? false;
    if (q.invertedLogic) {
      if (!checked) score += q.weight;
    } else {
      if (checked) score += q.weight;
    }
  }
  return score;
}

export function getRiskLevel(score: number): RiskLevel {
  if (score === 0) return 'Faible';
  if (score <= 5) return 'Modéré';
  return 'Élevé';
}

export function getGlobalRiskLevel(totalScore: number): RiskLevel {
  if (totalScore <= 5) return 'Faible';
  if (totalScore <= 15) return 'Modéré';
  return 'Élevé';
}
