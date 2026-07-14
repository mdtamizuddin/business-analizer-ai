import { describe, it, expect } from 'vitest';
import { calculateOverallScore, buildScoreSet } from '../src/scoring';

describe('calculateOverallScore', () => {
  it('should return 0 for empty scores', () => {
    expect(calculateOverallScore({})).toBe(0);
  });

  it('should calculate weighted score correctly', () => {
    const scores = {
      branding: 80,
      website: 90,
      seo: 70,
    };
    const result = calculateOverallScore(scores);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('should weight branding more than social_media', () => {
    const brandingOnly = calculateOverallScore({ branding: 100 });
    const socialOnly = calculateOverallScore({ social_media: 100 });
    expect(brandingOnly).toBeGreaterThan(socialOnly);
  });
});

describe('buildScoreSet', () => {
  it('should fill missing categories with 0', () => {
    const result = buildScoreSet({ branding: 80 });
    expect(result.categories.branding).toBe(80);
    expect(result.categories.seo).toBe(0);
    expect(result.categories.social_media).toBe(0);
  });

  it('should calculate overall from provided scores only', () => {
    const result = buildScoreSet({ seo: 100 });
    expect(result.overall).toBeGreaterThan(0);
    expect(result.overall).toBeLessThanOrEqual(100);
  });
});
