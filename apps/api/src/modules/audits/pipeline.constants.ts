export interface PipelineStage {
  index: number;
  key: string;
  title: string;
  description: string;
}

// The blueprint's 12-stage Automated Discovery & Scoring Pipeline.
export const PIPELINE_STAGES: PipelineStage[] = [
  { index: 1, key: 'company_input', title: 'Company Input', description: 'SDR or Client enters Company Name & Domain URL.' },
  { index: 2, key: 'company_discovery', title: 'Company Discovery', description: 'Reverse DNS, IP lookup, industry cataloging, and local business verification.' },
  { index: 3, key: 'data_collection', title: 'Data Collection', description: 'Launch scrapers & call third-party search, reviews, and Google Maps APIs.' },
  { index: 4, key: 'website_analysis', title: 'Website Analysis', description: 'Execute Headless Lighthouse tests on Performance, Accessibility, and SSL.' },
  { index: 5, key: 'brand_analysis', title: 'Brand Analysis', description: 'Vision AI reviews homepage screenshots for grid alignment & visual layout.' },
  { index: 6, key: 'social_analysis', title: 'Social Analysis', description: 'Scan Instagram, Facebook, and LinkedIn for post frequencies & engagement ratios.' },
  { index: 7, key: 'competitor_research', title: 'Competitor Research', description: 'Identify localized keyword adversaries and compare Google Maps rankings.' },
  { index: 8, key: 'ai_processing', title: 'AI Processing', description: 'Inject collected indicators into structured reasoning engines & LLM brokers.' },
  { index: 9, key: 'business_scoring', title: 'Business Scoring', description: 'Calculate weighted categories to establish the overall Digital Health Score.' },
  { index: 10, key: 'recommendations', title: 'Recommendations', description: 'Formulate highly personalized, prioritized remedies mapped to agency services.' },
  { index: 11, key: 'report_generation', title: 'Report Generation', description: 'Compile rich browser dashboards, customizable white-label assets, and printable PDFs.' },
  { index: 12, key: 'sales_proposal', title: 'Sales Proposal', description: 'Assemble immediate ROI proposal with automatic service costs & pricing matrix.' },
];

export const PIPELINE_STAGE_KEYS = PIPELINE_STAGES.map((s) => s.key);
