import { IsEmail, IsEnum, IsOptional, IsString, IsUrl, Min, MinLength } from 'class-validator';
import { LeadStatus, LeadSource } from '../schemas/lead.schema';

export class CreateLeadDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(['new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost'])
  status?: LeadStatus;

  @IsOptional()
  @IsEnum(['audit', 'manual', 'referral', 'outbound'])
  source?: LeadSource;

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  auditId?: string;

  @IsOptional()
  @IsString()
  assignedTo?: string;

  @IsOptional()
  @Min(0)
  estimatedValue?: number;
}

export class UpdateLeadDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(['new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost'])
  status?: LeadStatus;

  @IsOptional()
  @IsString()
  assignedTo?: string;

  @IsOptional()
  @Min(0)
  estimatedValue?: number;

  @IsOptional()
  nextFollowUp?: Date;

  @IsOptional()
  @IsUrl()
  proposalUrl?: string;
}

export class AddNoteDto {
  @IsString()
  @Min(1)
  note!: string;
}
