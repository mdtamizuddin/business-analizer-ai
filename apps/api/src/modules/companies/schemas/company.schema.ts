import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class Company {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  website!: string;

  @Prop()
  industry?: string;

  @Prop()
  description?: string;

  @Prop()
  logoUrl?: string;

  @Prop({ type: [Object], default: [] })
  socialAccounts!: { platform: string; url: string; username?: string }[];

  @Prop({ type: [String], default: [] })
  technologyStack!: string[];

  @Prop({ required: true, index: true })
  organizationId!: string;
}

export type CompanyDocument = HydratedDocument<Company>;
export const CompanySchema = SchemaFactory.createForClass(Company);
