import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type LeadDocument = HydratedDocument<Lead>;

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal_sent'
  | 'won'
  | 'lost';

export type LeadSource = 'audit' | 'manual' | 'referral' | 'outbound';

@Schema({ timestamps: true })
export class Lead {
  @Prop({ required: true })
  name!: string;

  @Prop()
  email?: string;

  @Prop()
  phone?: string;

  @Prop({ default: 'new', enum: ['new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost'] })
  status!: LeadStatus;

  @Prop({ default: 'audit', enum: ['audit', 'manual', 'referral', 'outbound'] })
  source!: LeadSource;

  @Prop()
  companyId?: string;

  @Prop()
  auditId?: string;

  @Prop()
  organizationId!: string;

  @Prop({ type: String })
  assignedTo?: string;

  @Prop({ type: [{ note: String, createdAt: Date }], default: [] })
  notes!: { note: string; createdAt: Date }[];

  @Prop()
  nextFollowUp?: Date;

  @Prop()
  estimatedValue?: number;

  @Prop()
  proposalUrl?: string;
}

export const LeadSchema = SchemaFactory.createForClass(Lead);
