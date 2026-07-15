import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CompaniesModule } from './modules/companies/companies.module';
import { AuditsModule } from './modules/audits/audits.module';
import { CrawlerModule } from './modules/crawler/crawler.module';
import { SeoModule } from './modules/seo/seo.module';
import { AiModule } from './modules/ai/ai.module';
import { AuthModule } from './modules/auth/auth.module';
import { LeadsModule } from './modules/leads/leads.module';
import { CompetitorModule } from './modules/competitor/competitor.module';
import { SocialModule } from './modules/social/social.module';
import { GoogleBusinessModule } from './modules/google-business/google-business.module';
import { AccessibilityModule } from './modules/accessibility/accessibility.module';
import { SecurityModule } from './modules/security/security.module';
import { TechnologyModule } from './modules/technology/technology.module';
import { CacheModule } from './modules/cache/cache.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '.env.local'] }),
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/abap',
      }),
    }),
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: {
          host: process.env.REDIS_HOST ?? 'localhost',
          port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
        },
      }),
    }),
    ThrottlerModule.forRoot({ throttlers: [{ ttl: 60000, limit: 100 }] }),
    CacheModule,
    CompaniesModule,
    CrawlerModule,
    SeoModule,
    AiModule,
    AuditsModule,
    AuthModule,
    LeadsModule,
    CompetitorModule,
    SocialModule,
    GoogleBusinessModule,
    AccessibilityModule,
    SecurityModule,
    TechnologyModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
