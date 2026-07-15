import { IsArray, IsOptional, IsString, IsUrl } from 'class-validator';

export class SocialProfileDto {
  @IsString()
  platform!: string;

  @IsUrl()
  url!: string;
}

export class AnalyzeSocialDto {
  @IsArray()
  @IsOptional()
  profiles?: SocialProfileDto[];

  @IsOptional()
  @IsString()
  companyId?: string;
}
