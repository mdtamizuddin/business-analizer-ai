import type { CrawledPage, SEOAnalysis, PerformanceAnalysis, BrandingAnalysis } from '@abap/types';

export interface ExtractedFacts {
  url: string;
  hostname: string;
  totalPages: number;
  crawlDurationMs: number;

  hasTitle: boolean;
  titleLength: number;
  hasMetaDescription: boolean;
  metaDescriptionLength: number;
  hasMetaKeywords: boolean;
  hasH1: boolean;
  h1Count: number;
  h2Count: number;
  hasCanonical: boolean;
  hasOpenGraphTitle: boolean;
  hasOpenGraphDescription: boolean;
  hasOpenGraphImage: boolean;
  hasStructuredData: boolean;
  structuredDataCount: number;
  hasRobotsNoindex: boolean;
  hasRobotsNofollow: boolean;
  internalLinksCount: number;
  externalLinksCount: number;
  averageLoadTimeMs: number;
  homepageImageCount: number;
  totalImages: number;
  blockedPageCount: number;

  hasLogo: boolean;
  hasFavicon: boolean;
  colorCount: number;
  customFontCount: number;

  lcp?: number;
  fcp?: number;
  cls?: number;
  ttfb?: number;
  tbt?: number;

  industry?: string;
  isLocalBusiness: boolean;
  hasSitemap: boolean;

  googleBusinessRating?: number;
  googleBusinessReviewCount?: number;
  socialProfilesFound: number;
  socialProfilesTotal: number;
}

export function extractFacts(params: {
  homepage?: CrawledPage;
  totalPages: number;
  crawlDurationMs: number;
  blockedPageCount: number;
  allPages: CrawledPage[];
  seo?: SEOAnalysis;
  performance?: PerformanceAnalysis;
  branding?: BrandingAnalysis;
  industry?: string;
  isLocalBusiness?: boolean;
  socialFound?: number;
  socialTotal?: number;
  googleRating?: number;
  googleReviews?: number;
}): ExtractedFacts {
  const h = params.homepage;
  const m = h?.metadata;

  const totalInternal = params.allPages.reduce((s, p) => s + (p.links?.internal?.length ?? 0), 0);
  const totalExternal = params.allPages.reduce((s, p) => s + (p.links?.external?.length ?? 0), 0);

  const avgLoad = params.allPages
    .filter((p) => p.loadTimeMs !== undefined)
    .reduce((s, p, _, arr) => s + (p.loadTimeMs ?? 0) / Math.max(1, arr.length), 0);

  const cwv = params.performance?.coreWebVitals;

  return {
    url: params.homepage?.url ?? '',
    hostname: params.homepage?.url ? new URL(params.homepage.url).hostname : '',
    totalPages: params.totalPages,
    crawlDurationMs: params.crawlDurationMs,

    hasTitle: !!m?.title,
    titleLength: m?.title?.length ?? 0,
    hasMetaDescription: !!m?.description,
    metaDescriptionLength: m?.description?.length ?? 0,
    hasMetaKeywords: !!m?.keywords,
    hasH1: (m?.h1Count ?? 0) > 0,
    h1Count: m?.h1Count ?? 0,
    h2Count: m?.h2Count ?? 0,
    hasCanonical: !!m?.canonical,
    hasOpenGraphTitle: !!m?.ogTags?.['og:title'],
    hasOpenGraphDescription: !!m?.ogTags?.['og:description'],
    hasOpenGraphImage: !!m?.ogTags?.['og:image'],
    hasStructuredData: (m?.structuredData?.length ?? 0) > 0,
    structuredDataCount: m?.structuredData?.length ?? 0,
    hasRobotsNoindex: m?.robotsTxt?.includes('noindex') ?? false,
    hasRobotsNofollow: m?.robotsTxt?.includes('nofollow') ?? false,
    internalLinksCount: totalInternal,
    externalLinksCount: totalExternal,
    averageLoadTimeMs: avgLoad,
    homepageImageCount: m?.imageCount ?? 0,
    totalImages: params.allPages.reduce((s, p) => s + (p.metadata?.imageCount ?? 0), 0),
    blockedPageCount: params.blockedPageCount,

    hasLogo: params.branding?.logoPresent ?? false,
    hasFavicon: params.branding?.hasFavicon ?? false,
    colorCount: params.branding?.colorsDetected?.length ?? 0,
    customFontCount: params.branding?.fontsDetected?.length ?? 0,

    lcp: toNum(cwv?.lcp),
    fcp: toNum(cwv?.fcp),
    cls: toNum(cwv?.cls),
    ttfb: toNum(cwv?.ttfb),
    tbt: toNum(cwv?.tbt),

    industry: params.industry,
    isLocalBusiness: params.isLocalBusiness ?? false,
    hasSitemap: params.seo?.sitemapScore ? params.seo.sitemapScore > 0 : false,

    googleBusinessRating: params.googleRating,
    googleBusinessReviewCount: params.googleReviews,
    socialProfilesFound: params.socialFound ?? 0,
    socialProfilesTotal: params.socialTotal ?? 0,
  };
}

function toNum(v: unknown): number | undefined {
  return typeof v === 'number' && !Number.isNaN(v) ? v : undefined;
}
