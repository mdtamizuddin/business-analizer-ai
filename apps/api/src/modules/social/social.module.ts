import { Module } from '@nestjs/common';
import { CrawlerModule } from '../crawler/crawler.module';
import { AiModule } from '../ai/ai.module';
import { CompaniesModule } from '../companies/companies.module';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';

@Module({
  imports: [CrawlerModule, AiModule, CompaniesModule],
  controllers: [SocialController],
  providers: [SocialService],
  exports: [SocialService],
})
export class SocialModule {}
