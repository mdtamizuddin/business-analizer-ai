import { Module } from '@nestjs/common';
import { CrawlerModule } from '../crawler/crawler.module';
import { AiModule } from '../ai/ai.module';
import { GoogleBusinessController } from './google-business.controller';
import { GoogleBusinessService } from './google-business.service';

@Module({
  imports: [CrawlerModule, AiModule],
  controllers: [GoogleBusinessController],
  providers: [GoogleBusinessService],
  exports: [GoogleBusinessService],
})
export class GoogleBusinessModule {}
