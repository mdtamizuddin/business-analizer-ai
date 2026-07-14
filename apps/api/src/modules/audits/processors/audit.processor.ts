import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Audit, AuditDocument } from '../schemas/audit.schema';
import { CrawlerService, CrawlResult } from '../../crawler/crawler.service';
import { SeoService, SEOAnalysisResult } from '../../seo/seo.service';
import { AiService } from '../../ai/ai.service';
import { CompaniesService } from '../../companies/companies.service';
import { buildScoreSet } from '@abap/audit-core';
import {
  RECOMMENDATIONS_PROMPT,
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
    private readonly aiService: AiService,
    private readonly companiesService: CompaniesService,
  ) {
    super();
  }

  async process(job: Job<AuditJobData>): Promise<void> {
    const { auditId, companyId, crawlDepth, runSeoAudit, runAiProcessing } = job.data;
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
    const recsPrompt = renderPrompt(RECOMMENDATIONS_PROMPT, {
      companyName,
      websiteUrl: website,
      industry: industry ?? 'Unknown',
      seoAnalysis: JSON.stringify(audit.seoAnalysis ?? {}),
      performanceAnalysis: JSON.stringify(audit.performanceAnalysis ?? {}),
      brandingAnalysis: JSON.stringify(audit.brandingAnalysis ?? {}),
    });

    try {
      const { data: recommendations, raw } = await this.aiService.generateJson(
        'premium',
        RECOMMENDATIONS_PROMPT.system,
        recsPrompt,
        { maxTokens: 4096, temperature: 0.7 },
      );

      let validatedRecs: any[] = [];
      if (Array.isArray(recommendations)) {
        validatedRecs = recommendations
          .map((r, idx) => {
            const result = recommendationSchema.safeParse({ ...r, id: `rec-${idx}` });
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
    if (audit.seoAnalysis) {
      const seo = audit.seoAnalysis as SEOAnalysisResult;
      const scores = buildScoreSet({
        seo: Math.round(
          (seo.metaTagsScore + seo.headingsScore + seo.structuredDataScore +
            seo.canonicalScore + seo.sitemapScore + seo.robotsScore +
            seo.openGraphScore + seo.imageSeoScore + seo.internalLinksScore +
            seo.externalLinksScore + seo.performanceSeoScore) / 11,
        ),
        website: 60, // Placeholder — will be from performance analysis
        performance: audit.performanceAnalysis
          ? (audit.performanceAnalysis as any).performanceScore ?? 60
          : 60,
      });

      const scoreResult = scoreSetSchema.safeParse(scores);
      if (scoreResult.success) {
        await this.updateAudit(auditId, { scores: scoreResult.data });
      }
    }
  }

  private async updateAudit(auditId: string, updates: Partial<Audit>): Promise<void> {
    await this.auditModel.findByIdAndUpdate(auditId, updates).exec();
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(`Job ${job.id} failed: ${err.message}`, err.stack);
  }
}
