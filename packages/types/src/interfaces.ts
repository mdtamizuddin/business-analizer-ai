import type { AuditStatus, AuditStage, ScoreCategory, Priority, RecommendationType, AIModelTier, AIProvider, LeadStatus, UserRole, ReportFormat } from './enums';

export interface Company {
  id: string;
  _id: string;
  name: string;
  website: string;
  domain?: string;
  industry?: string;
  description?: string;
  logoUrl?: string;
  competitorUrl?: string;
  isLocalBusiness?: boolean;
  socialAccounts?: SocialAccount[];
  technologyStack?: string[];
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialAccount {
  platform: string;
  url: string;
  username?: string;
}

export interface Audit {
  id: string;
  _id: string;
  companyId: string;
  organizationId: string;
  status: AuditStatus | string;
  currentStage?: AuditStage | string;
  auditOptions?: AuditOptions;
  startedAt: Date;
  completedAt?: Date;
  crawlData?: CrawlData;
  seoAnalysis?: SEOAnalysis;
  performanceAnalysis?: PerformanceAnalysis;
  brandingAnalysis?: BrandingAnalysis;
  accessibilityAnalysis?: AccessibilityAnalysis;
  securityAnalysis?: SecurityAnalysis;
  technologyDetection?: TechnologyDetection;
  companyDiscovery?: Record<string, unknown>;
  brandVision?: Record<string, unknown>;
  socialSnapshot?: Record<string, unknown>;
  competitorSnapshot?: Record<string, unknown>;
  scores?: ScoreSet;
  recommendations?: Recommendation[];
  executiveSummary?: string;
  proposal?: Record<string, unknown>;
  reportUrl?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditOptions {
  crawlDepth?: number;
  runSeoAudit?: boolean;
  runPerformanceAudit?: boolean;
  runBrandingAudit?: boolean;
  runAiProcessing?: boolean;
}

export interface CrawlData {
  pages: CrawledPage[];
  totalPages: number;
  crawlDurationMs: number;
  blockedPages: string[];
}

export interface CrawledPage {
  url: string;
  title?: string;
  description?: string;
  htmlContent?: string;
  textContent?: string;
  statusCode: number;
  loadTimeMs?: number;
  screenshots?: string[];
  links: { internal: string[]; external: string[] };
  metadata: PageMetadata;
}

export interface PageMetadata {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  ogTags?: Record<string, string>;
  twitterTags?: Record<string, string>;
  structuredData?: unknown[];
  robotsTxt?: string;
  robotsMeta?: string;
  sitemapUrl?: string;
  h1Count: number;
  h2Count: number;
  imageCount: number;
  wordCount: number;
}

export interface SEOAnalysis {
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
  details: Record<string, unknown>;
}

export interface PerformanceAnalysis {
  lighthouseScore: number;
  performanceScore: number;
  accessibilityScore: number;
  bestPracticesScore: number;
  seoScore: number;
  coreWebVitals: CoreWebVitals;
  issues: string[];
  details: Record<string, unknown>;
}

export interface CoreWebVitals {
  lcp?: number;
  fid?: number;
  cls?: number;
  fcp?: number;
  ttfb?: number;
  tbt?: number;
  si?: number;
}

export interface BrandingAnalysis {
  colorsDetected: string[];
  fontsDetected: string[];
  logoPresent: boolean;
  hasFavicon: boolean;
  brandScore: number;
  imageCount: number;
  totalImages: number;
  issues: string[];
  details: Record<string, unknown>;
}

export interface AccessibilityAnalysis {
  score: number;
  hasAltTextOnImages: boolean;
  hasLangAttribute: boolean;
  hasAriaLabels: boolean;
  hasSkipLink: boolean;
  headingStructureValid: boolean;
  contrastRatioIssues: number;
  issues: string[];
  details: Record<string, unknown>;
}

export interface SecurityAnalysis {
  score: number;
  hasSsl: boolean;
  hasHsts: boolean;
  hasXssProtection: boolean;
  hasContentTypeOptions: boolean;
  hasFrameOptions: boolean;
  hasCsp: boolean;
  issues: string[];
  details: Record<string, unknown>;
}

export interface TechnologyDetection {
  cms?: string;
  frameworks: string[];
  analytics: string[];
  hosting?: string;
  sslProvider?: string;
  javascriptLibraries: string[];
  cssFrameworks: string[];
  detected: boolean;
  details: Record<string, unknown>;
}

export interface ScoreSet {
  overall: number;
  categories: Record<ScoreCategory, number>;
}

export interface Recommendation {
  id: string;
  type: RecommendationType | string;
  title: string;
  problem: string;
  evidence: string;
  businessImpact: string;
  priority: Priority;
  estimatedEffort: string;
  estimatedRoi: string;
  recommendedService?: string;
}

export interface AIRequest {
  promptTemplate: string;
  variables: Record<string, unknown>;
  modelTier: AIModelTier;
  provider?: AIProvider;
  maxTokens?: number;
  temperature?: number;
}

export interface AIResponse {
  content: string;
  provider: AIProvider;
  model: string;
  tokensUsed: number;
  costEstimate: number;
  latencyMs: number;
}

export interface Lead {
  id: string;
  _id: string;
  companyId: string;
  organizationId: string;
  status: LeadStatus;
  auditIds: string[];
  notes?: string;
  followUpDate?: Date;
  proposalUrl?: string;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  plan: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Report {
  id: string;
  auditId: string;
  format: ReportFormat;
  url: string;
  executiveSummary?: string;
  overallScore?: number;
  generatedAt: Date;
}
