import type { Priority } from '@abap/types';

export const SEVERITY = {
  CRITICAL: 'critical' as Priority,
  HIGH: 'high' as Priority,
  MEDIUM: 'medium' as Priority,
  LOW: 'low' as Priority,
};

export type Severity = Priority;

export const BUSINESS_IMPACT = {
  SEO: 'Search engine ranking and organic traffic',
  PERFORMANCE: 'User experience and site speed',
  BRAND: 'Brand recognition and identity',
  SOCIAL: 'Social media presence and engagement',
  TRUST: 'Customer trust and credibility',
  GROWTH: 'Business growth and conversion',
  SECURITY: 'Security and compliance',
  ACCESSIBILITY: 'Accessibility and inclusivity',
} as const;

export type BusinessImpact = typeof BUSINESS_IMPACT[keyof typeof BUSINESS_IMPACT];

export const AGENCY_SERVICES = [
  'Website Development',
  'Website Redesign',
  'Branding & Identity Design',
  'Graphic Design',
  'SEO Optimization',
  'Website Optimization',
  'UI/UX Design',
  'AI Chatbots',
  'Business Automation',
  'Mobile App Development',
  'CRM Development',
  'Marketing Strategy',
  'Google Business Optimization',
  'Content Marketing',
  'Social Media Management',
] as const;

export type ServiceType = typeof AGENCY_SERVICES[number];

export interface RuleEvaluation {
  scores: Record<string, number>;
  issues: Record<string, string[]>;
  matchedRecommendations: MatchedRecommendation[];
}

export interface MatchedRecommendation {
  id: string;
  type: string;
  title: string;
  problem: string;
  evidence: string;
  businessImpact: string;
  priority: Severity;
  estimatedEffort: string;
  estimatedRoi: string;
  recommendedService: ServiceType;
}
