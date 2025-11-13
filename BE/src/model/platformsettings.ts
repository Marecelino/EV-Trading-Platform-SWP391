import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  timestamps: true,
})
export class PlatformSettings extends Document {
  @Prop({
    type: Number,
    default: 15000,
    required: true,
  })
  listing_fee_amount: number;

  @Prop({
    type: Number,
    default: 0.02,
    required: true,
  })
  commission_default_rate: number;

  @Prop({
    type: Number,
    default: 100000000,
    required: true,
  })
  commission_threshold: number;

  @Prop({
    type: String,
  })
  updated_by?: string;
}

export const PlatformSettingsSchema =
  SchemaFactory.createForClass(PlatformSettings);

// Ensure only one document exists (singleton pattern)
PlatformSettingsSchema.index({ _id: 1 }, { unique: true });
