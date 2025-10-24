import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum AuctionStatus {
  SCHEDULED = 'scheduled',
  LIVE = 'live',
  ENDED = 'ended',
  CANCELLED = 'cancelled',
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
    ref: 'Listing',
    required: true,
  })
  listing_id: Types.ObjectId;

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