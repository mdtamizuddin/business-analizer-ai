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
  ) {
    super();
  }

  async process(job: Job<AuditJobData>): Promise<void> {
    const { auditId, companyId, crawlDepth, runSeoAudit, runPerformanceAudit, runBrandingAudit, runAiProcessing } = job.data;
    this.logger.log(`Processing audit ${auditId} for company ${companyId}`);

    try {
      // Stage 1: Fetch company
      await this.updateAudit(auditId, { status: 'crawling', currentStage: 'company_discovery' });
      const company = await this.companiesService.findById(companyId);
      if (!company) {
        throw new Error(`Company ${companyId} not found`);
      }

      // Stage 2: Crawl website
      await this.updateAudit(auditId, { status: 'crawling', currentStage: 'website_crawl' });
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

      // Stage 3: SEO Analysis
      if (runSeoAudit !== false) {
        await this.updateAudit(auditId, { status: 'analyzing', currentStage: 'seo_analysis' });
        const seoResult: SEOAnalysisResult = this.seoService.analyze(crawlResult);
        await this.updateAudit(auditId, { seoAnalysis: seoResult });
        this.logger.log(`SEO analysis complete for audit ${auditId}: ${seoResult.issues.length} issues found`);
      }

      // Stage 3b: Performance Analysis
      if (runPerformanceAudit !== false) {
        await this.updateAudit(auditId, { status: 'analyzing', currentStage: 'performance_analysis' });
        const perfResult: PerformanceAnalysisResult = this.performanceService.analyze(crawlResult);
        await this.updateAudit(auditId, { performanceAnalysis: perfResult });
        this.logger.log(`Performance analysis complete for audit ${auditId}: perf=${perfResult.performanceScore}`);
      }

      // Stage 3c: Branding Analysis
      if (runBrandingAudit !== false) {
        await this.updateAudit(auditId, { status: 'analyzing', currentStage: 'branding_analysis' });
        const brandResult: BrandingAnalysisResult = this.brandingService.analyze(crawlResult);
        await this.updateAudit(auditId, { brandingAnalysis: brandResult });
        this.logger.log(`Branding analysis complete for audit ${auditId}: ${brandResult.colorsDetected.length} colors`);
      }

      // Stage 4: AI Processing
      if (runAiProcessing !== false) {
        await this.updateAudit(auditId, { status: 'ai_processing', currentStage: 'ai_processing' });
        await this.runAiProcessing(auditId, company.name, company.website, company.industry);
      }

      // Stage 5: Complete
      await this.updateAudit(auditId, {
        status: 'completed',
        currentStage: undefined,
        completedAt: new Date(),
      });
      this.logger.log(`Audit ${auditId} completed successfully`);
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
      const { data: rawRecs, raw } = await this.aiService.generateJson(
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
        `Generated ${validatedRecs.length} recommendations (${raw.tokensUsed} tokens, $${raw.costEstimate.toFixed(5)})`,
      );
    } catch (err) {
      this.logger.warn(`AI recommendation generation failed: ${err instanceof Error ? err.message : err}`);
      // Continue — recommendations are optional, audit can still complete
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
