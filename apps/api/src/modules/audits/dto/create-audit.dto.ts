import { IsString, IsOptional, IsBoolean, IsInt, Min, Max } from 'class-validator';

export class CreateAuditDto {
  @IsString()
  companyId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  crawlDepth?: number;

  @IsOptional()
  @IsBoolean()
  runSeoAudit?: boolean;

  @IsOptional()
  @IsBoolean()
  runPerformanceAudit?: boolean;

  @IsOptional()
  @IsBoolean()
  runBrandingAudit?: boolean;

  @IsOptional()
  @IsBoolean()
  runAiProcessing?: boolean;
}
