import { Injectable, Logger } from '@nestjs/common';
import { chromium, Browser } from 'playwright';
import * as cheerio from 'cheerio';
import { CRAWL_DEFAULTS } from '@abap/constants';

export interface CrawledPageResult {
  url: string;
  title?: string;
  description?: string;
  statusCode: number;
  loadTimeMs?: number;
  textContent?: string;
  htmlContent?: string;
  links: { internal: string[]; external: string[] };
  metadata: {
    title?: string;
    description?: string;
    keywords?: string[];
    canonical?: string;
    ogTags?: Record<string, string>;
    twitterTags?: Record<string, string>;
    structuredData?: unknown[];
    robotsMeta?: string;
    h1Count?: number;
    h2Count?: number;
    imageCount?: number;
    wordCount?: number;
  };
}

export interface CrawlResult {
  pages: CrawledPageResult[];
  totalPages: number;
  crawlDurationMs: number;
  blockedPages: string[];
  baseUrl: string;
  hostname: string;
}

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);
  private browser: Browser | null = null;

  private async getBrowser(): Promise<Browser> {
    if (this.browser && this.browser.isConnected()) {
      return this.browser;
    }
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    return this.browser;
  }

  async crawl(
    startUrl: string,
    maxPages: number = CRAWL_DEFAULTS.MAX_PAGES,
  ): Promise<CrawlResult> {
    const startTime = Date.now();
    const browser = await this.getBrowser();
    const context = await browser.newContext({
      userAgent: CRAWL_DEFAULTS.USER_AGENT,
      viewport: { width: 1920, height: 1080 },
    });

    try {
      const baseUrl = new URL(startUrl);
      const hostname = baseUrl.hostname;
      const visited = new Set<string>();
      const queue = [baseUrl.href];
      const pages: CrawledPageResult[] = [];
      const blockedPages: string[] = [];

      while (queue.length > 0 && pages.length < maxPages) {
        const currentUrl = queue.shift()!;

        if (visited.has(currentUrl)) continue;
        visited.add(currentUrl);

        try {
          const page = await context.newPage();
          const response = await page.goto(currentUrl, {
            waitUntil: CRAWL_DEFAULTS.WAIT_UNTIL,
            timeout: CRAWL_DEFAULTS.TIMEOUT_MS,
          });

          if (!response) {
            blockedPages.push(currentUrl);
            await page.close();
            continue;
          }

          const statusCode = response.status();
          if (statusCode >= 400) {
            blockedPages.push(currentUrl);
            await page.close();
            continue;
          }

          const html = await page.content();
          const result = this.extractPageData(currentUrl, html, statusCode, baseUrl.href);

          const navigationTiming = await page.evaluate(() => {
            const entries = (performance as any).getEntriesByType?.('navigation') ?? [];
            if (entries.length > 0) {
              return (entries[0] as any).loadEventEnd - (entries[0] as any).startTime;
            }
            return undefined;
          });
          result.loadTimeMs = navigationTiming;

          pages.push(result);

          for (const link of result.links.internal) {
            if (!visited.has(link) && !queue.includes(link)) {
              queue.push(link);
            }
          }

          await page.close();
          this.logger.log(`Crawled [${statusCode}] ${currentUrl} (${pages.length}/${maxPages})`);
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          this.logger.warn(`Failed to crawl ${currentUrl}: ${errorMsg}`);
          blockedPages.push(currentUrl);
        }
      }

      return {
        pages,
        totalPages: pages.length,
        crawlDurationMs: Date.now() - startTime,
        blockedPages,
        baseUrl: baseUrl.href,
        hostname,
      };
    } finally {
      await context.close();
    }
  }

  private extractPageData(
    url: string,
    html: string,
    statusCode: number,
    baseUrl: string,
  ): CrawledPageResult {
    const $ = cheerio.load(html);
    const baseUrlObj = new URL(baseUrl);

    const title = $('title').text().trim() || undefined;
    const description = $('meta[name="description"]').attr('content')?.trim() || undefined;
    const keywordsStr = $('meta[name="keywords"]').attr('content')?.trim();
    const keywords = keywordsStr
      ? keywordsStr.split(',').map((k) => k.trim()).filter(Boolean)
      : undefined;
    const canonical = $('link[rel="canonical"]').attr('href')?.trim() || undefined;
    const robotsMeta = $('meta[name="robots"]').attr('content')?.trim() || undefined;

    const ogTags: Record<string, string> = {};
    $('meta[property^="og:"]').each((_, el) => {
      const property = $(el).attr('property')!;
      const content = $(el).attr('content');
      if (property && content) ogTags[property] = content;
    });

    const twitterTags: Record<string, string> = {};
    $('meta[name^="twitter:"]').each((_, el) => {
      const name = $(el).attr('name')!;
      const content = $(el).attr('content');
      if (name && content) twitterTags[name] = content;
    });

    const structuredData: unknown[] = [];
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).contents().text());
        structuredData.push(json);
      } catch {
        // Invalid JSON-LD, skip
      }
    });

    const internalLinks: string[] = [];
    const externalLinks: string[] = [];
    const seenLinks = new Set<string>();

    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

      try {
        const resolved = new URL(href, baseUrl).href;
        if (seenLinks.has(resolved)) return;
        seenLinks.add(resolved);

        const linkUrl = new URL(resolved);
        if (linkUrl.hostname === baseUrlObj.hostname) {
          internalLinks.push(resolved);
        } else {
          externalLinks.push(resolved);
        }
      } catch {
        // Invalid URL, skip
      }
    });

    const h1Count = $('h1').length;
    const h2Count = $('h2').length;
    const imageCount = $('img').length;

    const textContent = $('body').text().replace(/\s+/g, ' ').trim();
    const wordCount = textContent.split(/\s+/).filter(Boolean).length;

    return {
      url,
      title,
      description,
      statusCode,
      htmlContent: html.slice(0, 50000),
      textContent: textContent.slice(0, 10000),
      links: { internal: internalLinks, external: externalLinks },
      metadata: {
        title,
        description,
        keywords,
        canonical,
        ogTags: Object.keys(ogTags).length > 0 ? ogTags : undefined,
        twitterTags: Object.keys(twitterTags).length > 0 ? twitterTags : undefined,
        structuredData: structuredData.length > 0 ? structuredData : undefined,
        robotsMeta,
        h1Count,
        h2Count,
        imageCount,
        wordCount,
      },
    };
  }

  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
