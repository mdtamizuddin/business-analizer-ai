import { SCORE_WEIGHTS, SCORE_CATEGORIES } from '@abap/constants';
import type { ScoreSet, ScoreCategory } from '@abap/types';

export function calculateOverallScore(
  categoryScores: Partial<Record<ScoreCategory, number>>
): number {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const category of SCORE_CATEGORIES) {
    const score = categoryScores[category];
    const weight = SCORE_WEIGHTS[category];
    if (score !== undefined && weight !== undefined) {
      weightedSum += score * weight;
      totalWeight += weight;
    }
  }

  if (totalWeight === 0) return 0;
  return Math.round(weightedSum / totalWeight);
}

export function buildScoreSet(
  categoryScores: Partial<Record<ScoreCategory, number>>
): ScoreSet {
  const categories: Record<string, number> = {};
  for (const category of SCORE_CATEGORIES) {
    categories[category] = categoryScores[category] ?? 0;
  }
  return {
    overall: calculateOverallScore(categoryScores),
    categories: categories as Record<ScoreCategory, number>,
  };
}
