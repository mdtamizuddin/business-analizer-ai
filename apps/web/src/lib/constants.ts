export const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  crawling: 'Crawling',
  analyzing: 'Analyzing',
  ai_processing: 'AI Processing',
  generating_report: 'Generating Report',
  completed: 'Completed',
  failed: 'Failed',
};

export const STATUS_COLORS: Record<string, string> = {
  pending: '#94a3b8',
  crawling: '#3b82f6',
  analyzing: '#6366f1',
  ai_processing: '#8b5cf6',
  generating_report: '#f59e0b',
  completed: '#22c55e',
  failed: '#ef4444',
};

export const STAGE_LABELS: Record<string, string> = {
  company_input: 'Company Input',
  company_discovery: 'Company Discovery',
  data_collection: 'Data Collection',
  website_analysis: 'Website Analysis',
  website_crawl: 'Website Crawl',
  seo_analysis: 'SEO Analysis',
  performance_analysis: 'Performance Analysis',
  branding_analysis: 'Branding Analysis',
  brand_analysis: 'Brand Analysis',
  social_analysis: 'Social Analysis',
  competitor_research: 'Competitor Research',
  ai_processing: 'AI Processing',
  business_scoring: 'Business Scoring',
  recommendations: 'Recommendations',
  report_generation: 'Report Generation',
  sales_proposal: 'Sales Proposal',
};

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

export const SCORE_CATEGORY_LABELS: Record<string, string> = {
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

export function getScoreGrade(score: number): { grade: string; color: string } {
  if (score >= 90) return { grade: 'A', color: '#22c55e' };
  if (score >= 80) return { grade: 'B', color: '#84cc16' };
  if (score >= 70) return { grade: 'C', color: '#eab308' };
  if (score >= 60) return { grade: 'D', color: '#f97316' };
  return { grade: 'F', color: '#ef4444' };
}
