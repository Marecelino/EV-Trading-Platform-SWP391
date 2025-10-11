import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({
  timestamps: true,
})
export class Category extends Document {
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
  icon_url: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Category',
  })
  parent_category: Types.ObjectId | Category;

  @Prop({
    default: true,
  })
  is_active: boolean;

  @Prop({
    default: 0,
  })
  sort_order: number;

  @Prop({
    default: 0,
  })
  listing_count: number;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

// Indexes
CategorySchema.index({ name: 1 });
CategorySchema.index({ parent_category: 1, is_active: 1 });
CategorySchema.index({ is_active: 1, sort_order: 1 });

// Text search index
CategorySchema.index({ name: 'text', description: 'text' });
