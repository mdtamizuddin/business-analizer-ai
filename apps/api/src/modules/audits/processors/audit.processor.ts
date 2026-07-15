import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Audit, AuditDocument } from '../schemas/audit.schema';
import { CrawlerService, CrawlResult } from '../../crawler/crawler.service';
import { SeoService, SEOAnalysisResult } from '../../seo/seo.service';
import { PerformanceService, PerformanceAnalysisResult } from '../../performance/performance.service';
import { BrandingService, BrandingAnalysisResult } from '../../branding/branding.service';
import { AiService } from '../../ai/ai.service';
import { CompaniesService } from '../../companies/companies.service';
import { LeadsService } from '../../leads/leads.service';
import { SocialService } from '../../social/social.service';
import { CompetitorService } from '../../competitor/competitor.service';
import { CompanyDiscoveryService } from '../company-discovery.service';
import { ProposalService } from '../proposal.service';
import { buildScoreSet } from '@abap/audit-core';
import {
  RECOMMENDATIONS_PROMPT,
  EXECUTIVE_SUMMARY_PROMPT,
  renderPrompt,
} from '@abap/prompts';
import { recommendationSchema, scoreSetSchema } from '@abap/schemas';
import { CRAWL_DEFAULTS } from '@abap/constants';

interface AuditJobData {
  auditId: string;
  companyId: string;
  crawlDepth?: number;
  runSeoAudit?: boolean;
  runPerformanceAudit?: boolean;
  runBrandingAudit?: boolean;
  runAiProcessing?: boolean;
}

@Processor('audit-queue')
export class AuditProcessor extends WorkerHost {
  private readonly logger = new Logger(AuditProcessor.name);

  constructor(
    @InjectModel(Audit.name) private readonly auditModel: Model<AuditDocument>,
    private readonly crawlerService: CrawlerService,
    private readonly seoService: SeoService,
    private readonly performanceService: PerformanceService,
    private readonly brandingService: BrandingService,
    private readonly aiService: AiService,
    private readonly companiesService: CompaniesService,
    private readonly leadsService: LeadsService,
    private readonly socialService: SocialService,
    private readonly competitorService: CompetitorService,
    private readonly companyDiscoveryService: CompanyDiscoveryService,
    private readonly proposalService: ProposalService,
  ) {
    super();
  }

  async process(job: Job<AuditJobData>): Promise<void> {
    const { auditId, companyId, crawlDepth, runSeoAudit, runBrandingAudit, runAiProcessing } = job.data;
    this.logger.log(`Processing audit ${auditId} for company ${companyId}`);

    try {
      // Stage 1: Company Input (already created) — fetch company
      await this.updateAudit(auditId, { status: 'crawling', currentStage: 'company_input' });
      const company = await this.companiesService.findById(companyId);
      if (!company) {
        throw new Error(`Company ${companyId} not found`);
      }

      // Stage 2: Company Discovery (reverse DNS, IP, industry, local verification)
      await this.updateAudit(auditId, { status: 'crawling', currentStage: 'company_discovery' });
      const discovery = await this.companyDiscoveryService.discover(
        (company as any).domain,
        company.website,
        company.industry,
      );
      await this.updateAudit(auditId, { companyDiscovery: discovery });
      // Persist enriched industry back to the company
      try {
        await this.companiesService.update(companyId, { industry: discovery.industry, isLocalBusiness: discovery.localBusiness });
      } catch { /* best-effort */ }

      // Stage 3: Data Collection (crawl)
      await this.updateAudit(auditId, { status: 'crawling', currentStage: 'data_collection' });
      const maxPages = crawlDepth ?? CRAWL_DEFAULTS.MAX_PAGES;
      const crawlResult: CrawlResult = await this.crawlerService.crawl(company.website, maxPages);
      await this.updateAudit(auditId, {
        crawlData: {
          pages: crawlResult.pages.map((p) => ({
            url: p.url,
            title: p.title,
            description: p.description,
            statusCode: p.statusCode,
            loadTimeMs: p.loadTimeMs,
            wordCount: p.metadata.wordCount,
            h1Count: p.metadata.h1Count,
            h2Count: p.metadata.h2Count,
            imageCount: p.metadata.imageCount,
            links: p.links,
            metadata: p.metadata,
          })),
          totalPages: crawlResult.totalPages,
          crawlDurationMs: crawlResult.crawlDurationMs,
          blockedPages: crawlResult.blockedPages,
        },
      });

      // Stage 4: Website Analysis (SEO + Performance + Accessibility/SSL)
      if (runSeoAudit !== false) {
        await this.updateAudit(auditId, { status: 'analyzing', currentStage: 'website_analysis' });
        const seoResult: SEOAnalysisResult = this.seoService.analyze(crawlResult);
        const perfResult: PerformanceAnalysisResult = this.performanceService.analyze(crawlResult);
        await this.updateAudit(auditId, { seoAnalysis: seoResult, performanceAnalysis: perfResult });
      }

      // Stage 5: Brand Analysis (text signals + Vision AI screenshot critique)
      if (runBrandingAudit !== false) {
        await this.updateAudit(auditId, { status: 'analyzing', currentStage: 'brand_analysis' });
        const brandResult: BrandingAnalysisResult = this.brandingService.analyze(crawlResult);
        let visionCritique = '';
        try {
          const shot = await this.crawlerService.takeScreenshot(company.website);
          visionCritique = await this.aiService.generateWithImage(
            'You are a senior brand & UX designer. Critique this homepage screenshot for visual layout, grid alignment, color harmony, whitespace, and trust signals. Be concise (max 120 words).',
            shot.base64,
            'Critique this homepage for brand and visual quality.',
            { maxTokens: 300, temperature: 0.5 },
          ).then((r) => r.content);
        } catch (visionErr) {
          this.logger.warn(`Brand vision skipped: ${visionErr instanceof Error ? visionErr.message : visionErr}`);
        }
        await this.updateAudit(auditId, {
          brandingAnalysis: brandResult,
          brandVision: { critique: visionCritique, captured: !!visionCritique },
        });
      }

      // Stage 6: Social Analysis (if the company has linked social accounts)
      const socialAccounts = (company as any)?.socialAccounts ?? [];
      if (socialAccounts.length > 0) {
        await this.updateAudit(auditId, { status: 'analyzing', currentStage: 'social_analysis' });
        try {
          const social = await this.socialService.analyze(socialAccounts);
          await this.updateAudit(auditId, { socialSnapshot: social });
        } catch (e) {
          this.logger.warn(`Social analysis skipped: ${e instanceof Error ? e.message : e}`);
        }
      }

      // Stage 7: Competitor Research (if the company has a competitor URL)
      const competitorUrl = (company as any)?.competitorUrl;
      if (competitorUrl) {
        await this.updateAudit(auditId, { status: 'analyzing', currentStage: 'competitor_research' });
        try {
          const comp = await this.competitorService.analyze(competitorUrl);
          await this.updateAudit(auditId, { competitorSnapshot: comp });
        } catch (e) {
          this.logger.warn(`Competitor research skipped: ${e instanceof Error ? e.message : e}`);
        }
      }

      // Stage 8: AI Processing (recommendations)
      if (runAiProcessing !== false) {
        await this.updateAudit(auditId, { status: 'ai_processing', currentStage: 'ai_processing' });
        await this.runAiProcessing(auditId, company.name, company.website, company.industry);
      }

      // Stage 9 + 10: Business Scoring + Recommendations already produced in runAiProcessing.
      // Stage 11: Report Generation is on-demand (PDF/HTML endpoint); mark pipeline progress.
      await this.updateAudit(auditId, { status: 'generating_report', currentStage: 'report_generation' });

      // Stage 12: Sales Proposal (ROI + pricing matrix)
      const auditForProposal = await this.auditModel.findById(auditId).exec();
      const overall = auditForProposal?.scores?.overall ?? 0;
      const recs = auditForProposal?.recommendations ?? [];
      const proposal = await this.proposalService.build(company.name, company.website, overall, recs);
      await this.updateAudit(auditId, { proposal, currentStage: 'sales_proposal' });

      // Complete
      await this.updateAudit(auditId, {
        status: 'completed',
        currentStage: undefined,
        completedAt: new Date(),
      });
      this.logger.log(`Audit ${auditId} completed successfully`);

      // Audit → Lead conversion: auto-create a tracked lead for the company
      try {
        await this.leadsService.create(
          {
            name: company.name,
            email: undefined,
            source: 'audit',
            companyId: company._id?.toString?.() ?? companyId,
            auditId,
            estimatedValue: company.industry ? 2500 : undefined,
          },
          company.organizationId ?? 'default-org',
        );
        this.logger.log(`Auto-created lead for company ${company.name}`);
      } catch (leadErr) {
        this.logger.warn(`Lead auto-creation skipped: ${leadErr instanceof Error ? leadErr.message : leadErr}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Audit ${auditId} failed: ${errorMsg}`);
      await this.updateAudit(auditId, {
        status: 'failed',
        error: errorMsg,
        completedAt: new Date(),
      });
    }
  }

  private async runAiProcessing(
    auditId: string,
    companyName: string,
    website: string,
    industry: string | undefined,
  ): Promise<void> {
    const audit = await this.auditModel.findById(auditId).exec();
    if (!audit) throw new Error(`Audit ${auditId} not found`);

    // Generate recommendations
    let validatedRecs: any[] = [];
    const recsPrompt = renderPrompt(RECOMMENDATIONS_PROMPT, {
      companyName,
      websiteUrl: website,
      industry: industry ?? 'Unknown',
      seoAnalysis: JSON.stringify(audit.seoAnalysis ?? {}),
      performanceAnalysis: JSON.stringify(audit.performanceAnalysis ?? {}),
      brandingAnalysis: JSON.stringify(audit.brandingAnalysis ?? {}),
    });

    try {
      const { data: rawRecs } = await this.aiService.generateJson(
        'premium',
        RECOMMENDATIONS_PROMPT.system,
        recsPrompt,
        { maxTokens: 4096, temperature: 0.7 },
      );

      // The model may return a bare array or an object wrapping one
      // (e.g. { "recommendations": [...] }). Normalize to an array.
      let recommendations: any[] = [];
      if (Array.isArray(rawRecs)) {
        recommendations = rawRecs;
      } else if (rawRecs && typeof rawRecs === 'object') {
        const obj = rawRecs as Record<string, unknown>;
        const candidate = obj.recommendations ?? obj.results ?? obj.data ?? obj.items;
        if (Array.isArray(candidate)) recommendations = candidate;
      }

      if (recommendations.length > 0) {
        validatedRecs = recommendations
          .map((r, idx) => {
            const normalized = this.normalizeRecommendation(r, idx);
            const result = recommendationSchema.safeParse(normalized);
            if (!result.success) {
              this.logger.warn(`Dropped recommendation ${idx}: ${result.error.message}`);
            }
            return result.success ? result.data : null;
          })
          .filter(Boolean);
      }

      await this.updateAudit(auditId, { recommendations: validatedRecs });
      this.logger.log(
        `Generated ${validatedRecs.length} recommendations`,
      );
    } catch (err) {
      this.logger.warn(`AI recommendation generation failed: ${err instanceof Error ? err.message : err}`);
      // Continue — recommendations are optional, audit can still complete
    }

    // Fallback: if the AI produced no recommendations (provider unavailable
    // or returned empty), derive actionable ones from the issues we detected.
    if (validatedRecs.length === 0) {
      this.logger.warn('No AI recommendations; building deterministic fallback from detected issues.');
      validatedRecs = this.buildFallbackRecommendations(audit);
      await this.updateAudit(auditId, { recommendations: validatedRecs });
    }

    // Generate scores from available data
    let seoScore = 60;
    if (audit.seoAnalysis) {
      const seo = audit.seoAnalysis as SEOAnalysisResult;
      seoScore = Math.round(
        (seo.metaTagsScore + seo.headingsScore + seo.structuredDataScore +
          seo.canonicalScore + seo.sitemapScore + seo.robotsScore +
          seo.openGraphScore + seo.imageSeoScore + seo.internalLinksScore +
          seo.externalLinksScore + seo.performanceSeoScore) / 11,
      );
    }

    const perfScore = audit.performanceAnalysis
      ? (audit.performanceAnalysis as any).performanceScore ?? 60
      : 60;

    const brandScore = audit.brandingAnalysis
      ? this.computeBrandScore(audit.brandingAnalysis as BrandingAnalysisResult)
      : 60;

    const scores = buildScoreSet({
      seo: seoScore,
      website: perfScore, // website health largely tracks measured performance
      performance: perfScore,
      branding: brandScore,
    });

    const scoreResult = scoreSetSchema.safeParse(scores);
    if (scoreResult.success) {
      await this.updateAudit(auditId, { scores: scoreResult.data });

      // Generate executive summary from the final scores + recommendations.
      try {
        const summaryPrompt = renderPrompt(EXECUTIVE_SUMMARY_PROMPT, {
          companyName,
          websiteUrl: website,
          overallScore: scoreResult.data.overall,
          categoryScores: JSON.stringify(scoreResult.data.categories),
          topRecommendations: JSON.stringify(validatedRecs.slice(0, 5)),
        });
        const { content: summary } = await this.aiService.generate(
          EXECUTIVE_SUMMARY_PROMPT.system,
          summaryPrompt,
          { maxTokens: 1024, temperature: 0.5 },
        );
        await this.updateAudit(auditId, { executiveSummary: summary });
        this.logger.log(`Generated executive summary (${summary.length} chars)`);
      } catch (err) {
        this.logger.warn(`Executive summary generation failed: ${err instanceof Error ? err.message : err}`);
      }
    }
  }

  /**
   * Deterministic recommendation generation from already-detected SEO,
   * performance, and branding issues. Used when the AI provider is
   * unavailable so the pipeline still yields an actionable deliverable.
   */
  private buildFallbackRecommendations(audit: any): any[] {
    const recs: any[] = [];
    const seo = audit.seoAnalysis;
    const perf = audit.performanceAnalysis;
    const brand = audit.brandingAnalysis;

    const push = (title: string, type: string, problem: string, service: string, priority = 'medium') => {
      recs.push({
        id: `fallback-${recs.length}`,
        type,
        title,
        problem,
        evidence: 'Detected automatically during audit.',
        businessImpact: 'Improves digital health score and conversion potential.',
        priority,
        estimatedEffort: 'Medium',
        estimatedRoi: 'Positive impact expected.',
        recommendedService: service,
      });
    };

    if (seo?.issues?.length) {
      seo.issues.slice(0, 5).forEach((issue: string, i: number) =>
        push(`Fix: ${issue.slice(0, 60)}`, 'seo_improvement', issue, 'SEO Optimization', i === 0 ? 'high' : 'medium'),
      );
    }
    if (perf?.issues?.length) {
      perf.issues.slice(0, 3).forEach((issue: string) =>
        push(`Performance: ${issue.slice(0, 60)}`, 'website_improvement', issue, 'Performance Optimization'),
      );
    }
    if (brand && (!brand.logoPresent || !brand.hasFavicon || brand.colorsDetected?.length < 2)) {
      push('Strengthen brand identity (logo, favicon, color system)', 'branding_improvement', 'Weak brand signals detected.', 'Brand Redesign', 'high');
    }
    if (recs.length === 0) {
      push('Establish a baseline optimization & content plan', 'business_growth', 'No critical issues found; focus on growth.', 'Content Marketing');
    }
    return recs;
  }

  /**
   * Tolerantly normalize an LLM-produced recommendation into the strict schema
   * shape. LLMs often return capitalized priorities ("High"), free-form types,
   * or omit optional fields — we coerce those instead of dropping the item.
   */
  private normalizeRecommendation(raw: any, idx: number): any {
    const priorityMap: Record<string, string> = {
      critical: 'critical', high: 'high', medium: 'medium', low: 'low',
      urgent: 'critical', important: 'high', moderate: 'medium',
    };
    const priorityRaw = String(raw?.priority ?? 'medium').toLowerCase().trim();
    const priority = priorityMap[priorityRaw] ?? 'medium';

    const VALID_TYPES = [
      'website_improvement', 'branding_improvement', 'seo_improvement',
      'marketing_opportunity', 'automation_opportunity', 'ai_opportunity',
      'mobile_app_suggestion', 'crm_suggestion', 'business_growth',
    ];
    const typeRaw = String(raw?.type ?? 'business_growth').toLowerCase().replace(/\s+/g, '_');
    const type = VALID_TYPES.includes(typeRaw) ? typeRaw : 'business_growth';

    return {
      id: raw?.id ?? `rec-${idx}`,
      type,
      title: String(raw?.title ?? raw?.headline ?? `Recommendation ${idx + 1}`),
      problem: String(raw?.problem ?? raw?.issue ?? 'No problem description provided.'),
      evidence: String(raw?.evidence ?? raw?.dataPoint ?? raw?.supportingData ?? 'Based on audit results.'),
      businessImpact: String(raw?.businessImpact ?? raw?.impact ?? 'Improved digital performance and conversion.'),
      priority,
      estimatedEffort: String(raw?.estimatedEffort ?? raw?.effort ?? 'Medium'),
      estimatedRoi: String(raw?.estimatedRoi ?? raw?.roi ?? 'Positive ROI expected.'),
      recommendedService: raw?.recommendedService
        ? String(raw.recommendedService)
        : undefined,
    };
  }

  /**
   * Simple branding health score from detected signals:
   * logo, favicon, palette richness, custom fonts, image usage.
   */
  private computeBrandScore(b: BrandingAnalysisResult): number {
    let score = 40;
    if (b.logoPresent) score += 20;
    if (b.hasFavicon) score += 10;
    if (b.colorsDetected.length >= 2) score += 10;
    if (b.fontsDetected.length > 0) score += 10;
    if (b.imageCount > 0) score += 10;
    return Math.min(100, score);
  }

  private async updateAudit(auditId: string, updates: Partial<Audit>): Promise<void> {
    await this.auditModel.findByIdAndUpdate(auditId, updates).exec();
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(`Job ${job.id} failed: ${err.message}`, err.stack);
  }
}
