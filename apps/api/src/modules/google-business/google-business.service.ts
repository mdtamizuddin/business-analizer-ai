import { Injectable } from '@nestjs/common';
import { CrawlerService, CrawlResult } from '../crawler/crawler.service';
import { AiService } from '../ai/ai.service';

export interface GoogleBusinessResult {
  found: boolean;
  name?: string;
  rating?: number;
  reviewCount?: number;
  address?: string;
  categories?: string[];
  hasWebsite: boolean;
  sentiment: 'positive' | 'mixed' | 'negative' | 'unknown';
  topComplaints: string[];
  topPraises: string[];
  issues: string[];
  summary: string;
}

@Injectable()
export class GoogleBusinessService {
  constructor(
    private readonly crawlerService: CrawlerService,
    private readonly aiService: AiService,
  ) {}

  /**
   * Analyze a Google Business Profile page (provided URL or Place URL).
   * Crawler-based extraction of rating/reviews/categories; AI summarizes
   * sentiment. For full review history, plug the Google Places API here.
   */
  async analyze(profileUrl: string): Promise<GoogleBusinessResult> {
    const fallback: GoogleBusinessResult = {
      found: false,
      hasWebsite: false,
      sentiment: 'unknown',
      topComplaints: [],
      topPraises: [],
      issues: ['Google Business profile could not be fetched.'],
      summary: 'No Google Business data available.',
    };

    try {
      const crawl: CrawlResult = await this.crawlerService.crawl(profileUrl, 3);
      const html = crawl.pages.map((p) => p.htmlContent ?? '').join('\n');

      const ratingMatch = html.match(/(\d\.\d)\s*(?:out of|\/)\s*5/i)
        || html.match(/(\d\.\d)\s*★/i)
        || html.match(/(\d\.\d)/i);
      const rating = ratingMatch ? parseFloat(ratingMatch[1]) : undefined;

      const reviewMatch = html.match(/(\d[\d,]*)\s*(?:reviews|Google reviews)/i);
      const reviewCount = reviewMatch ? parseInt(reviewMatch[1].replace(/[^\d]/g, ''), 10) : undefined;

      const nameMatch = html.match(/<title>([^<|]+(?:[-|] Google Maps)?)/i);
      const name = nameMatch ? nameMatch[1].replace(/\s*[-|] Google Maps$/, '').trim() : undefined;

      const hasWebsite = /<a[^>]*href="https?:\/\/(?!maps\.google|google\.com\/maps)[^"]*"[^>]*>/i.test(html);
      const issues: string[] = [];
      if (!rating) issues.push('No rating detected on the profile page.');
      if (!reviewCount) issues.push('Review count not detectable from the page.');
      if (!hasWebsite) issues.push('No website linked from the Google Business profile.');

      // Lightweight sentiment from visible review snippets via AI.
      let sentiment: GoogleBusinessResult['sentiment'] = 'unknown';
      let topComplaints: string[] = [];
      let topPraises: string[] = [];
      let summary = `${name ?? 'Business'} — rating ${rating ?? 'n/a'} from ${reviewCount ?? 0} reviews.`;
      try {
        const snippet = html.slice(0, 4000);
        const prompt = `From these Google Business review snippets, return JSON with: sentiment (positive|mixed|negative), topComplaints (array of short strings), topPraises (array of short strings), and a one-sentence summary. Snippets: ${snippet}`;
        const { data } = await this.aiService.generateJson(
          'cheap',
          'You are a review sentiment analyzer. Respond only with valid JSON.',
          prompt,
          { maxTokens: 300, temperature: 0.3 },
        );
        const obj = data as any;
        if (obj && typeof obj === 'object') {
          sentiment = obj.sentiment ?? sentiment;
          topComplaints = Array.isArray(obj.topComplaints) ? obj.topComplaints : [];
          topPraises = Array.isArray(obj.topPraises) ? obj.topPraises : [];
          if (obj.summary) summary = obj.summary;
        }
      } catch {
        /* keep fallback */
      }

      return {
        found: true,
        name,
        rating,
        reviewCount,
        hasWebsite,
        sentiment,
        topComplaints,
        topPraises,
        issues,
        summary,
      };
    } catch {
      return fallback;
    }
  }
}
