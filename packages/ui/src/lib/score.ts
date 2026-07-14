import { SCORE_GRADES } from '@abap/constants';

export function getScoreGrade(score: number): { grade: string; color: string } {
  const entry = SCORE_GRADES.find((g) => score >= g.min);
  return entry ?? { grade: 'F', color: '#ef4444' };
}
