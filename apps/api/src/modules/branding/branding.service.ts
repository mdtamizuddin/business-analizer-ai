import { Injectable, Logger } from '@nestjs/common';
import type { CrawlResult } from '../crawler/crawler.service';

export interface BrandingAnalysisResult {
  colorsDetected: string[];
  fontsDetected: string[];
  logoPresent: boolean;
  hasFavicon: boolean;
  imageCount: number;
  totalImages: number;
  brandScore: number;
  issues: string[];
  details: Record<string, unknown>;
}

/**
 * Branding analysis.
 *
 * Extracts visual-identity signals from the crawled homepage HTML: dominant
 * color palette (from inline styles, CSS rules and OG image), font families,
 * logo presence (header img / svg / wordmark), and favicon. Scores a simple
 * branding-consistency signal. A full vision-based analysis (logo quality,
 * visual hierarchy) would use the screenshot + a vision model later.
 */
@Injectable()
export class BrandingService {
  private readonly logger = new Logger(BrandingService.name);

  // Common system/web-safe fonts to filter out of "brand fonts" detection.
  private readonly SYSTEM_FONTS = new Set([
    'arial', 'helvetica', 'times', 'times new roman', 'courier', 'courier new',
    'verdana', 'georgia', 'palatino', 'garamond', 'comic sans ms', 'trebuchet ms',
    'system-ui', 'sans-serif', 'serif', 'monospace', 'inherit', 'initial',
  ]);

  analyze(crawlResult: CrawlResult): BrandingAnalysisResult {
    const homepage = crawlResult.pages[0];
    const issues: string[] = [];
    const details: Record<string, unknown> = {};

    if (!homepage) {
      issues.push('No homepage captured — cannot analyze branding.');
      return {
        colorsDetected: [],
        fontsDetected: [],
        logoPresent: false,
        hasFavicon: false,
        imageCount: 0,
        totalImages: 0,
        brandScore: 0,
        issues,
        details,
      };
    }

    const html = homepage.htmlContent ?? '';
    const metadata = homepage.metadata ?? {};

    // --- Color extraction (hex + rgb from inline styles and CSS blocks) ---
    const colors = new Set<string>();
    const hexMatches = html.match(/#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g) ?? [];
    for (const h of hexMatches) colors.add(h.toLowerCase());
    const rgbMatches = html.match(/rgb\(\s*\d{1,3}[,\s]+\d{1,3}[,\s]+\d{1,3}\s*\)/g) ?? [];
    for (const r of rgbMatches) colors.add(r.replace(/\s+/g, ''));
    const colorsDetected = Array.from(colors).slice(0, 12);
    details.colorsCount = colorsDetected.length;

    // --- Font extraction (font-family declarations) ---
    const fonts = new Set<string>();
    const fontMatches = html.match(/font-family\s*:\s*([^;}"']+)/gi) ?? [];
    for (const fm of fontMatches) {
      const body = fm.split(':')[1] ?? '';
      for (const part of body.split(',')) {
        const f = part.trim().replace(/['"]/g, '').toLowerCase();
        if (f && !this.SYSTEM_FONTS.has(f) && !f.includes('px')) fonts.add(f);
      }
    }
    const fontsDetected = Array.from(fonts).slice(0, 8);
    details.fontsCount = fontsDetected.length;

    // --- Logo presence (header img, svg, or brand wordmark in title) ---
    const hasHeaderImg = /<(header|nav|div)[^>]*class="[^"]*(logo|brand|navbar-brand)[^"]*"[^>]*>[\s\S]*?<img/i.test(html)
      || /<img[^>]*(logo|brand)[^>]*>/i.test(html)
      || /<svg[^>]*>/.test(html);
    const logoPresent = hasHeaderImg;
    if (!logoPresent) issues.push('No clear logo detected in the page header (img/svg with logo/brand class).');

    // --- Favicon ---
    const hasFavicon = /<link[^>]*rel="[^"]*(icon|apple-touch-icon)[^"]*"[^>]*>/i.test(html)
      || /<link[^>]*rel='[^']*(icon|apple-touch-icon)[^']*'[^>]*>/i.test(html);
    if (!hasFavicon) issues.push('No favicon detected — missing brand presence in browser tabs.');

    // --- Images ---
    const imageCount = metadata.imageCount ?? 0;
    const totalImages = crawlResult.pages.reduce((s, p) => s + (p.metadata?.imageCount ?? 0), 0);
    details.totalImages = totalImages;

    if (colorsDetected.length < 2) issues.push('Limited color palette detected — brand may lack visual identity.');
    if (fontsDetected.length === 0) issues.push('Only system fonts detected — consider a custom brand typeface.');
    if (imageCount === 0) issues.push('No images on homepage — visual branding is weak.');

    // Branding health score (0-100) from detected signals.
    let brandScore = 0;
    brandScore += logoPresent ? 25 : 0;
    brandScore += hasFavicon ? 15 : 0;
    brandScore += Math.min(colorsDetected.length, 4) * 12; // up to 48
    brandScore += fontsDetected.length > 0 ? 12 : 0;

    this.logger.log(`Branding analysis complete for ${homepage.url}: ${colorsDetected.length} colors, ${fontsDetected.length} fonts`);

    return {
      colorsDetected,
      fontsDetected,
      logoPresent,
      hasFavicon,
      imageCount,
      totalImages,
      brandScore,
      issues,
      details,
    };
  }
}
