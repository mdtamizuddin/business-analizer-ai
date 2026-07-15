import { Injectable, Logger } from '@nestjs/common';
import type { CrawlResult } from '../crawler/crawler.service';
import type { TechnologyDetection } from '@abap/types';

interface Fingerprint {
  name: string;
  category: 'cms' | 'framework' | 'analytics' | 'library' | 'css' | 'hosting';
  patterns: RegExp[];
}

const FINGERPRINTS: Fingerprint[] = [
  { name: 'WordPress', category: 'cms', patterns: [/wp-content/i, /wp-includes/i, /wordpress/i] },
  { name: 'Shopify', category: 'cms', patterns: [/shopify/i, /myshopify\.com/i, /cdn\.shopify/i] },
  { name: 'Wix', category: 'cms', patterns: [/wix\.com/i, /wixstatic\.com/i, /X-Wix-Published-Version/i] },
  { name: 'Squarespace', category: 'cms', patterns: [/squarespace\.com/i, /static1\.squarespace/i] },
  { name: 'Drupal', category: 'cms', patterns: [/drupal/i, /sites\/default\/files/i] },
  { name: 'Joomla', category: 'cms', patterns: [/joomla/i, /com_content/i] },
  { name: 'Next.js', category: 'framework', patterns: [/__next/i, /next\.js/i, /\/_next\/static/i] },
  { name: 'React', category: 'framework', patterns: [/react\.js/i, /react-dom/i, /__REACT_DEVTOOLS/i] },
  { name: 'Vue.js', category: 'framework', patterns: [/vue\.js/i, /vue\.min\.js/i, /__vue__/i] },
  { name: 'Angular', category: 'framework', patterns: [/angular\.js/i, /ng-app/i, /ng-version/i] },
  { name: 'Laravel', category: 'framework', patterns: [/laravel/i, /csrf-token/i, /livewire/i] },
  { name: 'Google Analytics', category: 'analytics', patterns: [/gtag/i, /google-analytics/i, /ga\.js/i, /ga\(/i] },
  { name: 'Facebook Pixel', category: 'analytics', patterns: [/fbq\(/i, /connect\.facebook\.net/i, /pixel/i] },
  { name: 'Hotjar', category: 'analytics', patterns: [/hotjar/i, /hj\.js/i] },
  { name: 'HubSpot', category: 'analytics', patterns: [/hubspot/i, /hs-scripts/i, /hs-analytics/i] },
  { name: 'jQuery', category: 'library', patterns: [/jquery/i, /\$\./i, /jQuery/i] },
  { name: 'Bootstrap', category: 'css', patterns: [/bootstrap/i, /bootstrap\.min\.css/i] },
  { name: 'Tailwind CSS', category: 'css', patterns: [/tailwind/i, /^\.tw-/i] },
  { name: 'Cloudflare', category: 'hosting', patterns: [/cloudflare/i, /__cfduid/i, /cf-ray/i] },
  { name: 'AWS', category: 'hosting', patterns: [/amazonaws\.com/i, /aws\.com/i, /cloudfront\.net/i] },
  { name: 'Netlify', category: 'hosting', patterns: [/netlify/i, /netlify\.app/i] },
  { name: 'Vercel', category: 'hosting', patterns: [/vercel/i, /vercel\.app/i] },
];

@Injectable()
export class TechnologyService {
  private readonly logger = new Logger(TechnologyService.name);

  detect(crawlResult: CrawlResult): TechnologyDetection {
    const html = crawlResult.pages.map((p) => p.htmlContent ?? '').join('\n');
    const headers = crawlResult.pages[0]?.htmlContent ?? '';

    const detected = new Set<string>();
    const frameworks: string[] = [];
    const analytics: string[] = [];
    const javascriptLibraries: string[] = [];
    const cssFrameworks: string[] = [];
    let cms: string | undefined;
    let hosting: string | undefined;

    for (const fp of FINGERPRINTS) {
      const match = fp.patterns.some((p) => p.test(html) || p.test(headers));
      if (!match) continue;
      if (detected.has(fp.name)) continue;
      detected.add(fp.name);

      switch (fp.category) {
        case 'cms':
          cms = fp.name;
          break;
        case 'framework':
          frameworks.push(fp.name);
          break;
        case 'analytics':
          analytics.push(fp.name);
          break;
        case 'library':
          javascriptLibraries.push(fp.name);
          break;
        case 'css':
          cssFrameworks.push(fp.name);
          break;
        case 'hosting':
          hosting = fp.name;
          break;
      }
    }

    const detectedCount = cms ? 1 : 0
      + frameworks.length + analytics.length
      + javascriptLibraries.length + cssFrameworks.length
      + (hosting ? 1 : 0);

    this.logger.log(`Technology detection: ${detectedCount} technologies detected`);

    return {
      cms,
      frameworks,
      analytics,
      hosting,
      sslProvider: undefined,
      javascriptLibraries,
      cssFrameworks,
      detected: detectedCount > 0,
      details: {
        totalTechnologies: detectedCount,
        allDetected: Array.from(detected),
      },
    };
  }
}
