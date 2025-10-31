import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CategoryEnum, VehicleCondition } from './listings';

export enum AuctionStatus {
  SCHEDULED = 'scheduled',
  LIVE = 'live',
  ENDED = 'ended',
  CANCELLED = 'cancelled',
  PAYMENT_PENDING = 'payment_pending',
  PAYMENT_COMPLETED = 'payment_completed',
}

// Bid subdocument
@Schema({ _id: false })
export class Bid {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  user_id: Types.ObjectId;

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  amount: number;

  @Prop({
    type: Date,
    default: Date.now,
  })
  created_at: Date;
}

const BidSchema = SchemaFactory.createForClass(Bid);

// Main Auction schema
@Schema({
  timestamps: true,
})
export class Auction extends Document {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  seller_id: Types.ObjectId;

  @Prop({
    type: Date,
    required: true,
  })
  start_time: Date;

  @Prop({
    type: Date,
    required: true,
  })
  end_time: Date;

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  starting_price: number;

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  current_price: number;

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  min_increment: number;

  @Prop({
    type: Number,
    min: 0,
  })
  buy_now_price: number;

  @Prop({
    type: String,
    enum: AuctionStatus,
    default: AuctionStatus.SCHEDULED,
  })
  status: AuctionStatus;
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
    type: String,
    enum: VehicleCondition,
    required: true,
  })
  condition: VehicleCondition;
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
  @Prop({
    type: [BidSchema],
    default: [],
  })
  bids: Bid[];
}

export const AuctionSchema = SchemaFactory.createForClass(Auction);

// Indexes
AuctionSchema.index({ listing_id: 1 });
AuctionSchema.index({ seller_id: 1 });
AuctionSchema.index({ status: 1 });
AuctionSchema.index({ end_time: 1 });
AuctionSchema.index({ start_time: 1 });
