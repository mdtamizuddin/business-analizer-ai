import { Injectable } from '@nestjs/common';
import { CrawlerService, CrawlResult } from '../crawler/crawler.service';
import { SeoService, SEOAnalysisResult } from '../seo/seo.service';
import { PerformanceService, PerformanceAnalysisResult } from '../performance/performance.service';
import { BrandingService, BrandingAnalysisResult } from '../branding/branding.service';

export interface CompetitorComparison {
  url: string;
  seo: SEOAnalysisResult;
  performance: PerformanceAnalysisResult;
  branding: BrandingAnalysisResult;
  overallScore: number;
}

export interface GapAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
}

export interface CompetitorAnalysisResult {
  competitor: CompetitorComparison;
  gap: GapAnalysis;
}

@Injectable()
export class CompetitorService {
  constructor(
    private readonly crawlerService: CrawlerService,
    private readonly seoService: SeoService,
    private readonly performanceService: PerformanceService,
    private readonly brandingService: BrandingService,
  ) {}

  /**
   * Analyze a competitor site and produce a gap analysis relative to the
   * user's own audit (their SEO/performance/branding results).
   */
  async analyze(
    competitorUrl: string,
    baseline?: {
      seo?: SEOAnalysisResult | null;
      performance?: PerformanceAnalysisResult | null;
      branding?: BrandingAnalysisResult | null;
    },
    maxPages = 5,
  ): Promise<CompetitorAnalysisResult> {
    const crawlResult: CrawlResult = await this.crawlerService.crawl(competitorUrl, maxPages);

    const seo = this.seoService.analyze(crawlResult);
    const performance = this.performanceService.analyze(crawlResult);
    const branding = this.brandingService.analyze(crawlResult);

    const overallScore = Math.round(
      (seo.metaTagsScore + seo.headingsScore + seo.structuredDataScore +
        seo.canonicalScore + seo.sitemapScore + seo.robotsScore +
        seo.openGraphScore + seo.imageSeoScore + seo.internalLinksScore +
        seo.externalLinksScore + seo.performanceSeoScore +
        performance.performanceScore + branding.brandScore) / 13,
    );

    const gap = this.buildGapAnalysis(
      { seo, performance, branding, overallScore },
      baseline,
    );

    return {
      competitor: { url: competitorUrl, seo, performance, branding, overallScore },
      gap,
    };
  }

  private buildGapAnalysis(
    comp: { seo: SEOAnalysisResult; performance: PerformanceAnalysisResult; branding: BrandingAnalysisResult; overallScore: number },
    baseline?: { seo?: SEOAnalysisResult | null; performance?: PerformanceAnalysisResult | null; branding?: BrandingAnalysisResult | null },
  ): GapAnalysis {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const opportunities: string[] = [];

    if (baseline?.seo) {
      const bSeo = this.avgSeo(baseline.seo);
      const cSeo = this.avgSeo(comp.seo);
      if (bSeo > cSeo + 5) strengths.push(`Your SEO (${bSeo}) is stronger than competitor's (${cSeo}).`);
      else if (cSeo > bSeo + 5) {
        weaknesses.push(`Competitor SEO (${cSeo}) beats yours (${bSeo}).`);
        opportunities.push('Improve meta tags, headings, and structured data to close the SEO gap.');
      }
    }

    if (baseline?.performance) {
      if (baseline.performance.lighthouseScore > comp.performance.lighthouseScore + 5)
        strengths.push('Your site loads faster (higher Lighthouse) than the competitor.');
      else if (comp.performance.lighthouseScore > baseline.performance.lighthouseScore + 5) {
        weaknesses.push('Competitor has better performance/load scores.');
        opportunities.push('Optimize images and Core Web Vitals to outpace the competitor.');
      }
    }

    if (baseline?.branding) {
      if (baseline.branding.brandScore > comp.branding.brandScore + 5)
        strengths.push('Your visual branding scores higher than the competitor.');
      else if (comp.branding.brandScore > baseline.branding.brandScore + 5) {
        weaknesses.push('Competitor has a stronger visual brand presence.');
        opportunities.push('Strengthen logo, color consistency, and visual hierarchy.');
      }
    }

    if (strengths.length === 0) strengths.push('No decisive SEO/performance/branding advantage detected yet.');
    return { strengths, weaknesses, opportunities };
  }

  private avgSeo(s: SEOAnalysisResult): number {
    return Math.round(
      (s.metaTagsScore + s.headingsScore + s.structuredDataScore + s.canonicalScore +
        s.sitemapScore + s.robotsScore + s.openGraphScore + s.imageSeoScore +
        s.internalLinksScore + s.externalLinksScore + s.performanceSeoScore) / 11,
    );
  }
}
