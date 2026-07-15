import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CompetitorService } from './competitor.service';
import { AnalyzeCompetitorDto } from './dto/competitor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('competitor')
@UseGuards(JwtAuthGuard)
export class CompetitorController {
  constructor(
    private readonly competitorService: CompetitorService,
  ) {}

  @Post('analyze')
  async analyze(@Body() dto: AnalyzeCompetitorDto) {
    return this.competitorService.analyze(dto.competitorUrl);
  }
}
