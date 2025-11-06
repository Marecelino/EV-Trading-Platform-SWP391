import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from './users.schema';

export enum ListingStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  SOLD = 'sold',
  EXPIRED = 'expired',
  PENDING = 'pending',
  REJECTED = 'rejected',
}
export enum PaymentListingStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
}

export enum VehicleCondition {
  NEW = 'new',
  LIKE_NEW = 'like_new',
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
}

export enum CategoryEnum {
  EV = 'ev',
  BATTERY = 'battery',
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
    enum: PaymentListingStatus,
    default: PaymentListingStatus.PENDING,
  })
  payment_status: PaymentListingStatus;

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
    type: String,
    enum: CategoryEnum,
    required: true,
  })
  category: CategoryEnum;

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
  @Prop({
    type: String,
    trim: true,
    maxlength: 255,
    required: false,
  })
  location?: string;
}

export const ListingSchema = SchemaFactory.createForClass(Listing);

// Indexes
ListingSchema.index({ seller_id: 1, status: 1 });
ListingSchema.index({ brand_id: 1 });
// Use the actual field name `category` (was previously `category_id`)
ListingSchema.index({ category: 1, status: 1 });
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
