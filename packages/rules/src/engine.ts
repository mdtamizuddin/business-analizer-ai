import type { ExtractedFacts } from './facts';
import { SCORE_RULES, RECOMMENDATION_RULES } from './rules';
import type { RuleEvaluation, MatchedRecommendation } from './types';
import { buildScoreSet } from '@abap/audit-core';
import type { ScoreSet } from '@abap/types';

const PRIORITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function evaluate(facts: ExtractedFacts): RuleEvaluation {
  const scores: Record<string, number> = {};
  const issues: Record<string, string[]> = {};

  for (const rule of SCORE_RULES) {
    scores[rule.category] = rule.evaluate(facts);
    issues[rule.category] = rule.issues(facts);
  }

  const matched: MatchedRecommendation[] = [];

  for (const rule of RECOMMENDATION_RULES) {
    if (rule.condition(facts)) {
      matched.push({
        id: rule.id,
        type: rule.type,
        title: rule.title(facts),
        problem: rule.problem(facts),
        evidence: rule.evidence(facts),
        businessImpact: rule.businessImpact,
        priority: rule.priority,
        estimatedEffort: rule.effort,
        estimatedRoi: rule.roi,
        recommendedService: rule.service,
      });
    }
  }

  matched.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

  return { scores, issues, matchedRecommendations: matched };
}

export function buildScores(scores: Record<string, number>): ScoreSet {
  return buildScoreSet(scores);
}

export type { ExtractedFacts } from './facts';
export type { RuleEvaluation, MatchedRecommendation } from './types';
