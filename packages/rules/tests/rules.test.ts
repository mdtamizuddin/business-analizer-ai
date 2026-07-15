import { describe, it, expect } from 'vitest';
import { evaluate, extractFacts, buildScores } from '../src';
import type { ExtractedFacts } from '../src';

function makeFacts(overrides?: Partial<ExtractedFacts>): ExtractedFacts {
  return {
    url: 'https://example.com',
    hostname: 'example.com',
    totalPages: 5,
    crawlDurationMs: 10000,
    hasTitle: true,
    titleLength: 45,
    hasMetaDescription: true,
    metaDescriptionLength: 140,
    hasMetaKeywords: true,
    hasH1: true,
    h1Count: 1,
    h2Count: 5,
    hasCanonical: true,
    hasOpenGraphTitle: true,
    hasOpenGraphDescription: true,
    hasOpenGraphImage: true,
    hasStructuredData: true,
    structuredDataCount: 2,
    hasRobotsNoindex: false,
    hasRobotsNofollow: false,
    internalLinksCount: 50,
    externalLinksCount: 10,
    averageLoadTimeMs: 1500,
    homepageImageCount: 5,
    totalImages: 20,
    blockedPageCount: 0,
    hasLogo: true,
    hasFavicon: true,
    colorCount: 4,
    customFontCount: 2,
    lcp: 1800,
    fcp: 1200,
    cls: 0.05,
    ttfb: 400,
    tbt: 150,
    industry: 'Technology',
    isLocalBusiness: false,
    hasSitemap: true,
    googleBusinessRating: 4.3,
    googleBusinessReviewCount: 120,
    socialProfilesFound: 3,
    socialProfilesTotal: 3,
    ...overrides,
  };
}

describe('Rules Engine', () => {
  describe('evaluate()', () => {
    it('should return high scores for a well-optimized site', () => {
      const facts = makeFacts();
      const result = evaluate(facts);

      expect(result.scores.seo).toBeGreaterThanOrEqual(80);
      expect(result.scores.performance).toBeGreaterThanOrEqual(80);
      expect(result.scores.branding).toBeGreaterThanOrEqual(80);
      expect(result.matchedRecommendations.length).toBe(0);
    });

    it('should return reduced SEO score for missing title', () => {
      const facts = makeFacts({ hasTitle: false, titleLength: 0 });
      const result = evaluate(facts);

      expect(result.scores.seo).toBeLessThanOrEqual(70);
      expect(result.matchedRecommendations.some((r) => r.id === 'missing-title')).toBe(true);
    });

    it('should detect missing H1', () => {
      const facts = makeFacts({ hasH1: false, h1Count: 0 });
      const result = evaluate(facts);

      expect(result.scores.seo).toBeLessThanOrEqual(60);
      expect(result.matchedRecommendations.some((r) => r.id === 'missing-h1')).toBe(true);
    });

    it('should detect noindex directive', () => {
      const facts = makeFacts({ hasRobotsNoindex: true });
      const result = evaluate(facts);

      expect(result.scores.seo).toBe(0);
      expect(result.matchedRecommendations.some((r) => r.id === 'noindex-detected')).toBe(true);
    });

    it('should detect poor LCP', () => {
      const facts = makeFacts({ lcp: 5000 });
      const result = evaluate(facts);

      expect(result.scores.performance).toBeLessThan(70);
      expect(result.matchedRecommendations.some((r) => r.id === 'slow-lcp')).toBe(true);
    });

    it('should detect missing logo', () => {
      const facts = makeFacts({ hasLogo: false });
      const result = evaluate(facts);

      expect(result.scores.branding).toBeLessThanOrEqual(80);
      expect(result.matchedRecommendations.some((r) => r.id === 'missing-logo')).toBe(true);
    });

    it('should detect missing favicon', () => {
      const facts = makeFacts({ hasFavicon: false });
      const result = evaluate(facts);

      expect(result.matchedRecommendations.some((r) => r.id === 'missing-favicon')).toBe(true);
    });

    it('should detect slow average load time', () => {
      const facts = makeFacts({ averageLoadTimeMs: 6000 });
      const result = evaluate(facts);

      expect(result.scores.performance).toBeLessThanOrEqual(70);
      expect(result.matchedRecommendations.some((r) => r.id === 'avg-load-slow')).toBe(true);
    });

    it('should recommend multiple items for a poorly optimized site', () => {
      const facts = makeFacts({
        hasTitle: false,
        hasMetaDescription: false,
        hasH1: false,
        hasCanonical: false,
        hasLogo: false,
        hasFavicon: false,
        hasStructuredData: false,
        hasOpenGraphTitle: false,
        hasOpenGraphImage: false,
      });
      const result = evaluate(facts);

      expect(result.matchedRecommendations.length).toBeGreaterThanOrEqual(5);
    });

    it('should sort recommendations by priority', () => {
      const facts = makeFacts({
        hasTitle: false,
        hasRobotsNoindex: true,
        hasLogo: false,
      });
      const result = evaluate(facts);

      expect(result.matchedRecommendations[0].priority).toBe('critical');
    });

    it('should calculate social_media score correctly', () => {
      const halfFacts = makeFacts({ socialProfilesFound: 1, socialProfilesTotal: 3 });
      const halfResult = evaluate(halfFacts);
      expect(halfResult.scores.social_media).toBe(33);

      const fullFacts = makeFacts({ socialProfilesFound: 3, socialProfilesTotal: 3 });
      const fullResult = evaluate(fullFacts);
      expect(fullResult.scores.social_media).toBe(100);

      const noProfiles = makeFacts({ socialProfilesTotal: 0, socialProfilesFound: 0 });
      const noResult = evaluate(noProfiles);
      expect(noResult.scores.social_media).toBe(50);
    });

    it('should have all 10 categories in scores', () => {
      const facts = makeFacts();
      const result = evaluate(facts);

      const expected = [
        'seo', 'performance', 'accessibility', 'security',
        'branding', 'website', 'social_media',
        'customer_trust', 'conversion', 'customer_experience',
      ];
      for (const cat of expected) {
        expect(result.scores[cat]).toBeDefined();
        expect(result.scores[cat]).toBeGreaterThanOrEqual(0);
        expect(result.scores[cat]).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('buildScores()', () => {
    it('should produce a valid ScoreSet', () => {
      const facts = makeFacts();
      const { scores } = evaluate(facts);
      const scoreSet = buildScores(scores);

      expect(scoreSet.overall).toBeGreaterThanOrEqual(0);
      expect(scoreSet.overall).toBeLessThanOrEqual(100);
      expect(Object.keys(scoreSet.categories).length).toBe(10);
    });
  });

  describe('extractFacts()', () => {
    it('should extract facts from crawl data', () => {
      const facts = extractFacts({
        homepage: {
          url: 'https://example.com',
          statusCode: 200,
          links: { internal: ['/page1'], external: ['https://other.com'] },
          metadata: {
            title: 'Test',
            description: 'Desc',
            h1Count: 1,
            h2Count: 3,
            imageCount: 2,
            wordCount: 500,
            keywords: ['kw1'],
            canonical: 'https://example.com',
            ogTags: { 'og:title': 'Test', 'og:image': 'img.jpg' },
            structuredData: [{ '@context': 'https://schema.org' }],
          },
          loadTimeMs: 1200,
        },
        totalPages: 5,
        crawlDurationMs: 8000,
        blockedPageCount: 0,
        allPages: [],
      });

      expect(facts.hasTitle).toBe(true);
      expect(facts.titleLength).toBe(4);
      expect(facts.hasH1).toBe(true);
      expect(facts.h1Count).toBe(1);
      expect(facts.hasCanonical).toBe(true);
      expect(facts.hasOpenGraphTitle).toBe(true);
      expect(facts.hasStructuredData).toBe(true);
      expect(facts.averageLoadTimeMs).toBe(0);
    });
  });
});
