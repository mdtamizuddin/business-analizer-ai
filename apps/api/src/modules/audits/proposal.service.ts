import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';

export interface ProposalLineItem {
  service: string;
  description: string;
  effort: string;
  price: number;
}

export interface ProposalResult {
  clientName: string;
  website: string;
  overallScore: number;
  headline: string;
  lineItems: ProposalLineItem[];
  subtotal: number;
  monthlyRetainer: number;
  estimatedRoi: string;
  generatedAt: string;
}

// Baseline price card per service type (USD). Real pricing would come from a catalogue.
const SERVICE_PRICING: Record<string, number> = {
  'SEO Optimization': 1200,
  'Performance Optimization': 1500,
  'Brand Redesign': 3500,
  'Website Rebuild': 6000,
  'Conversion Optimization': 1800,
  'Content Marketing': 900,
  'Social Media Management': 750,
  'Google Business Optimization': 500,
  'Automation Setup': 1400,
  'AI Integration': 2200,
  'CRM Setup': 1100,
  'Consulting': 800,
};

@Injectable()
export class ProposalService {
  constructor(private readonly aiService: AiService) {}

  async build(
    clientName: string,
    website: string,
    overallScore: number,
    recommendations: any[],
  ): Promise<ProposalResult> {
    const lineItems: ProposalLineItem[] = [];

    for (const rec of recommendations ?? []) {
      const service = rec.recommendedService ?? 'Consulting';
      const price = SERVICE_PRICING[service] ?? 800;
      if (!lineItems.find((l) => l.service === service)) {
        lineItems.push({
          service,
          description: rec.title ?? 'Improvement package',
          effort: rec.estimatedEffort ?? 'TBD',
          price,
        });
      }
    }

    const subtotal = lineItems.reduce((s, l) => s + l.price, 0);
    const monthlyRetainer = Math.round(subtotal * 0.12);

    let headline = `Your digital presence scores ${overallScore}/100. We've identified ${lineItems.length} high-impact packages to close the gap.`;
    let estimatedRoi = 'Projected 25–40% improvement in qualified leads within 90 days.';
    try {
      const prompt = `You are an agency sales strategist. Client "${clientName}" scored ${overallScore}/100. Services proposed: ${lineItems.map((l) => l.service).join(', ')}. Respond strict JSON: { "headline": string (1 sentence), "estimatedRoi": string (1 sentence, mention lead/revenue improvement) }. Only JSON.`;
      const { data } = await this.aiService.generateJson(
        'cheap',
        'You write concise agency sales copy. Respond only with valid JSON.',
        prompt,
        { maxTokens: 200, temperature: 0.5 },
      );
      const obj = data as any;
      if (obj?.headline) headline = obj.headline;
      if (obj?.estimatedRoi) estimatedRoi = obj.estimatedRoi;
    } catch {
      /* keep defaults */
    }

    return {
      clientName,
      website,
      overallScore,
      headline,
      lineItems,
      subtotal,
      monthlyRetainer,
      estimatedRoi,
      generatedAt: new Date().toISOString(),
    };
  }
}
