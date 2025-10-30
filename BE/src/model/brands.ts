import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type BrandDocument = HydratedDocument<Brand>;
@Schema({
  timestamps: true,
})
export class Brand extends Document {
  @Prop({
    required: true,
    unique: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
  })
  name: string;

  @Prop({
    trim: true,
    maxlength: 500,
  })
  description: string;

  @Prop()
  logo_url: string;

  @Prop()
  website: string;

  @Prop({
    trim: true,
    maxlength: 100,
  })
  country: string;

  @Prop({
    default: true,
  })
  is_active: boolean;

  @Prop({
    default: 0,
  })
  listing_count: number;
}

export const BrandSchema = SchemaFactory.createForClass(Brand);

// Indexes
BrandSchema.index({ is_active: 1, name: 1 });
BrandSchema.index({ country: 1 });

// Text search index
BrandSchema.index({ name: 'text', description: 'text' });
