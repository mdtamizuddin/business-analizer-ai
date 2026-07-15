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
import { AccessibilityService } from '../../accessibility/accessibility.service';
import { SecurityService } from '../../security/security.service';
import { TechnologyService } from '../../technology/technology.service';
import { AiService } from '../../ai/ai.service';
import { CompaniesService } from '../../companies/companies.service';
import { LeadsService } from '../../leads/leads.service';
import { SocialService, SocialAnalysisResult } from '../../social/social.service';
import { CompetitorService, CompetitorAnalysisResult } from '../../competitor/competitor.service';
import { CompanyDiscoveryService } from '../company-discovery.service';
import { ProposalService } from '../proposal.service';
import { extractFacts, evaluate, buildScores } from '@abap/rules';
import { EXECUTIVE_SUMMARY_PROMPT, renderPrompt } from '@abap/prompts';
import { scoreSetSchema } from '@abap/schemas';
import { CRAWL_DEFAULTS } from '@abap/constants';
import type { AccessibilityAnalysis, SecurityAnalysis, TechnologyDetection } from '@abap/types';

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
    private readonly accessibilityService: AccessibilityService,
    private readonly securityService: SecurityService,
    private readonly technologyService: TechnologyService,
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
    const { auditId, companyId, crawlDepth } = job.data;
    this.logger.log(`Processing audit ${auditId} for company ${companyId}`);

    try {
      await this.updateAudit(auditId, { status: 'crawling', currentStage: 'company_input' });
      const company = await this.companiesService.findById(companyId);
      if (!company) {
        throw new Error(`Company ${companyId} not found`);
      }

      await this.updateAudit(auditId, { status: 'crawling', currentStage: 'company_discovery' });
      const discovery = await this.companyDiscoveryService.discover(
        company.domain ?? '',
        company.website,
        company.industry,
      );
      await this.updateAudit(auditId, { companyDiscovery: discovery });
      try {
        await this.companiesService.update(companyId, { industry: discovery.industry, isLocalBusiness: discovery.localBusiness });
      } catch {
        /* best-effort */
      }

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

      await this.updateAudit(auditId, { status: 'analyzing', currentStage: 'website_analysis' });
      const seoResult: SEOAnalysisResult = this.seoService.analyze(crawlResult);
      const perfResult: PerformanceAnalysisResult = this.performanceService.analyze(crawlResult);
      await this.updateAudit(auditId, { seoAnalysis: seoResult, performanceAnalysis: perfResult });

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

      const accessibilityResult: AccessibilityAnalysis = this.accessibilityService.analyze(crawlResult);
      await this.updateAudit(auditId, { accessibilityAnalysis: accessibilityResult });

      const securityResult: SecurityAnalysis = this.securityService.analyze(crawlResult);
      await this.updateAudit(auditId, { securityAnalysis: securityResult });

      const technologyResult: TechnologyDetection = this.technologyService.detect(crawlResult);
      await this.updateAudit(auditId, { technologyDetection: technologyResult });

      const socialAccounts = company.socialAccounts ?? [];
      let socialSnapshot: SocialAnalysisResult | undefined;
      if (socialAccounts.length > 0) {
        await this.updateAudit(auditId, { status: 'analyzing', currentStage: 'social_analysis' });
        try {
          socialSnapshot = await this.socialService.analyze(socialAccounts);
          await this.updateAudit(auditId, { socialSnapshot });
        } catch (e) {
          this.logger.warn(`Social analysis skipped: ${e instanceof Error ? e.message : e}`);
        }
      }

      let competitorSnapshot: CompetitorAnalysisResult | undefined;
      const competitorUrl = company.competitorUrl;
      if (competitorUrl) {
        await this.updateAudit(auditId, { status: 'analyzing', currentStage: 'competitor_research' });
        try {
          competitorSnapshot = await this.competitorService.analyze(competitorUrl);
          await this.updateAudit(auditId, { competitorSnapshot });
        } catch (e) {
          this.logger.warn(`Competitor research skipped: ${e instanceof Error ? e.message : e}`);
        }
      }

      // --- RULES ENGINE ---
      await this.updateAudit(auditId, { status: 'ai_processing', currentStage: 'ai_processing' });

      const facts = extractFacts({
        homepage: crawlResult.pages[0],
        totalPages: crawlResult.totalPages,
        crawlDurationMs: crawlResult.crawlDurationMs,
        blockedPageCount: crawlResult.blockedPages.length,
        allPages: crawlResult.pages,
        seo: seoResult,
        performance: perfResult,
        branding: brandResult,
        industry: discovery.industry ?? company.industry,
        isLocalBusiness: discovery.localBusiness,
        socialFound: socialSnapshot?.profiles.filter((p) => p.found).length,
        socialTotal: socialSnapshot?.profiles.length,
      });

      const evaluation = evaluate(facts);
      const scores = buildScores(evaluation.scores);

      const scoreResult = scoreSetSchema.safeParse(scores);
      if (scoreResult.success) {
        await this.updateAudit(auditId, { scores: scoreResult.data });
      }

      await this.updateAudit(auditId, { recommendations: evaluation.matchedRecommendations });

      this.logger.log(
        `Rules engine: ${evaluation.matchedRecommendations.length} recommendations, ${Object.keys(evaluation.scores).length} categories scored`,
      );

      // --- AI: Executive summary only ---
      try {
        const summaryPrompt = renderPrompt(EXECUTIVE_SUMMARY_PROMPT, {
          companyName: company.name,
          websiteUrl: company.website,
          overallScore: scores.overall,
          categoryScores: JSON.stringify(scores.categories),
          topRecommendations: JSON.stringify(evaluation.matchedRecommendations.slice(0, 5)),
        });
        const { content: summary } = await this.aiService.generate(
          EXECUTIVE_SUMMARY_PROMPT.system,
          summaryPrompt,
          { maxTokens: 1024, temperature: 0.5 },
        );
        await this.updateAudit(auditId, { executiveSummary: summary });
        this.logger.log(`Executive summary generated (${(summary as string).length} chars)`);
      } catch (err) {
        this.logger.warn(`Executive summary generation skipped: ${err instanceof Error ? err.message : err}`);
      }

      await this.updateAudit(auditId, { status: 'generating_report', currentStage: 'report_generation' });

      const auditForProposal = await this.auditModel.findById(auditId).exec();
      const overall = auditForProposal?.scores?.overall ?? 0;
      const recs = auditForProposal?.recommendations ?? [];
      const proposal = await this.proposalService.build(company.name, company.website, overall, recs);
      await this.updateAudit(auditId, { proposal, currentStage: 'sales_proposal' });

      await this.updateAudit(auditId, {
        status: 'completed',
        currentStage: undefined,
        completedAt: new Date(),
      });
      this.logger.log(`Audit ${auditId} completed successfully`);

      try {
        await this.leadsService.create(
          {
            name: company.name,
            email: undefined,
            source: 'audit',
            companyId: String(company._id),
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

  private async updateAudit(auditId: string, updates: Partial<Audit>): Promise<void> {
    await this.auditModel.findByIdAndUpdate(auditId, updates).exec();
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(`Job ${job.id} failed: ${err.message}`, err.stack);
  }
}
