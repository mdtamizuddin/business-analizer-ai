import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CompetitorService } from './competitor.service';
import { AnalyzeCompetitorDto } from './dto/competitor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuditsService } from '../audits/audits.service';

@Controller('competitor')
@UseGuards(JwtAuthGuard)
export class CompetitorController {
  constructor(
    private readonly competitorService: CompetitorService,
    private readonly auditsService: AuditsService,
  ) {}

  @Post('analyze')
  async analyze(@Body() dto: AnalyzeCompetitorDto) {
    let baseline: {
      seo?: any;
      performance?: any;
      branding?: any;
    } = {};

    if (dto.auditId) {
      const audit = await this.auditsService.findById(dto.auditId);
      baseline = {
        seo: (audit as any).seoAnalysis ?? null,
        performance: (audit as any).performanceAnalysis ?? null,
        branding: (audit as any).brandingAnalysis ?? null,
      };
    }

    return this.competitorService.analyze(dto.competitorUrl, baseline, 5);
  }
}
