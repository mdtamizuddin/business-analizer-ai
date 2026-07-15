import { Injectable } from '@nestjs/common';
import { CrawlerService, CrawlResult } from '../crawler/crawler.service';
import { AiService } from '../ai/ai.service';

export interface SocialProfileResult {
  platform: string;
  url: string;
  found: boolean;
  followerText?: string;
  postCount?: number;
  bioPresent: boolean;
  issues: string[];
}

export interface SocialAnalysisResult {
  profiles: SocialProfileResult[];
  consistencyScore: number;
  presenceScore: number;
  summary: string;
}

@Injectable()
export class SocialService {
  constructor(
    private readonly crawlerService: CrawlerService,
    private readonly aiService: AiService,
  ) {}

  /**
   * Analyze a list of social profile URLs. Uses the crawler to fetch each
   * public page and extracts lightweight presence signals. For full
   * engagement/follower metrics, plug native platform APIs here later.
   */
  async analyze(profiles: { platform: string; url: string }[]): Promise<SocialAnalysisResult> {
    const results: SocialProfileResult[] = [];

    for (const p of profiles) {
      try {
        const crawl: CrawlResult = await this.crawlerService.crawl(p.url, 1);
        const page = crawl.pages[0];
        const html = page?.htmlContent ?? '';
        const issues: string[] = [];

        const bioPresent = /<meta[^>]*name="description"[^>]*content="[^"]{10,}/i.test(html)
          || /<meta[^>]*property="og:description"[^>]*content="[^"]{10,}/i.test(html);
        if (!bioPresent) issues.push('No clear bio/description detected on the profile.');

        const followerMatch = html.match(/(\d[\d.,]*\s?(?:followers|subscribers|fans|connections))/i);
        const followerText = followerMatch ? followerMatch[1] : undefined;

        const postMatch = html.match(/(\d[\d.,]*\s?(?:posts|videos|tweets))/i);
        const postCount = postMatch ? parseInt(postMatch[1].replace(/[^\d]/g, ''), 10) : undefined;

        results.push({
          platform: p.platform,
          url: p.url,
          found: !!page,
          followerText,
          postCount,
          bioPresent,
          issues,
        });
      } catch {
        results.push({
          platform: p.platform,
          url: p.url,
          found: false,
          bioPresent: false,
          issues: ['Profile could not be fetched (private, blocked, or invalid URL).'],
        });
      }
    }

    const presenceScore = Math.round((results.filter((r) => r.found).length / Math.max(results.length, 1)) * 100);
    const consistencyScore = Math.round(
      (results.filter((r) => r.found && r.bioPresent).length / Math.max(results.filter((r) => r.found).length, 1)) * 100,
    );

    let summary = `${results.filter((r) => r.found).length} of ${results.length} social profiles found.`;
    try {
      const prompt = `Summarize this social media presence for a business consultant in 2 sentences. Profiles: ${JSON.stringify(results.map((r) => ({ platform: r.platform, found: r.found, followers: r.followerText, posts: r.postCount, bio: r.bioPresent })))}`;
      const { content } = await this.aiService.generate('cheap', prompt, { maxTokens: 200, temperature: 0.4 });
      summary = (content as string) ?? summary;
    } catch {
      /* keep fallback summary */
    }

    return { profiles: results, consistencyScore, presenceScore, summary };
  }
}
