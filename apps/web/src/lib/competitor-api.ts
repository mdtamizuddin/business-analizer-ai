import { api } from './api';

export interface CompetitorResult {
  competitor: {
    url: string;
    seo: any;
    performance: any;
    branding: any;
    overallScore: number;
  };
  gap: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
  };
}

export const competitorApi = {
  analyze: (competitorUrl: string, auditId?: string) =>
    api.post<CompetitorResult>('/competitor/analyze', { competitorUrl, auditId }),
};
