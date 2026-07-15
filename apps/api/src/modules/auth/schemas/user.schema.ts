import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop({ type: String, default: 'user', enum: ['user', 'admin', 'consultant'] })
  role!: 'user' | 'admin' | 'consultant';

  @Prop({ default: 'default-org' })
  organizationId!: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
