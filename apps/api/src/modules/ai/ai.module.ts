import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GeminiProvider } from './providers/gemini.provider';
import { GroqProvider } from './providers/groq.provider';
import { AiService } from './ai.service';

@Module({
  imports: [ConfigModule],
  providers: [GeminiProvider, GroqProvider, AiService],
  exports: [AiService],
})
export class AiModule {}
