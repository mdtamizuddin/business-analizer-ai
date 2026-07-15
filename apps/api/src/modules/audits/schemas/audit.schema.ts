import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class Audit {
  @Prop({ required: true, index: true })
  companyId!: string;

  @Prop({ required: true, index: true })
  organizationId!: string;

  @Prop({ required: true, default: 'pending', enum: ['pending', 'crawling', 'analyzing', 'ai_processing', 'generating_report', 'completed', 'failed'] })
  status!: string;

  @Prop()
  currentStage?: string;

  @Prop({ required: true, default: Date.now })
  startedAt!: Date;

  @Prop()
  completedAt?: Date;

  @Prop({ type: Object })
  crawlData?: any;

  @Prop({ type: Object })
  seoAnalysis?: any;

  @Prop({ type: Object })
  performanceAnalysis?: any;

  @Prop({ type: Object })
  brandingAnalysis?: any;

  @Prop({ type: Object })
  accessibilityAnalysis?: any;

  @Prop({ type: Object })
  securityAnalysis?: any;

  @Prop({ type: Object })
  technologyDetection?: any;

  @Prop({ type: Object })
  companyDiscovery?: any;

  @Prop({ type: Object })
  brandVision?: any;

  @Prop({ type: Object })
  socialSnapshot?: any;

  @Prop({ type: Object })
  competitorSnapshot?: any;

  @Prop({ type: Object })
  scores?: any;

  @Prop({ type: Object })
  proposal?: any;

  @Prop({ type: [Object], default: [] })
  recommendations!: any[];

  @Prop()
  executiveSummary?: string;

  @Prop()
  reportUrl?: string;

  @Prop()
  error?: string;

  @Prop({ type: Object })
  auditOptions?: {
    crawlDepth?: number;
    runSeoAudit?: boolean;
    runPerformanceAudit?: boolean;
    runBrandingAudit?: boolean;
    runAiProcessing?: boolean;
  };
}

export type AuditDocument = HydratedDocument<Audit>;
export const AuditSchema = SchemaFactory.createForClass(Audit);
