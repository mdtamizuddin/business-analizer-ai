import { Injectable, Logger } from '@nestjs/common';
import type { CrawlResult } from '../crawler/crawler.service';
import type { AccessibilityAnalysis } from '@abap/types';

@Injectable()
export class AccessibilityService {
  private readonly logger = new Logger(AccessibilityService.name);

  analyze(crawlResult: CrawlResult): AccessibilityAnalysis {
    const issues: string[] = [];
    const details: Record<string, unknown> = {};
    const homepage = crawlResult.pages[0];

    if (!homepage) {
      return {
        score: 0,
        hasAltTextOnImages: false,
        hasLangAttribute: false,
        hasAriaLabels: false,
        hasSkipLink: false,
        headingStructureValid: false,
        contrastRatioIssues: 0,
        issues: ['No homepage data available'],
        details: {},
      };
    }

    const html = homepage.htmlContent ?? '';

    const hasAltTextOnImages = /<img[^>]+alt\s*=\s*["'][^"']+["']/i.test(html);
    if (!hasAltTextOnImages) {
      issues.push('Missing alt text on images — screen readers cannot describe images');
    }

    const hasLangAttribute = /<html[^>]+lang\s*=\s*["'][^"']+["']/i.test(html);
    if (!hasLangAttribute) {
      issues.push('Missing lang attribute on <html> element');
    }

    const hasAriaLabels = /aria-label\s*=\s*["'][^"']+["']/i.test(html) || /aria-labelledby\s*=\s*["'][^"']+["']/i.test(html);
    if (!hasAriaLabels) {
      issues.push('No ARIA labels detected — interactive elements may lack accessible names');
    }

    const hasSkipLink = /<a[^>]+href\s*=\s*["']#(main|content|skip)["'][^>]*>/i.test(html);
    if (!hasSkipLink) {
      issues.push('No skip navigation link found — keyboard users must tab through all navigation');
    }

    const headings = html.match(/<h[1-6][^>]*>/gi);
    const h1Count = headings?.filter((h: string) => /<h1\b/i.test(h)).length ?? 0;
    const headingStructureValid = h1Count === 1;
    if (h1Count === 0) {
      issues.push('No H1 heading — page structure is unclear for screen readers');
    } else if (h1Count > 1) {
      issues.push(`Multiple H1 headings (${h1Count}) — should have exactly one`);
    }

    const contrastRatioIssues = 0;
    const totalImages = homepage.metadata.imageCount ?? 0;
    if (totalImages > 0) {
      const imagesWithAlt = html.match(/<img[^>]+alt\s*=\s*["'][^"']*["']/gi)?.length ?? 0;
      if (imagesWithAlt < totalImages) {
        issues.push(`${totalImages - imagesWithAlt} image(s) missing alt text`);
      }
    }

    let score = 100;
    if (!hasAltTextOnImages) score -= 20;
    if (!hasLangAttribute) score -= 15;
    if (!hasAriaLabels) score -= 15;
    if (!hasSkipLink) score -= 10;
    if (h1Count === 0) score -= 20;
    else if (h1Count > 1) score -= 10;
    if (contrastRatioIssues > 0) score -= Math.min(contrastRatioIssues * 5, 20);

    details.hasAltTextOnImages = hasAltTextOnImages;
    details.hasLangAttribute = hasLangAttribute;
    details.hasAriaLabels = hasAriaLabels;
    details.hasSkipLink = hasSkipLink;
    details.h1Count = h1Count;

    this.logger.log(`Accessibility analysis: score=${score}, issues=${issues.length}`);

    return {
      score,
      hasAltTextOnImages,
      hasLangAttribute,
      hasAriaLabels,
      hasSkipLink,
      headingStructureValid,
      contrastRatioIssues,
      issues,
      details,
    };
  }
}
