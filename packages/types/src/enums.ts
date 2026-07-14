export enum AuditStatus {
  PENDING = 'pending',
  CRAWLING = 'crawling',
  ANALYZING = 'analyzing',
  AI_PROCESSING = 'ai_processing',
  GENERATING_REPORT = 'generating_report',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum AuditStage {
  COMPANY_DISCOVERY = 'company_discovery',
  WEBSITE_CRAWL = 'website_crawl',
  SEO_ANALYSIS = 'seo_analysis',
  PERFORMANCE_ANALYSIS = 'performance_analysis',
  BRANDING_ANALYSIS = 'branding_analysis',
  AI_PROCESSING = 'ai_processing',
  SCORING = 'scoring',
  RECOMMENDATIONS = 'recommendations',
  REPORT_GENERATION = 'report_generation',
}

export enum ScoreCategory {
  BRANDING = 'branding',
  WEBSITE = 'website',
  SEO = 'seo',
  PERFORMANCE = 'performance',
  ACCESSIBILITY = 'accessibility',
  SECURITY = 'security',
  SOCIAL_MEDIA = 'social_media',
  CUSTOMER_TRUST = 'customer_trust',
  CONVERSION = 'conversion',
  CUSTOMER_EXPERIENCE = 'customer_experience',
}

export enum Priority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum RecommendationType {
  WEBSITE_IMPROVEMENT = 'website_improvement',
  BRANDING_IMPROVEMENT = 'branding_improvement',
  SEO_IMPROVEMENT = 'seo_improvement',
  MARKETING_OPPORTUNITY = 'marketing_opportunity',
  AUTOMATION_OPPORTUNITY = 'automation_opportunity',
  AI_OPPORTUNITY = 'ai_opportunity',
  MOBILE_APP_SUGGESTION = 'mobile_app_suggestion',
  CRM_SUGGESTION = 'crm_suggestion',
  BUSINESS_GROWTH = 'business_growth',
}

export enum AIModelTier {
  CHEAP = 'cheap',
  PREMIUM = 'premium',
}

export enum AIProvider {
  GEMINI = 'gemini',
  GROQ = 'groq',
  OPENAI = 'openai',
}

export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  PROPOSAL_SENT = 'proposal_sent',
  NEGOTIATING = 'negotiating',
  WON = 'won',
  LOST = 'lost',
}

export enum UserRole {
  ADMIN = 'admin',
  SALES = 'sales',
  CONSULTANT = 'consultant',
  DESIGNER = 'designer',
  PROJECT_MANAGER = 'project_manager',
  DEVELOPER = 'developer',
}

export enum ReportFormat {
  PDF = 'pdf',
  HTML = 'html',
  DASHBOARD = 'dashboard',
}
