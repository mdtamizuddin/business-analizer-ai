import { IsUrl } from 'class-validator';

export class AnalyzeGoogleBusinessDto {
  @IsUrl()
  profileUrl!: string;
}
