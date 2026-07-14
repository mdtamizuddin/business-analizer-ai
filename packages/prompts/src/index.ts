import { AIModelTier } from '@abap/types';

export interface PromptTemplate {
  name: string;
  version: string;
  tier: AIModelTier;
  system: string;
  user: string;
  outputSchema?: string;
}

export const SEO_ANALYSIS_PROMPT: PromptTemplate = {
  name: 'seo-analysis',
  version: '1.0.0',
  tier: AIModelTier.CHEAP,
  system: `You are an SEO expert analyst. You analyze website crawl data and produce structured SEO assessment scores and issues.`,
  user: `Analyze the following website crawl data and provide an SEO assessment.

Company: {{companyName}}
Website: {{websiteUrl}}
Crawl Data: {{crawlData}}

For each of these categories, assign a score from 0-100 and list any issues found:
- Meta tags
- Headings structure
- Structured data
- Canonical URLs
- Sitemap
- Robots.txt
- Open Graph
- Image SEO
- Internal links
- External links
- Performance SEO

Return ONLY valid JSON matching this structure:
{
  "metaTagsScore": number,
  "headingsScore": number,
  "structuredDataScore": number,
  "canonicalScore": number,
  "sitemapScore": number,
  "robotsScore": number,
  "openGraphScore": number,
  "imageSeoScore": number,
  "internalLinksScore": number,
  "externalLinksScore": number,
  "performanceSeoScore": number,
  "issues": string[],
  "details": Record<string, unknown>
}`,
};

export const PERFORMANCE_ANALYSIS_PROMPT: PromptTemplate = {
  name: 'performance-analysis',
  version: '1.0.0',
  tier: AIModelTier.CHEAP,
  system: `You are a web performance expert. You analyze Lighthouse and Core Web Vitals data to produce a structured performance assessment.`,
  user: `Analyze the following Lighthouse and performance data for {{companyName}} ({{websiteUrl}}).

Lighthouse Data: {{lighthouseData}}

Return ONLY valid JSON matching this structure:
{
  "lighthouseScore": number,
  "performanceScore": number,
  "accessibilityScore": number,
  "bestPracticesScore": number,
  "seoScore": number,
  "coreWebVitals": {
    "lcp": number,
    "fid": number,
    "cls": number,
    "fcp": number,
    "ttfb": number,
    "tbt": number,
    "si": number
  },
  "issues": string[],
  "details": Record<string, unknown>
}`,
};

export const BRANDING_ANALYSIS_PROMPT: PromptTemplate = {
  name: 'branding-analysis',
  version: '1.0.0',
  tier: AIModelTier.CHEAP,
  system: `You are a branding and design expert. You analyze website visual data to produce a structured branding assessment.`,
  user: `Analyze the following website branding data for {{companyName}} ({{websiteUrl}}).

Branding Data: {{brandingData}}
Screenshots: {{screenshotUrls}}

Return ONLY valid JSON matching this structure:
{
  "colorsDetected": string[],
  "fontsDetected": string[],
  "logoPresent": boolean,
  "hasFavicon": boolean,
  "imageCount": number,
  "totalImages": number,
  "issues": string[],
  "details": Record<string, unknown>
}`,
};

export const RECOMMENDATIONS_PROMPT: PromptTemplate = {
  name: 'recommendations',
  version: '1.0.0',
  tier: AIModelTier.PREMIUM,
  system: `You are a senior digital business consultant. You analyze audit results and produce actionable business recommendations with clear priorities, effort estimates, ROI projections, and recommended agency services.`,
  user: `Based on the following audit results for {{companyName}} ({{websiteUrl}}), generate strategic business recommendations.

SEO Analysis: {{seoAnalysis}}
Performance Analysis: {{performanceAnalysis}}
Branding Analysis: {{brandingAnalysis}}
Company Industry: {{industry}}

Generate recommendations covering:
- Website improvements
- Branding improvements
- SEO improvements
- Marketing opportunities
- Automation opportunities
- AI opportunities
- Mobile app suggestions (if applicable)
- CRM suggestions (if applicable)
- Business growth roadmap

Each recommendation must include:
- problem: Clear description of the issue
- evidence: Specific data point from the audit supporting this
- businessImpact: Expected business outcome
- priority: "critical" | "high" | "medium" | "low"
- estimatedEffort: "Low" | "Medium" | "High" | "Very High"
- estimatedRoi: Expected ROI description
- recommendedService: One of: Website Development, Website Redesign, Branding & Identity Design, Graphic Design, SEO Optimization, UI/UX Design, AI Chatbots, Business Automation, Mobile App Development, CRM Development, Marketing Strategy

Return ONLY a valid JSON array of recommendation objects.`,
};

export const EXECUTIVE_SUMMARY_PROMPT: PromptTemplate = {
  name: 'executive-summary',
  version: '1.0.0',
  tier: AIModelTier.PREMIUM,
  system: `You are an executive business consultant. You produce concise, impactful executive summaries from audit data.`,
  user: `Create an executive summary for the business audit of {{companyName}} ({{websiteUrl}}).

Overall Score: {{overallScore}}/100
Category Scores: {{categoryScores}}
Top Recommendations: {{topRecommendations}}

Write a 3-paragraph executive summary that:
1. Summarizes the company's current digital health
2. Identifies the most critical opportunities
3. Recommends immediate next steps

Return plain text, no JSON.`,
};

export const PROMPT_REGISTRY: Record<string, PromptTemplate> = {
  'seo-analysis': SEO_ANALYSIS_PROMPT,
  'performance-analysis': PERFORMANCE_ANALYSIS_PROMPT,
  'branding-analysis': BRANDING_ANALYSIS_PROMPT,
  recommendations: RECOMMENDATIONS_PROMPT,
  'executive-summary': EXECUTIVE_SUMMARY_PROMPT,
};

export function getPrompt(name: string): PromptTemplate {
  const template = PROMPT_REGISTRY[name];
  if (!template) {
    throw new Error(`Prompt template "${name}" not found in registry`);
  }
  return template;
}

export function renderPrompt(template: PromptTemplate, variables: Record<string, unknown>): string {
  let rendered = template.user;
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    rendered = rendered.replaceAll(placeholder, stringValue);
  }
  return rendered;
}
