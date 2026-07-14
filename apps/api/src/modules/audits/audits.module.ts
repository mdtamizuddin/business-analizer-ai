import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { Audit, AuditSchema } from './schemas/audit.schema';
import { AuditsService } from './audits.service';
import { AuditsController } from './audits.controller';
import { AuditProcessor } from './processors/audit.processor';
import { CompaniesModule } from '../companies/companies.module';
import { CrawlerModule } from '../crawler/crawler.module';
import { SeoModule } from '../seo/seo.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Audit.name, schema: AuditSchema }]),
    BullModule.registerQueue({ name: 'audit-queue' }),
    CompaniesModule,
    CrawlerModule,
    SeoModule,
    AiModule,
  ],
  providers: [AuditsService, AuditProcessor],
  controllers: [AuditsController],
  exports: [AuditsService],
})
export class AuditsModule {}
