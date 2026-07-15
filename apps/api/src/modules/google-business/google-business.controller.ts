import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { GoogleBusinessService } from './google-business.service';
import { AnalyzeGoogleBusinessDto } from './dto/google-business.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('google-business')
@UseGuards(JwtAuthGuard)
export class GoogleBusinessController {
  constructor(private readonly gbService: GoogleBusinessService) {}

  @Post('analyze')
  analyze(@Body() dto: AnalyzeGoogleBusinessDto) {
    return this.gbService.analyze(dto.profileUrl);
  }
}
