import { IsString, IsUrl, IsOptional, IsArray, ValidateNested, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class SocialAccountDto {
  @IsString()
  platform!: string;

  @IsUrl()
  url!: string;

  @IsOptional()
  @IsString()
  username?: string;
}

export class CreateCompanyDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsUrl()
  website!: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SocialAccountDto)
  socialAccounts?: SocialAccountDto[];
}
