import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { Audit, AuditSchema } from './schemas/audit.schema';
import { AuditsService } from './audits.service';
import { AuditsController } from './audits.controller';
import { AuditProcessor } from './processors/audit.processor';
import { ReportService } from './report.service';
import { CompanyDiscoveryService } from './company-discovery.service';
import { ProposalService } from './proposal.service';
import { CompaniesModule } from '../companies/companies.module';
import { CrawlerModule } from '../crawler/crawler.module';
import { SeoModule } from '../seo/seo.module';
import { PerformanceModule } from '../performance/performance.module';
import { BrandingModule } from '../branding/branding.module';
import { AiModule } from '../ai/ai.module';
import { LeadsModule } from '../leads/leads.module';
import { SocialModule } from '../social/social.module';
import { CompetitorModule } from '../competitor/competitor.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Audit.name, schema: AuditSchema }]),
    BullModule.registerQueue({ name: 'audit-queue' }),
    CompaniesModule,
    CrawlerModule,
    SeoModule,
    PerformanceModule,
    BrandingModule,
    AiModule,
    LeadsModule,
    SocialModule,
    CompetitorModule,
  ],
  providers: [
    AuditsService,
    AuditProcessor,
    ReportService,
    CompanyDiscoveryService,
    ProposalService,
  ],
  controllers: [AuditsController],
  exports: [AuditsService],
})
export class AuditsModule {}
