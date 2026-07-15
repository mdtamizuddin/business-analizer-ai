import type { ExtractedFacts } from './facts';
import { SEVERITY, type Severity, BUSINESS_IMPACT, type BusinessImpact, type ServiceType } from './types';

export interface ScoreRule {
  category: string;
  weight: number;
  evaluate: (facts: ExtractedFacts) => number;
  issues: (facts: ExtractedFacts) => string[];
}

export interface RecommendationRule {
  id: string;
  type: string;
  condition: (facts: ExtractedFacts) => boolean;
  priority: Severity;
  businessImpact: BusinessImpact;
  service: ServiceType;
  title: (facts: ExtractedFacts) => string;
  problem: (facts: ExtractedFacts) => string;
  evidence: (facts: ExtractedFacts) => string;
  effort: string;
  roi: string;
}

export const SCORE_RULES: ScoreRule[] = [
  {
    category: 'seo',
    weight: 0.15,
    evaluate(f) {
      let s = 100;
      if (!f.hasTitle) s -= 30;
      else if (f.titleLength > 60) s -= 10;
      if (!f.hasMetaDescription) s -= 25;
      else if (f.metaDescriptionLength > 160) s -= 10;
      if (!f.hasH1) s -= 40;
      else if (f.h1Count > 1) s -= 15;
      if (f.h2Count === 0) s -= 15;
      if (!f.hasCanonical) s -= 30;
      if (!f.hasOpenGraphTitle) s -= 25;
      if (!f.hasOpenGraphImage) s -= 25;
      if (!f.hasStructuredData) s -= 20;
      if (f.hasRobotsNoindex) s = 0;
      else if (f.hasRobotsNofollow) s -= 50;
      if (f.internalLinksCount < 5) s -= 30;
      else if (f.internalLinksCount < 20) s -= 15;
      return Math.max(0, s);
    },
    issues(f) {
      const i: string[] = [];
      if (!f.hasTitle) i.push('Missing <title> tag');
      if (!f.hasMetaDescription) i.push('Missing meta description');
      if (!f.hasH1) i.push('Missing H1 tag');
      if (f.h1Count > 1) i.push(`Multiple H1 tags (${f.h1Count})`);
      if (!f.hasCanonical) i.push('Missing canonical URL');
      if (!f.hasOpenGraphTitle) i.push('Missing Open Graph title');
      if (!f.hasStructuredData) i.push('No structured data found');
      if (f.hasRobotsNoindex) i.push('Homepage has noindex directive');
      if (f.internalLinksCount < 5) i.push('Very few internal links');
      return i;
    },
  },
  {
    category: 'performance',
    weight: 0.10,
    evaluate(f) {
      let s = 100;
      if (f.lcp !== undefined) { if (f.lcp > 4000) s -= 40; else if (f.lcp > 2500) s -= 20; }
      if (f.fcp !== undefined) { if (f.fcp > 3000) s -= 30; else if (f.fcp > 1800) s -= 15; }
      if (f.cls !== undefined) { if (f.cls > 0.25) s -= 30; else if (f.cls > 0.1) s -= 15; }
      if (f.ttfb !== undefined) { if (f.ttfb > 1800) s -= 25; else if (f.ttfb > 800) s -= 10; }
      if (f.averageLoadTimeMs > 5000) s -= 30;
      else if (f.averageLoadTimeMs > 3000) s -= 15;
      return Math.max(0, s);
    },
    issues(f) {
      const i: string[] = [];
      if (f.lcp && f.lcp > 4000) i.push(`LCP is ${Math.round(f.lcp)}ms (poor)`);
      if (f.cls !== undefined && f.cls > 0.25) i.push(`CLS is ${f.cls.toFixed(2)} (poor)`);
      if (f.ttfb && f.ttfb > 1800) i.push(`TTFB is ${Math.round(f.ttfb)}ms (poor)`);
      if (f.averageLoadTimeMs > 3000) i.push(`Average load time ${Math.round(f.averageLoadTimeMs)}ms`);
      return i;
    },
  },
  {
    category: 'accessibility',
    weight: 0.10,
    evaluate(f) {
      let s = 100;
      if (!f.hasTitle) s -= 20;
      if (!f.hasMetaDescription) s -= 10;
      if (!f.hasH1) s -= 25;
      if (f.h1Count > 1) s -= 10;
      if (f.homepageImageCount > 0) s += 10;
      if (f.averageLoadTimeMs > 4000) s -= 15;
      if (f.colorCount < 2) s -= 10;
      return Math.max(0, Math.min(100, s));
    },
    issues(f) {
      const i: string[] = [];
      if (!f.hasH1) i.push('No H1 heading — screen readers rely on heading structure');
      if (f.h1Count > 1) i.push(`Multiple H1 tags (${f.h1Count})`);
      if (!f.hasTitle) i.push('No page title — assistive technologies need titles');
      return i;
    },
  },
  {
    category: 'security',
    weight: 0.10,
    evaluate(f) {
      let s = 100;
      if (!f.hasCanonical) s -= 10;
      if (f.hasRobotsNoindex) s -= 20;
      if (f.blockedPageCount > 0) s -= 15;
      if (f.externalLinksCount === 0) s -= 5;
      if (f.averageLoadTimeMs > 5000) s -= 10;
      return Math.max(0, s);
    },
    issues(f) {
      const i: string[] = [];
      if (f.blockedPageCount > 0) i.push(`${f.blockedPageCount} pages blocked during crawl`);
      return i;
    },
  },
  {
    category: 'branding',
    weight: 0.15,
    evaluate(f) {
      let s = 40;
      if (f.hasLogo) s += 20;
      if (f.hasFavicon) s += 10;
      if (f.colorCount >= 2) s += 10;
      else if (f.colorCount >= 1) s += 5;
      if (f.customFontCount > 0) s += 10;
      if (f.homepageImageCount > 0) s += 10;
      return Math.min(100, s);
    },
    issues(f) {
      const i: string[] = [];
      if (!f.hasLogo) i.push('No logo detected in header');
      if (!f.hasFavicon) i.push('No favicon detected');
      if (f.colorCount < 2) i.push('Limited color palette');
      if (f.customFontCount === 0) i.push('Only system fonts in use');
      return i;
    },
  },
  {
    category: 'website',
    weight: 0.15,
    evaluate(f) {
      let s = 100;
      if (!f.hasTitle) s -= 15;
      if (!f.hasMetaDescription) s -= 10;
      if (!f.hasH1) s -= 20;
      if (f.averageLoadTimeMs > 4000) s -= 25;
      else if (f.averageLoadTimeMs > 2000) s -= 10;
      if (f.homepageImageCount === 0) s -= 15;
      if (f.internalLinksCount < 10) s -= 15;
      if (f.blockedPageCount > 0) s -= 10;
      return Math.max(0, s);
    },
    issues(f) {
      const i: string[] = [];
      if (f.averageLoadTimeMs > 4000) i.push(`Slow average load time (${Math.round(f.averageLoadTimeMs)}ms)`);
      if (f.homepageImageCount === 0) i.push('No images on homepage');
      return i;
    },
  },
  {
    category: 'social_media',
    weight: 0.05,
    evaluate(f) {
      if (f.socialProfilesTotal === 0) return 50;
      return Math.round((f.socialProfilesFound / f.socialProfilesTotal) * 100);
    },
    issues(f) {
      const i: string[] = [];
      if (f.socialProfilesFound < f.socialProfilesTotal) {
        i.push(`${f.socialProfilesFound}/${f.socialProfilesTotal} social profiles found`);
      }
      return i;
    },
  },
  {
    category: 'customer_trust',
    weight: 0.10,
    evaluate(f) {
      let s = 60;
      if (f.hasLogo) s += 10;
      if (f.hasFavicon) s += 5;
      if (f.hasCanonical) s += 5;
      if (f.hasStructuredData) s += 5;
      if (f.googleBusinessRating !== undefined && f.googleBusinessRating >= 4) s += 10;
      if (f.googleBusinessRating !== undefined && f.googleBusinessRating >= 4.5) s += 5;
      if ((f.googleBusinessReviewCount ?? 0) > 50) s += 5;
      if (f.externalLinksCount > 0) s += 5;
      return Math.min(100, s);
    },
    issues(f) {
      const i: string[] = [];
      if (f.googleBusinessRating !== undefined && f.googleBusinessRating < 4) {
        i.push(`Google rating ${f.googleBusinessRating} — below 4.0 threshold`);
      }
      return i;
    },
  },
  {
    category: 'conversion',
    weight: 0.05,
    evaluate(f) {
      let s = 70;
      if (f.hasTitle && f.hasMetaDescription) s += 5;
      if (f.hasOpenGraphImage) s += 5;
      if (f.averageLoadTimeMs < 2000) s += 10;
      else if (f.averageLoadTimeMs < 4000) s += 5;
      else s -= 10;
      if (f.homepageImageCount > 0) s += 5;
      if (f.hasStructuredData) s += 5;
      if (f.internalLinksCount > 20) s += 5;
      return Math.min(100, s);
    },
    issues(f) {
      const i: string[] = [];
      if (f.averageLoadTimeMs > 4000) i.push('Slow page load hurts conversion rates');
      if (!f.hasOpenGraphImage) i.push('No OG image — poor social share previews');
      return i;
    },
  },
  {
    category: 'customer_experience',
    weight: 0.05,
    evaluate(f) {
      let s = 70;
      if (f.averageLoadTimeMs < 2000) s += 10;
      else if (f.averageLoadTimeMs < 4000) s += 5;
      else s -= 10;
      if (f.homepageImageCount > 0) s += 5;
      if (f.hasH1) s += 5;
      if (f.internalLinksCount > 10) s += 5;
      if (f.blockedPageCount === 0) s += 5;
      if (f.hasFavicon) s += 5;
      return Math.min(100, s);
    },
    issues(f) {
      const i: string[] = [];
      if (f.averageLoadTimeMs > 4000) i.push('Poor load times degrade user experience');
      if (!f.hasH1) i.push('Missing H1 — unclear content hierarchy');
      return i;
    },
  },
];

export const RECOMMENDATION_RULES: RecommendationRule[] = [
  {
    id: 'missing-title',
    type: 'seo_improvement',
    condition: (f) => !f.hasTitle,
    priority: SEVERITY.CRITICAL,
    businessImpact: BUSINESS_IMPACT.SEO,
    service: 'SEO Optimization',
    title: () => 'Add an HTML title tag to the homepage',
    problem: () => 'The homepage is missing a <title> tag, which is essential for search engine ranking and social sharing.',
    evidence: (f) => `No <title> tag found on ${f.url}`,
    effort: 'Low',
    roi: '15-30% improvement in organic click-through rate',
  },
  {
    id: 'long-title',
    type: 'seo_improvement',
    condition: (f) => f.hasTitle && f.titleLength > 60,
    priority: SEVERITY.HIGH,
    businessImpact: BUSINESS_IMPACT.SEO,
    service: 'SEO Optimization',
    title: () => 'Optimize the page title length',
    problem: (f) => `The page title is ${f.titleLength} characters (recommended: under 60). Long titles get truncated in search results.`,
    evidence: (f) => `Title "${f.url}" is ${f.titleLength} chars long`,
    effort: 'Low',
    roi: '10-20% better SERP visibility',
  },
  {
    id: 'missing-meta-description',
    type: 'seo_improvement',
    condition: (f) => !f.hasMetaDescription,
    priority: SEVERITY.HIGH,
    businessImpact: BUSINESS_IMPACT.SEO,
    service: 'SEO Optimization',
    title: () => 'Add a meta description to the homepage',
    problem: () => 'Missing meta description — search engines will auto-generate snippets, reducing click-through rate.',
    evidence: () => 'No meta description tag detected',
    effort: 'Low',
    roi: '5-15% improvement in organic CTR',
  },
  {
    id: 'missing-h1',
    type: 'seo_improvement',
    condition: (f) => !f.hasH1,
    priority: SEVERITY.CRITICAL,
    businessImpact: BUSINESS_IMPACT.SEO,
    service: 'SEO Optimization',
    title: () => 'Add an H1 heading to the homepage',
    problem: () => 'Missing H1 tag — search engines use H1 as a key relevance signal. Users rely on it for content hierarchy.',
    evidence: () => 'Zero H1 tags found on homepage',
    effort: 'Low',
    roi: '10-20% improvement in keyword relevance',
  },
  {
    id: 'multiple-h1',
    type: 'seo_improvement',
    condition: (f) => f.h1Count > 1,
    priority: SEVERITY.MEDIUM,
    businessImpact: BUSINESS_IMPACT.SEO,
    service: 'SEO Optimization',
    title: (f) => `Reduce H1 tags from ${f.h1Count} to one`,
    problem: (f) => `${f.h1Count} H1 tags detected — best practice is exactly one H1 per page for clear content hierarchy.`,
    evidence: (f) => `${f.h1Count} H1 elements on homepage`,
    effort: 'Low',
    roi: '5-10% improvement in content clarity signals',
  },
  {
    id: 'missing-canonical',
    type: 'seo_improvement',
    condition: (f) => !f.hasCanonical,
    priority: SEVERITY.MEDIUM,
    businessImpact: BUSINESS_IMPACT.SEO,
    service: 'SEO Optimization',
    title: () => 'Add a canonical URL tag',
    problem: () => 'Missing canonical URL — may cause duplicate content issues and dilute page authority.',
    evidence: () => 'No rel="canonical" tag found',
    effort: 'Low',
    roi: 'Prevents 10-30% SEO authority dilution',
  },
  {
    id: 'missing-og',
    type: 'marketing_opportunity',
    condition: (f) => !f.hasOpenGraphTitle || !f.hasOpenGraphImage,
    priority: SEVERITY.MEDIUM,
    businessImpact: BUSINESS_IMPACT.SOCIAL,
    service: 'Marketing Strategy',
    title: () => 'Implement Open Graph tags for social sharing',
    problem: () => 'Incomplete Open Graph tags — social media posts will lack rich preview cards, reducing engagement.',
    evidence: (f) => `OG title: ${f.hasOpenGraphTitle}, OG image: ${f.hasOpenGraphImage}`,
    effort: 'Low',
    roi: '20-40% better social engagement rates',
  },
  {
    id: 'missing-structured-data',
    type: 'seo_improvement',
    condition: (f) => !f.hasStructuredData,
    priority: SEVERITY.HIGH,
    businessImpact: BUSINESS_IMPACT.SEO,
    service: 'SEO Optimization',
    title: () => 'Add structured data markup',
    problem: () => 'No JSON-LD structured data found — limits eligibility for rich snippets and knowledge panels.',
    evidence: () => 'No schema.org markup detected',
    effort: 'Medium',
    roi: '15-30% increase in rich result visibility',
  },
  {
    id: 'noindex-detected',
    type: 'seo_improvement',
    condition: (f) => f.hasRobotsNoindex,
    priority: SEVERITY.CRITICAL,
    businessImpact: BUSINESS_IMPACT.SEO,
    service: 'SEO Optimization',
    title: () => 'Remove noindex directive from homepage',
    problem: () => 'The homepage has a noindex robots directive — search engines will not index this page at all.',
    evidence: () => 'meta robots noindex detected',
    effort: 'Low',
    roi: 'Restores 100% search visibility',
  },
  {
    id: 'slow-lcp',
    type: 'website_improvement',
    condition: (f) => f.lcp !== undefined && f.lcp > 4000,
    priority: SEVERITY.CRITICAL,
    businessImpact: BUSINESS_IMPACT.PERFORMANCE,
    service: 'Website Optimization',
    title: () => 'Optimize Largest Contentful Paint (LCP)',
    problem: (f) => `LCP is ${Math.round(f.lcp!)}ms (target: under 2500ms). Slow LCP frustrates users and hurts SEO.`,
    evidence: (f) => `LCP measured at ${Math.round(f.lcp!)}ms`,
    effort: 'Medium',
    roi: '20-40% reduction in bounce rate',
  },
  {
    id: 'poor-cls',
    type: 'website_improvement',
    condition: (f) => f.cls !== undefined && f.cls > 0.25,
    priority: SEVERITY.HIGH,
    businessImpact: BUSINESS_IMPACT.PERFORMANCE,
    service: 'Website Optimization',
    title: () => 'Fix Cumulative Layout Shift (CLS)',
    problem: (f) => `CLS is ${f.cls!.toFixed(2)} (target: under 0.1). Layout shifts create poor user experience.`,
    evidence: (f) => `CLS measured at ${f.cls!.toFixed(2)}`,
    effort: 'Medium',
    roi: '15-25% improvement in user experience metrics',
  },
  {
    id: 'slow-ttfb',
    type: 'website_improvement',
    condition: (f) => f.ttfb !== undefined && f.ttfb > 1800,
    priority: SEVERITY.HIGH,
    businessImpact: BUSINESS_IMPACT.PERFORMANCE,
    service: 'Website Optimization',
    title: () => 'Improve Time to First Byte (TTFB)',
    problem: (f) => `TTFB is ${Math.round(f.ttfb!)}ms (target: under 800ms). Slow server response delays everything.`,
    evidence: (f) => `TTFB measured at ${Math.round(f.ttfb!)}ms`,
    effort: 'Medium',
    roi: '10-30% faster overall page load',
  },
  {
    id: 'missing-logo',
    type: 'branding_improvement',
    condition: (f) => !f.hasLogo,
    priority: SEVERITY.HIGH,
    businessImpact: BUSINESS_IMPACT.BRAND,
    service: 'Branding & Identity Design',
    title: () => 'Add a logo to your website header',
    problem: () => 'No clear logo detected — visitors may not immediately recognize your brand.',
    evidence: () => 'No img/svg with logo/brand class found in header',
    effort: 'Medium',
    roi: '23% increase in brand recall (Nielsen Norman Group)',
  },
  {
    id: 'missing-favicon',
    type: 'branding_improvement',
    condition: (f) => !f.hasFavicon,
    priority: SEVERITY.MEDIUM,
    businessImpact: BUSINESS_IMPACT.BRAND,
    service: 'Branding & Identity Design',
    title: () => 'Add a favicon to your website',
    problem: () => 'No favicon detected — your brand is invisible in browser tabs and bookmarks.',
    evidence: () => 'No link rel="icon" or apple-touch-icon found',
    effort: 'Low',
    roi: '5-10% better return visitor recognition',
  },
  {
    id: 'weak-colors',
    type: 'branding_improvement',
    condition: (f) => f.colorCount < 2,
    priority: SEVERITY.MEDIUM,
    businessImpact: BUSINESS_IMPACT.BRAND,
    service: 'Branding & Identity Design',
    title: () => 'Define and apply a cohesive brand color palette',
    problem: (f) => `Only ${f.colorCount} distinct color${f.colorCount === 1 ? ' was' : 's were'} detected — weak visual identity.`,
    evidence: (f) => `${f.colorCount} colors detected on homepage`,
    effort: 'Medium',
    roi: '80% of consumers recognize color as brand differentiator',
  },
  {
    id: 'system-fonts-only',
    type: 'branding_improvement',
    condition: (f) => f.customFontCount === 0,
    priority: SEVERITY.MEDIUM,
    businessImpact: BUSINESS_IMPACT.BRAND,
    service: 'Branding & Identity Design',
    title: () => 'Use custom brand fonts instead of system defaults',
    problem: () => 'Only system fonts detected — custom typography is a key brand differentiator.',
    evidence: () => 'No custom font-family declarations found',
    effort: 'Medium',
    roi: 'Improves brand perception and readability',
  },
  {
    id: 'few-internal-links',
    type: 'website_improvement',
    condition: (f) => f.internalLinksCount < 5,
    priority: SEVERITY.MEDIUM,
    businessImpact: BUSINESS_IMPACT.SEO,
    service: 'Website Development',
    title: (f) => `Improve internal linking (only ${f.internalLinksCount} links found)`,
    problem: (f) => `Only ${f.internalLinksCount} internal links across all pages — poor site architecture and user navigation.`,
    evidence: (f) => `${f.internalLinksCount} internal links total`,
    effort: 'Medium',
    roi: '15-30% better crawl efficiency and user engagement',
  },
  {
    id: 'no-images',
    type: 'website_improvement',
    condition: (f) => f.homepageImageCount === 0,
    priority: SEVERITY.HIGH,
    businessImpact: BUSINESS_IMPACT.BRAND,
    service: 'Website Redesign',
    title: () => 'Add visual content to the homepage',
    problem: () => 'No images found on homepage — visual content is critical for engagement and brand storytelling.',
    evidence: () => 'Zero images on homepage',
    effort: 'Medium',
    roi: '40% higher engagement with visual content',
  },
  {
    id: 'avg-load-slow',
    type: 'website_improvement',
    condition: (f) => f.averageLoadTimeMs > 4000,
    priority: SEVERITY.CRITICAL,
    businessImpact: BUSINESS_IMPACT.PERFORMANCE,
    service: 'Website Optimization',
    title: (f) => `Optimize page load speed (avg ${Math.round(f.averageLoadTimeMs)}ms)`,
    problem: (f) => `Average page load is ${Math.round(f.averageLoadTimeMs)}ms — well above the 2-second benchmark.`,
    evidence: (f) => `Average load time ${Math.round(f.averageLoadTimeMs)}ms across ${f.totalPages} pages`,
    effort: 'High',
    roi: '53% of mobile users abandon sites taking over 3 seconds',
  },
  {
    id: 'missing-social',
    type: 'marketing_opportunity',
    condition: (f) => f.socialProfilesTotal > 0 && f.socialProfilesFound < f.socialProfilesTotal,
    priority: SEVERITY.MEDIUM,
    businessImpact: BUSINESS_IMPACT.SOCIAL,
    service: 'Marketing Strategy',
    title: (f) => `Connect missing social profiles (${f.socialProfilesFound}/${f.socialProfilesTotal} found)`,
    problem: (f) => `Only ${f.socialProfilesFound} of ${f.socialProfilesTotal} social profiles were confirmed.`,
    evidence: (f) => `${f.socialProfilesFound}/${f.socialProfilesTotal} profiles verified`,
    effort: 'Low',
    roi: '30% higher multi-channel engagement',
  },
  {
    id: 'low-gbp-rating',
    type: 'marketing_opportunity',
    condition: (f) => f.googleBusinessRating !== undefined && f.googleBusinessRating < 4,
    priority: SEVERITY.HIGH,
    businessImpact: BUSINESS_IMPACT.TRUST,
    service: 'Marketing Strategy',
    title: (f) => `Improve Google Business rating (${f.googleBusinessRating}/5)`,
    problem: (f) => `Google rating is ${f.googleBusinessRating}/5 — below the 4.0 threshold that builds consumer trust.`,
    evidence: (f) => `Rating: ${f.googleBusinessRating}/5 from ${f.googleBusinessReviewCount ?? 0} reviews`,
    effort: 'High',
    roi: '1-star increase = 5-9% revenue growth (Harvard Business School)',
  },
  {
    id: 'no-gbp-website',
    type: 'marketing_opportunity',
    condition: (f) => f.isLocalBusiness && f.googleBusinessRating === undefined,
    priority: SEVERITY.MEDIUM,
    businessImpact: BUSINESS_IMPACT.TRUST,
    service: 'Google Business Optimization',
    title: () => 'Set up or optimize Google Business Profile',
    problem: () => 'No Google Business Profile data detected — local searches may miss your business entirely.',
    evidence: () => 'No Google Business Profile found',
    effort: 'Low',
    roi: '78% of local mobile searches result in offline purchases',
  },
  {
    id: 'business-growth-general',
    type: 'business_growth',
    condition: (f) => f.totalPages < 5 && f.homepageImageCount === 0,
    priority: SEVERITY.MEDIUM,
    businessImpact: BUSINESS_IMPACT.GROWTH,
    service: 'Website Development',
    title: () => 'Develop a multi-page content strategy',
    problem: () => 'Very limited web presence — a single or few-page site limits SEO potential and user engagement.',
    evidence: (f) => `${f.totalPages} pages crawled, ${f.homepageImageCount} images`,
    effort: 'High',
    roi: '400% more search queries on sites with 10+ pages',
  },
];
