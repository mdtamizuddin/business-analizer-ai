export const SCORE_CATEGORIES = [
  'branding',
  'website',
  'seo',
  'performance',
  'accessibility',
  'security',
  'social_media',
  'customer_trust',
  'conversion',
  'customer_experience',
] as const;

export const SCORE_WEIGHTS: Record<string, number> = {
  branding: 0.15,
  website: 0.15,
  seo: 0.15,
  performance: 0.10,
  accessibility: 0.10,
  security: 0.10,
  social_media: 0.05,
  customer_trust: 0.10,
  conversion: 0.05,
  customer_experience: 0.05,
};

export const SCORE_LABELS: Record<string, string> = {
  branding: 'Branding',
  website: 'Website',
  seo: 'SEO',
  performance: 'Performance',
  accessibility: 'Accessibility',
  security: 'Security',
  social_media: 'Social Media',
  customer_trust: 'Customer Trust',
  conversion: 'Conversion',
  customer_experience: 'Customer Experience',
};

export const SCORE_GRADES: { min: number; grade: string; color: string }[] = [
  { min: 90, grade: 'A', color: '#22c55e' },
  { min: 80, grade: 'B', color: '#84cc16' },
  { min: 70, grade: 'C', color: '#eab308' },
  { min: 60, grade: 'D', color: '#f97316' },
  { min: 0, grade: 'F', color: '#ef4444' },
];

export const PRIORITIES = ['critical', 'high', 'medium', 'low'] as const;

export const PRIORITY_LABELS: Record<string, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export const PRIORITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

export const PRIORITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export const RECOMMENDATION_TYPES = [
  'website_improvement',
  'branding_improvement',
  'seo_improvement',
  'marketing_opportunity',
  'automation_opportunity',
  'ai_opportunity',
  'mobile_app_suggestion',
  'crm_suggestion',
  'business_growth',
] as const;

export const RECOMMENDATION_TYPE_LABELS: Record<string, string> = {
  website_improvement: 'Website Improvement',
  branding_improvement: 'Branding Improvement',
  seo_improvement: 'SEO Improvement',
  marketing_opportunity: 'Marketing Opportunity',
  automation_opportunity: 'Automation Opportunity',
  ai_opportunity: 'AI Opportunity',
  mobile_app_suggestion: 'Mobile App Suggestion',
  crm_suggestion: 'CRM Suggestion',
  business_growth: 'Business Growth',
};

export const AGENCY_SERVICES = [
  'Website Development',
  'Website Redesign',
  'Branding & Identity Design',
  'Graphic Design',
  'SEO Optimization',
  'UI/UX Design',
  'AI Chatbots',
  'Business Automation',
  'Mobile App Development',
  'CRM Development',
  'Marketing Strategy',
] as const;

export const CRAWL_DEFAULTS = {
  MAX_PAGES: 10,
  TIMEOUT_MS: 30000,
  WAIT_UNTIL: 'domcontentloaded' as const,
  USER_AGENT: 'ABAP-Audit-Bot/1.0',
  CONCURRENCY: 1,
  RATE_LIMIT_MS: 100,
};

export const AUDIT_TIMEOUT_MS = 300000;

export const REDIS_KEYS = {
  AUDIT_QUEUE: 'audit:queue',
  AUDIT_STATUS: (auditId: string) => `audit:status:${auditId}`,
  AUDIT_CACHE: (url: string) => `audit:cache:${url}`,
  RATE_LIMIT: (key: string) => `rate:${key}`,
};

export const AI_COST_PER_1K_TOKENS: Record<string, { input: number; output: number }> = {
  'gemini-1.5-flash': { input: 0.000075, output: 0.0003 },
  'gemini-1.5-pro': { input: 0.00125, output: 0.005 },
  'llama-3.3-70b-versatile': { input: 0.00059, output: 0.00079 },
};

export const AI_MODEL_TIER_MAP = {
  cheap: ['gemini-1.5-flash', 'llama-3.3-70b-versatile'],
  premium: ['gemini-1.5-pro', 'llama-3.3-70b-versatile'],
} as const;
