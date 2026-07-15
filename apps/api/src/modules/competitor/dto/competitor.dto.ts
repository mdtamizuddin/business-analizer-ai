import { IsUrl, IsString, IsOptional } from 'class-validator';

export class AnalyzeCompetitorDto {
  @IsUrl()
  competitorUrl!: string;

  @IsOptional()
  @IsString()
  auditId?: string;
}
