import { Module } from '@nestjs/common';
import { CrawlerModule } from '../crawler/crawler.module';
import { SeoModule } from '../seo/seo.module';
import { PerformanceModule } from '../performance/performance.module';
import { BrandingModule } from '../branding/branding.module';
import { AuditsModule } from '../audits/audits.module';
import { CompetitorController } from './competitor.controller';
import { CompetitorService } from './competitor.service';

@Module({
  imports: [CrawlerModule, SeoModule, PerformanceModule, BrandingModule, AuditsModule],
  controllers: [CompetitorController],
  providers: [CompetitorService],
  exports: [CompetitorService],
})
export class CompetitorModule {}
