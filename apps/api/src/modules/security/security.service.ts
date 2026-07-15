import { Injectable, Logger } from '@nestjs/common';
import type { CrawlResult } from '../crawler/crawler.service';
import type { SecurityAnalysis } from '@abap/types';

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);

  analyze(crawlResult: CrawlResult): SecurityAnalysis {
    const issues: string[] = [];
    const details: Record<string, unknown> = {};

    const homepage = crawlResult.pages[0];
    if (!homepage) {
      return {
        score: 0,
        hasSsl: false,
        hasHsts: false,
        hasXssProtection: false,
        hasContentTypeOptions: false,
        hasFrameOptions: false,
        hasCsp: false,
        issues: ['No data available'],
        details: {},
      };
    }

    const url = homepage.url;
    const hasSsl = url.startsWith('https://');
    if (!hasSsl) {
      issues.push('Site is not served over HTTPS — data is transmitted in plain text');
    }

    const html = homepage.htmlContent ?? '';

    const hasHsts = /Strict-Transport-Security/i.test(html)
      || /max-age=\d+/i.test(html);
    if (!hasHsts) {
      issues.push('No HSTS header detected — vulnerable to downgrade attacks');
    }

    const hasXssProtection = /X-XSS-Protection/i.test(html)
      || /X-Content-Type-Options:\s*nosniff/i.test(html);
    if (!hasXssProtection) {
      issues.push('No XSS protection headers detected');
    }

    const hasContentTypeOptions = /X-Content-Type-Options:\s*nosniff/i.test(html);
    if (!hasContentTypeOptions) {
      issues.push('No X-Content-Type-Options header — MIME type sniffing possible');
    }

    const hasFrameOptions = /X-Frame-Options/i.test(html) || /frame-ancestors/i.test(html);
    if (!hasFrameOptions) {
      issues.push('No clickjacking protection (X-Frame-Options or CSP frame-ancestors)');
    }

    const hasCsp = /Content-Security-Policy/i.test(html) || /default-src/i.test(html);
    if (!hasCsp) {
      issues.push('No Content Security Policy detected — XSS risk is higher');
    }

    let score = 100;
    if (!hasSsl) score -= 30;
    if (!hasHsts) score -= 15;
    if (!hasXssProtection) score -= 10;
    if (!hasContentTypeOptions) score -= 10;
    if (!hasFrameOptions) score -= 15;
    if (!hasCsp) score -= 20;

    details.url = url;
    details.hasSsl = hasSsl;

    this.logger.log(`Security analysis: score=${score}, issues=${issues.length}`);

    return {
      score,
      hasSsl,
      hasHsts,
      hasXssProtection,
      hasContentTypeOptions,
      hasFrameOptions,
      hasCsp,
      issues,
      details,
    };
  }
}
