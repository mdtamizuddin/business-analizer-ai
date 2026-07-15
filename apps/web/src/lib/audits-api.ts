import { api } from './api';

export interface AuditRecommendation {
  id: string;
  type: string;
  title: string;
  problem: string;
  evidence: string;
  businessImpact: string;
  priority: string;
  estimatedEffort: string;
  estimatedRoi: string;
  recommendedService?: string;
}

export interface AuditScores {
  overall: number;
  categories: Record<string, number>;
}

export interface SeoAnalysis {
  metaTagsScore: number;
  headingsScore: number;
  structuredDataScore: number;
  canonicalScore: number;
  sitemapScore: number;
  robotsScore: number;
  openGraphScore: number;
  imageSeoScore: number;
  internalLinksScore: number;
  externalLinksScore: number;
  performanceSeoScore: number;
  issues: string[];
}

export interface PerformanceAnalysis {
  lighthouseScore: number;
  performanceScore: number;
  accessibilityScore: number;
  bestPracticesScore: number;
  seoScore: number;
  coreWebVitals: {
    lcp?: number;
    fid?: number;
    cls?: number;
    fcp?: number;
    ttfb?: number;
    tbt?: number;
    si?: number;
  };
  issues: string[];
}

export interface BrandingAnalysis {
  colorsDetected: string[];
  fontsDetected: string[];
  logoPresent: boolean;
  hasFavicon: boolean;
  imageCount: number;
  totalImages: number;
  issues: string[];
}

export interface AccessibilityAnalysis {
  altTextScore: number;
  langScore: number;
  ariaScore: number;
  skipLinkScore: number;
  headingStructureScore: number;
  contrastScore: number;
  overallScore: number;
  issues: string[];
}

export interface SecurityAnalysis {
  sslScore: number;
  hstsScore: number;
  xssProtectionScore: number;
  contentTypeOptionsScore: number;
  frameOptionsScore: number;
  cspScore: number;
  overallScore: number;
  issues: string[];
}

export interface TechnologyDetection {
  cms?: string;
  cmsVersion?: string;
  frameworks: string[];
  analytics: string[];
  libraries: string[];
  cssFrameworks: string[];
  hosting?: string;
  cdn?: string;
  detected: string[];
}

export interface Audit {
  _id: string;
  companyId: string;
  status: string;
  currentStage?: string;
  startedAt: string;
  completedAt?: string;
  crawlData?: {
    totalPages: number;
    crawlDurationMs: number;
    blockedPages: string[];
    pages: Array<{
      url: string;
      title?: string;
      statusCode: number;
      loadTimeMs?: number;
      metadata: {
        title?: string;
        description?: string;
        h1Count?: number;
        h2Count?: number;
        imageCount?: number;
        wordCount?: number;
      };
      links: { internal: string[]; external: string[] };
    }>;
  };
  seoAnalysis?: SeoAnalysis;
  performanceAnalysis?: PerformanceAnalysis;
  brandingAnalysis?: BrandingAnalysis;
  accessibilityAnalysis?: AccessibilityAnalysis;
  securityAnalysis?: SecurityAnalysis;
  technologyDetection?: TechnologyDetection;
  companyDiscovery?: {
    domain?: string;
    ip?: string;
    hostname?: string;
    mxProviders?: string[];
    industry?: string;
    localBusiness: boolean;
    confidence: number;
    notes: string[];
  };
  brandVision?: { critique: string; captured: boolean };
  socialSnapshot?: {
    profiles: { platform: string; url: string; found: boolean; followerText?: string; postCount?: number; bioPresent: boolean; issues: string[] }[];
    consistencyScore: number;
    presenceScore: number;
    summary: string;
  };
  competitorSnapshot?: {
    competitor: { url: string; seo?: any; performance?: any; branding?: any; overallScore: number };
    gap: { strengths: string[]; weaknesses: string[]; opportunities: string[] };
  };
  scores?: AuditScores;
  recommendations: AuditRecommendation[];
  executiveSummary?: string;
  proposal?: {
    clientName: string;
    website: string;
    overallScore: number;
    headline: string;
    lineItems: { service: string; description: string; effort: string; price: number }[];
    subtotal: number;
    monthlyRetainer: number;
    estimatedRoi: string;
    generatedAt: string;
  };
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAuditInput {
  companyId: string;
  crawlDepth?: number;
  runSeoAudit?: boolean;
  runPerformanceAudit?: boolean;
  runBrandingAudit?: boolean;
  runAiProcessing?: boolean;
}

export const auditsApi = {
  list: () => api.get<Audit[]>('/audits'),
  get: (id: string) => api.get<Audit>(`/audits/${id}`),
  byCompany: (companyId: string) => api.get<Audit[]>(`/audits/company/${companyId}`),
  create: (data: CreateAuditInput) => api.post<Audit>('/audits', data),
};
