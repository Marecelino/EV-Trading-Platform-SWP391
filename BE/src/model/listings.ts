import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from './users.schema';

export enum ListingStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  SOLD = 'sold',
  EXPIRED = 'expired',
  REMOVED = 'removed',
}

export enum VehicleCondition {
  NEW = 'new',
  LIKE_NEW = 'like_new',
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
}

export type ListingDocument = HydratedDocument<Listing>;

@Schema({
  timestamps: true,
})
export class Listing {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  seller_id: Types.ObjectId | User;

  @Prop({
    type: Types.ObjectId,
    ref: 'Brand',
    required: true,
  })
  brand_id: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Model',
    required: true,
  })
  model_id: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 100,
  })
  title: string;

  @Prop({
    required: true,
    trim: true,
    minlength: 20,
    maxlength: 2000,
  })
  description: string;

  @Prop({
    required: true,
    min: 0,
  })
  price: number;

  @Prop({
    type: String,
    enum: ListingStatus,
    default: ListingStatus.DRAFT,
  })
  status: ListingStatus;

  @Prop({
    type: String,
    enum: VehicleCondition,
    required: true,
  })
  condition: VehicleCondition;

  @Prop({
    default: false,
  })
  is_verified: boolean;

  @Prop({
    default: false,
  })
  is_featured: boolean;

  @Prop({
    type: Types.ObjectId,
    ref: 'Category',
    required: true,
  })
  category_id: Types.ObjectId;

  @Prop({
    type: [String],
    validate: {
      validator: function (v: string[]) {
        return v.length > 0 && v.length <= 10;
      },
      message: 'Must have between 1 and 10 images',
    },
  })
  images: string[];

  // Thông tin bổ sung
  @Prop()
  year: number;

  @Prop()
  mileage: number;

  @Prop()
  location: string;

  @Prop()
  battery_capacity: number; // kWh

  @Prop()
  range: number; // km

  @Prop({ default: 0 })
  view_count: number;

  @Prop({ default: 0 })
  favorite_count: number;

  @Prop()
  expiry_date: Date;
}

export const ListingSchema = SchemaFactory.createForClass(Listing);

// Indexes
ListingSchema.index({ seller_id: 1, status: 1 });
ListingSchema.index({ brand_id: 1, model_id: 1 });
ListingSchema.index({ category_id: 1, status: 1 });
ListingSchema.index({ price: 1, condition: 1 });
ListingSchema.index({ is_featured: 1, status: 1 });
ListingSchema.index({ location: 1 });
ListingSchema.index({ createdAt: -1 });

// Text search index
ListingSchema.index(
  {
    title: 'text',
    description: 'text',
  },
  {
    weights: {
      title: 10,
      description: 5,
    },
  },
);
