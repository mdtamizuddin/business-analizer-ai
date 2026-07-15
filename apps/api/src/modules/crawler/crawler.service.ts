import { Injectable, Logger } from '@nestjs/common';
import { chromium, Browser, BrowserContext, Page } from 'playwright';
import * as cheerio from 'cheerio';
import { CRAWL_DEFAULTS } from '@abap/constants';

export interface CrawledPageResult {
  url: string;
  title?: string;
  description?: string;
  statusCode: number;
  loadTimeMs?: number;
  htmlContent?: string;
  textContent?: string;
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
    h1Count: number;
    h2Count: number;
    imageCount: number;
    wordCount: number;
  };
  performanceMetrics?: {
    lcp?: number;
    fcp?: number;
    cls?: number;
    tbt?: number;
    si?: number;
    ttfb?: number;
    domContentLoaded?: number;
    loadEvent?: number;
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

const RESOURCE_BLOCK_PATTERNS = [
  /\.(png|jpg|jpeg|gif|svg|webp|ico|avif)(\?|$)/i,
  /\.(woff2?|ttf|eot|otf)(\?|$)/i,
  /\.(css|less|scss)(\?|$)/i,
  /\.(mp4|webm|avi|mov|mp3|wav|ogg)(\?|$)/i,
  /\.(pdf|zip|gz|tar)(\?|$)/i,
];

const TRACKING_DOMAINS = [
  'google-analytics.com',
  'googletagmanager.com',
  'facebook.net',
  'doubleclick.net',
  'hotjar.com',
  'ads.linkedin.com',
  'bat.bing.com',
  'analytics',
  'tagmanager',
];

const BLOCKED_MIME_TYPES = new Set([
  'image/', 'font/', 'video/', 'audio/', 'text/css',
]);

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);
  private browser: Browser | null = null;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly BROWSER_IDLE_MS = 120_000;

  private async getBrowser(): Promise<Browser> {
    if (this.browser?.isConnected()) {
      this.resetIdleTimer();
      return this.browser;
    }
    this.browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-breakpad',
        '--disable-component-extensions-with-background-pages',
        '--disable-features=TranslateUI,BlinkGenPropertyTrees',
        '--disable-ipc-flooding-protection',
        '--disable-renderer-backgrounding',
        '--no-first-run',
        '--no-zygote',
      ],
    });
    return this.browser;
  }

  private resetIdleTimer(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => { void this.closeBrowser(); }, this.BROWSER_IDLE_MS);
  }

  private async createBlockingContext(browser: Browser): Promise<BrowserContext> {
    const context = await browser.newContext({
      userAgent: CRAWL_DEFAULTS.USER_AGENT,
      viewport: { width: 1024, height: 768 },
      javaScriptEnabled: true,
      bypassCSP: true,
      locale: 'en-US',
    });

    await context.route('**/*', (route) => {
      const url = route.request().url();
      const resourceType = route.request().resourceType();

      if (BLOCKED_MIME_TYPES.has(resourceType)) {
        return route.abort('blockedbyclient');
      }

      for (const domain of TRACKING_DOMAINS) {
        if (url.includes(domain)) {
          return route.abort('blockedbyclient');
        }
      }

      for (const pattern of RESOURCE_BLOCK_PATTERNS) {
        if (pattern.test(url)) {
          return route.abort('blockedbyclient');
        }
      }

      return route.continue();
    });

    return context;
  }

  async crawl(
    startUrl: string,
    maxPages: number = CRAWL_DEFAULTS.MAX_PAGES,
    options?: { capturePerformance?: boolean },
  ): Promise<CrawlResult> {
    const startTime = Date.now();
    const capturePerf = options?.capturePerformance ?? true;
    const browser = await this.getBrowser();
    const context = await this.createBlockingContext(browser);
    const baseUrl = new URL(startUrl);
    const hostname = baseUrl.hostname;

    try {
      const visited = new Set<string>();
      const queue = [baseUrl.href];
      const pages: CrawledPageResult[] = [];
      const blockedPages: string[] = [];

      while (queue.length > 0 && pages.length < maxPages) {
        const currentUrl = queue.shift()!;
        if (visited.has(currentUrl)) continue;
        visited.add(currentUrl);

        const page = await context.newPage();
        try {
          const response = await page.goto(currentUrl, {
            waitUntil: 'domcontentloaded',
            timeout: CRAWL_DEFAULTS.TIMEOUT_MS,
          });

          if (!response) {
            blockedPages.push(currentUrl);
            continue;
          }

          const statusCode = response.status();
          if (statusCode >= 400) {
            blockedPages.push(currentUrl);
            continue;
          }

          const html = await page.content();
          const result = this.extractPageData(currentUrl, html, statusCode, baseUrl.href);

          result.loadTimeMs = await page.evaluate(() => {
            const nav = (performance as any).getEntriesByType('navigation')[0];
            return nav ? nav.loadEventEnd - nav.startTime : undefined;
          });

          if (pages.length === 0 && capturePerf) {
            result.performanceMetrics = await this.measurePerformance(page);
          }

          pages.push(result);

          let added = 0;
          for (const link of result.links.internal) {
            if (!visited.has(link) && !queue.includes(link) && added < 20) {
              queue.push(link);
              added++;
            }
          }

          this.logger.log(`Crawled [${statusCode}] ${currentUrl} (${pages.length}/${maxPages})`);

          await new Promise((r) => setTimeout(r, 100));
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          this.logger.warn(`Failed to crawl ${currentUrl}: ${errorMsg}`);
          blockedPages.push(currentUrl);
        } finally {
          await page.close();
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
    url: string, html: string, statusCode: number, baseUrl: string,
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
      } catch { /* skip invalid JSON-LD */ }
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
      } catch { /* skip invalid URL */ }
    });

    const h1Count = $('h1').length;
    const h2Count = $('h2').length;
    const imageCount = $('img').length;

    const textContent = $('body').text().replace(/\s+/g, ' ').trim();
    const wordCount = textContent.split(/\s+/).filter(Boolean).length;

    return {
      url, title, description, statusCode,
      htmlContent: html.slice(0, 20000),
      textContent: textContent.slice(0, 10000),
      links: { internal: internalLinks, external: externalLinks },
      metadata: {
        title, description, keywords, canonical,
        ogTags: Object.keys(ogTags).length > 0 ? ogTags : undefined,
        twitterTags: Object.keys(twitterTags).length > 0 ? twitterTags : undefined,
        structuredData: structuredData.length > 0 ? structuredData : undefined,
        robotsMeta, h1Count, h2Count, imageCount, wordCount,
      },
    };
  }

  async closeBrowser(): Promise<void> {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    if (this.browser) {
      try {
        await this.browser.close();
      } catch { /* ignore close errors */ }
      this.browser = null;
      this.logger.log('Browser closed (idle timeout)');
    }
  }

  private async measurePerformance(page: Page): Promise<{
    lcp?: number; fcp?: number; cls?: number; tbt?: number;
    si?: number; ttfb?: number; domContentLoaded?: number; loadEvent?: number;
  }> {
    return page.evaluate(() => {
      const nav = (performance as any).getEntriesByType('navigation')[0];
      const ttfb = nav?.responseStart;
      const domContentLoaded = nav?.domContentLoadedEventEnd;
      const loadEvent = nav?.loadEventEnd;

      const paint = (performance as any).getEntriesByType('paint');
      const fcpEntry = paint.find((p: any) => p.name === 'first-contentful-paint');
      const fcp = fcpEntry ? fcpEntry.startTime : undefined;

      const perfTimeout = 500;

      const lcpPromise = new Promise<number | undefined>((resolve) => {
        let value: number | undefined;
        try {
          const po = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const last = entries[entries.length - 1] as any;
            value = last.renderTime ?? last.loadTime ?? last.startTime;
          });
          po.observe({ type: 'largest-contentful-paint' as any, buffered: true });
          setTimeout(() => { po.disconnect(); resolve(value); }, perfTimeout);
        } catch { resolve(undefined); }
      });

      const clsPromise = new Promise<number | undefined>((resolve) => {
        let cls = 0;
        try {
          const po = new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as any[]) {
              if (!entry.hadRecentInput) cls += entry.value;
            }
          });
          po.observe({ type: 'layout-shift' as any, buffered: true });
          setTimeout(() => { po.disconnect(); resolve(cls); }, perfTimeout);
        } catch { resolve(undefined); }
      });

      return Promise.all([lcpPromise, clsPromise]).then(([lcp, cls]) => ({
        ttfb, domContentLoaded, loadEvent, fcp, lcp, cls,
        tbt: undefined, si: undefined,
      }));
    });
  }

  async takeScreenshot(url: string): Promise<{ base64: string; buffer: Buffer }> {
    const browser = await this.getBrowser();
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

    try {
      // Block heavy resources for screenshot too
      await page.route('**/*', (route) => {
        const type = route.request().resourceType();
        if (type === 'font' || type === 'media') return route.abort('blockedbyclient');
        return route.continue();
      });

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    } catch { /* continue even if some assets fail */ }

    const buffer = await page.screenshot({ fullPage: false, type: 'png' });
    await page.close();
    return { base64: buffer.toString('base64'), buffer };
  }

  async htmlToPdf(html: string): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    const pdf = await page.pdf({
      format: 'A4', printBackground: true,
      margin: { top: '20px', bottom: '20px', left: '16px', right: '16px' },
    });
    await page.close();
    return Buffer.from(pdf);
  }
}
