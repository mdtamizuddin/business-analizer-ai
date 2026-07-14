import { z } from 'zod';

export const createCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required').max(200),
  website: z.string().url('Valid website URL is required'),
  industry: z.string().optional(),
  description: z.string().max(2000).optional(),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;

export const createAuditSchema = z.object({
  companyId: z.string().min(1, 'Company ID is required'),
  crawlDepth: z.number().int().min(1).max(20).default(5),
  options: z
    .object({
      runSeoAudit: z.boolean().default(true),
      runPerformanceAudit: z.boolean().default(true),
      runBrandingAudit: z.boolean().default(true),
      runAiProcessing: z.boolean().default(true),
    })
    .default({}),
});

export type CreateAuditInput = z.infer<typeof createAuditSchema>;

export const recommendationSchema = z.object({
  id: z.string(),
  type: z.enum([
    'website_improvement',
    'branding_improvement',
    'seo_improvement',
    'marketing_opportunity',
    'automation_opportunity',
    'ai_opportunity',
    'mobile_app_suggestion',
    'crm_suggestion',
    'business_growth',
  ]),
  title: z.string(),
  problem: z.string(),
  evidence: z.string(),
  businessImpact: z.string(),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  estimatedEffort: z.string(),
  estimatedRoi: z.string(),
  recommendedService: z.string().optional(),
});

export type RecommendationOutput = z.infer<typeof recommendationSchema>;

export const scoreSetSchema = z.object({
  overall: z.number().min(0).max(100),
  categories: z.record(z.string(), z.number().min(0).max(100)),
});

export type ScoreSetOutput = z.infer<typeof scoreSetSchema>;

export const seoAnalysisSchema = z.object({
  metaTagsScore: z.number().min(0).max(100),
  headingsScore: z.number().min(0).max(100),
  structuredDataScore: z.number().min(0).max(100),
  canonicalScore: z.number().min(0).max(100),
  sitemapScore: z.number().min(0).max(100),
  robotsScore: z.number().min(0).max(100),
  openGraphScore: z.number().min(0).max(100),
  imageSeoScore: z.number().min(0).max(100),
  internalLinksScore: z.number().min(0).max(100),
  externalLinksScore: z.number().min(0).max(100),
  performanceSeoScore: z.number().min(0).max(100),
  issues: z.array(z.string()),
  details: z.record(z.string(), z.unknown()).default({}),
});

export type SEOAnalysisOutput = z.infer<typeof seoAnalysisSchema>;

export const performanceAnalysisSchema = z.object({
  lighthouseScore: z.number().min(0).max(100),
  performanceScore: z.number().min(0).max(100),
  accessibilityScore: z.number().min(0).max(100),
  bestPracticesScore: z.number().min(0).max(100),
  seoScore: z.number().min(0).max(100),
  coreWebVitals: z.object({
    lcp: z.number().optional(),
    fid: z.number().optional(),
    cls: z.number().optional(),
    fcp: z.number().optional(),
    ttfb: z.number().optional(),
    tbt: z.number().optional(),
    si: z.number().optional(),
  }),
  issues: z.array(z.string()),
  details: z.record(z.string(), z.unknown()).default({}),
});

export type PerformanceAnalysisOutput = z.infer<typeof performanceAnalysisSchema>;

export const brandingAnalysisSchema = z.object({
  colorsDetected: z.array(z.string()),
  fontsDetected: z.array(z.string()),
  logoPresent: z.boolean(),
  hasFavicon: z.boolean(),
  imageCount: z.number(),
  totalImages: z.number(),
  issues: z.array(z.string()),
  details: z.record(z.string(), z.unknown()).default({}),
});

export type BrandingAnalysisOutput = z.infer<typeof brandingAnalysisSchema>;

export const aiResponseSchema = z.object({
  content: z.string(),
  provider: z.enum(['gemini', 'groq', 'openai']),
  model: z.string(),
  tokensUsed: z.number(),
  costEstimate: z.number(),
  latencyMs: z.number(),
});

export type AIResponseOutput = z.infer<typeof aiResponseSchema>;
