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
  scores?: AuditScores;
  recommendations: AuditRecommendation[];
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
