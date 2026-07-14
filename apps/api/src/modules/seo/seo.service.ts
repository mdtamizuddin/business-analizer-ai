import { Injectable, Logger } from '@nestjs/common';
import type { CrawlResult, CrawledPageResult } from '../crawler/crawler.service';

export interface SEOAnalysisResult {
  metaTagsScore: number;
  headingsScore: number;
  structuredDataScore: number;
  canonicalScore: number;
  sitemapScore: number;
  robotsScore: number;
  openGraphScore: number;
  imageSeoScore: number;
  internalLinksScore: number;
  externalLinksScore: number;
  performanceSeoScore: number;
  issues: string[];
  details: Record<string, unknown>;
}

@Injectable()
export class SeoService {
  private readonly logger = new Logger(SeoService.name);

  analyze(crawlResult: CrawlResult): SEOAnalysisResult {
    const issues: string[] = [];
    const homepage = crawlResult.pages[0];

    const metaTagsScore = this.scoreMetaTags(homepage, issues);
    const headingsScore = this.scoreHeadings(homepage, issues);
    const structuredDataScore = this.scoreStructuredData(homepage, issues);
    const canonicalScore = this.scoreCanonical(homepage, issues);
    const sitemapScore = this.scoreSitemap(homepage, issues);
    const robotsScore = this.scoreRobots(homepage, issues);
    const openGraphScore = this.scoreOpenGraph(homepage, issues);
    const imageSeoScore = this.scoreImageSeo(homepage, issues);
    const internalLinksScore = this.scoreInternalLinks(crawlResult, issues);
    const externalLinksScore = this.scoreExternalLinks(crawlResult, issues);
    const performanceSeoScore = this.scorePerformanceSeo(crawlResult, issues);

    return {
      metaTagsScore,
      headingsScore,
      structuredDataScore,
      canonicalScore,
      sitemapScore,
      robotsScore,
      openGraphScore,
      imageSeoScore,
      internalLinksScore,
      externalLinksScore,
      performanceSeoScore,
      issues,
      details: {
        totalPagesAnalyzed: crawlResult.totalPages,
        blockedPages: crawlResult.blockedPages.length,
      },
    };
  }

  private scoreMetaTags(page: CrawledPageResult | undefined, issues: string[]): number {
    if (!page) return 0;
    let score = 100;

    if (!page.metadata.title) {
      issues.push('Missing <title> tag on homepage');
      score -= 30;
    } else if (page.metadata.title.length > 60) {
      issues.push(`Title tag is ${page.metadata.title.length} chars (recommended: < 60)`);
      score -= 10;
    }

    if (!page.metadata.description) {
      issues.push('Missing meta description on homepage');
      score -= 25;
    } else if (page.metadata.description.length > 160) {
      issues.push(`Meta description is ${page.metadata.description.length} chars (recommended: < 160)`);
      score -= 10;
    }

    if (!page.metadata.keywords) {
      // keywords meta is deprecated, only minor penalty
      score -= 5;
    }

    return Math.max(0, score);
  }

  private scoreHeadings(page: CrawledPageResult | undefined, issues: string[]): number {
    if (!page) return 0;
    let score = 100;

    if (!page.metadata.h1Count) {
      issues.push('Missing H1 tag on homepage');
      score -= 40;
    } else if (page.metadata.h1Count > 1) {
      issues.push(`Multiple H1 tags (${page.metadata.h1Count}) on homepage — use only one`);
      score -= 15;
    }

    if (!page.metadata.h2Count) {
      issues.push('No H2 tags found — heading structure is too flat');
      score -= 15;
    }

    return Math.max(0, score);
  }

  private scoreStructuredData(page: CrawledPageResult | undefined, issues: string[]): number {
    if (!page) return 0;

    if (!page.metadata.structuredData || page.metadata.structuredData.length === 0) {
      issues.push('No structured data (JSON-LD) found — limits rich snippet eligibility');
      return 20;
    }

    const count = page.metadata.structuredData.length;
    this.logger.debug(`Found ${count} structured data blocks`);
    return Math.min(100, 50 + count * 25);
  }

  private scoreCanonical(page: CrawledPageResult | undefined, issues: string[]): number {
    if (!page) return 0;

    if (!page.metadata.canonical) {
      issues.push('Missing canonical URL — potential duplicate content issues');
      return 30;
    }

    return 100;
  }

  private scoreSitemap(page: CrawledPageResult | undefined, issues: string[]): number {
    if (!page) return 0;
    // We detect sitemap by checking if /sitemap.xml is referenced in robots.txt or page
    // For now, score based on presence of canonical + internal linking as proxy
    const hasGoodLinking = (page.links.internal.length > 5);
    if (!hasGoodLinking) {
      issues.push('Low internal linking detected — ensure sitemap.xml exists');
      return 40;
    }
    return 80;
  }

  private scoreRobots(page: CrawledPageResult | undefined, issues: string[]): number {
    if (!page) return 0;

    if (page.metadata.robotsMeta?.includes('noindex')) {
      issues.push('Homepage has noindex directive — page will not be indexed by search engines');
      return 0;
    }

    if (page.metadata.robotsMeta?.includes('nofollow')) {
      issues.push('Homepage has nofollow directive — links will not be followed');
      return 50;
    }

    return 100;
  }

  private scoreOpenGraph(page: CrawledPageResult | undefined, issues: string[]): number {
    if (!page) return 0;
    let score = 0;

    if (page.metadata.ogTags) {
      if (page.metadata.ogTags['og:title']) score += 25;
      if (page.metadata.ogTags['og:description']) score += 25;
      if (page.metadata.ogTags['og:image']) score += 25;
      if (page.metadata.ogTags['og:url']) score += 25;
    }

    if (score === 0) {
      issues.push('No Open Graph tags found — social sharing will lack preview cards');
    } else if (score < 100) {
      issues.push(`Incomplete Open Graph tags (${score}/100) — social sharing previews may be incomplete`);
    }

    return score;
  }

  private scoreImageSeo(page: CrawledPageResult | undefined, issues: string[]): number {
    if (!page) return 0;
    // We'd need to parse img alt attributes from the HTML
    // For now, use cheerio data if available — the crawler stores htmlContent
    // Simplified: if images exist and we have word count, estimate
    if (page.metadata.imageCount === 0) {
      issues.push('No images found on homepage');
      return 50;
    }
    return 80;
  }

  private scoreInternalLinks(crawlResult: CrawlResult, issues: string[]): number {
    const totalInternal = crawlResult.pages.reduce(
      (sum, p) => sum + p.links.internal.length, 0,
    );

    if (totalInternal < 5) {
      issues.push(`Very few internal links (${totalInternal}) found across all pages`);
      return 30;
    }
    if (totalInternal < 20) {
      return 60;
    }
    if (totalInternal < 50) {
      return 80;
    }
    return 100;
  }

  private scoreExternalLinks(crawlResult: CrawlResult, issues: string[]): number {
    const totalExternal = crawlResult.pages.reduce(
      (sum, p) => sum + p.links.external.length, 0,
    );

    if (totalExternal === 0) {
      issues.push('No external links found — consider linking to authoritative sources');
      return 50;
    }
    if (totalExternal < 3) {
      return 75;
    }
    return 100;
  }

  private scorePerformanceSeo(crawlResult: CrawlResult, issues: string[]): number {
    const avgLoadTime = crawlResult.pages
      .filter((p) => p.loadTimeMs !== undefined)
      .reduce((sum, p) => sum + (p.loadTimeMs ?? 0), 0) / Math.max(1, crawlResult.pages.length);

    if (avgLoadTime > 5000) {
      issues.push(`Average page load time is ${Math.round(avgLoadTime)}ms — significantly impacts SEO rankings`);
      return 30;
    }
    if (avgLoadTime > 3000) {
      issues.push(`Average page load time is ${Math.round(avgLoadTime)}ms — should be improved for SEO`);
      return 60;
    }
    if (avgLoadTime > 1500) {
      return 80;
    }
    return 100;
  }
}
