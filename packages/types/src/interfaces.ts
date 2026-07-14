import type { AuditStatus, AuditStage, ScoreCategory, Priority, RecommendationType, AIModelTier, AIProvider, LeadStatus, UserRole, ReportFormat } from './enums';

export interface Company {
  id: string;
  name: string;
  website: string;
  industry?: string;
  description?: string;
  logoUrl?: string;
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
  companyId: string;
  organizationId: string;
  status: AuditStatus;
  currentStage?: AuditStage;
  startedAt: Date;
  completedAt?: Date;
  crawlData?: CrawlData;
  seoAnalysis?: SEOAnalysis;
  performanceAnalysis?: PerformanceAnalysis;
  brandingAnalysis?: BrandingAnalysis;
  scores?: ScoreSet;
  recommendations?: Recommendation[];
  reportUrl?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CrawlData {
  pages: CrawledPage[];
  totalPages: number;
  crawlDurationMs: number;
  blockedPages?: string[];
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
  links?: { internal: string[]; external: string[] };
  metadata?: PageMetadata;
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
  sitemapUrl?: string;
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
  imageCount: number;
  totalImages: number;
  issues: string[];
  details: Record<string, unknown>;
}

export interface ScoreSet {
  overall: number;
  categories: Record<ScoreCategory, number>;
}

export interface Recommendation {
  id: string;
  type: RecommendationType;
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
