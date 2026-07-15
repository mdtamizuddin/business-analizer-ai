import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import * as dns from 'dns/promises';

export interface CompanyDiscoveryResult {
  domain: string;
  ip?: string;
  hostname?: string;
  mxProviders: string[];
  industry?: string;
  localBusiness: boolean;
  confidence: number;
  notes: string[];
}

@Injectable()
export class CompanyDiscoveryService {
  constructor(private readonly aiService: AiService) {}

  async discover(domain: string, website: string, suggestedIndustry?: string): Promise<CompanyDiscoveryResult> {
    const notes: string[] = [];
    let ip: string | undefined;
    let hostname: string | undefined;
    let mxProviders: string[] = [];

    const cleanDomain = domain || this.domainFromUrl(website);
    try {
      const addr = await dns.lookup(cleanDomain);
      ip = addr.address;
      try {
        const ptr = await dns.reverse(addr.address);
        hostname = ptr[0];
      } catch {
        /* PTR may not exist */
      }
    } catch {
      notes.push('Could not resolve domain IP.');
    }

    try {
      const mx = await dns.resolveMx(cleanDomain);
      mxProviders = mx.map((m) => m.exchange.split('.').slice(-2).join('.')).slice(0, 3);
    } catch {
      /* no MX records */
    }

    let industry = suggestedIndustry;
    let localBusiness = false;
    let confidence = 0.5;

    try {
      const prompt = `Given this company domain "${cleanDomain}"${suggestedIndustry ? ` and stated industry "${suggestedIndustry}"` : ''}, respond with strict JSON: { "industry": string (best-fit business category), "localBusiness": boolean (true if it serves a local geographic area like a clinic, restaurant, gym, salon), "confidence": number 0-1 }. Only output the JSON.`;
      const { data } = await this.aiService.generateJson(
        'cheap',
        'You classify businesses from their domain. Respond only with valid JSON.',
        prompt,
        { maxTokens: 200, temperature: 0.3 },
      );
      const obj = data as any;
      if (obj && typeof obj === 'object') {
        industry = obj.industry ?? industry;
        localBusiness = obj.localBusiness ?? false;
        confidence = typeof obj.confidence === 'number' ? obj.confidence : confidence;
      }
    } catch {
      notes.push('Industry classification unavailable (AI).');
    }

    if (ip) notes.push(`Resolved ${cleanDomain} → ${ip}`);
    if (hostname) notes.push(`Reverse DNS: ${hostname}`);
    if (mxProviders.length) notes.push(`Mail providers: ${mxProviders.join(', ')}`);

    return {
      domain: cleanDomain,
      ip,
      hostname,
      mxProviders,
      industry,
      localBusiness,
      confidence,
      notes,
    };
  }

  private domainFromUrl(url: string): string {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  }
}
