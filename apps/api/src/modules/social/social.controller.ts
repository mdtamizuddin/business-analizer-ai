import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { SocialService } from './social.service';
import { AnalyzeSocialDto } from './dto/social.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompaniesService } from '../companies/companies.service';

@Controller('social')
@UseGuards(JwtAuthGuard)
export class SocialController {
  constructor(
    private readonly socialService: SocialService,
    private readonly companiesService: CompaniesService,
  ) {}

  @Post('analyze')
  async analyze(@Body() dto: AnalyzeSocialDto) {
    let profiles = dto.profiles ?? [];
    if (profiles.length === 0 && dto.companyId) {
      const company = await this.companiesService.findById(dto.companyId);
      const social = (company as any)?.socialAccounts ?? [];
      profiles = social.map((s: any) => ({ platform: s.platform, url: s.url }));
    }
    return this.socialService.analyze(profiles);
  }
}
