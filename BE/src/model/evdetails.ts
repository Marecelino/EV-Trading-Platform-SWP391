import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Listing } from './listings';
import { Auction } from './auctions';

export type EVDetailDocument = HydratedDocument<EVDetail>;

@Schema({
  timestamps: true,
})
export class EVDetail {
  @Prop({
    type: Types.ObjectId,
    ref: 'Listing',
    required: false,
  })
  listing_id?: Types.ObjectId | Listing;

  @Prop({
    type: Types.ObjectId,
    ref: 'Auction',
    required: false,
  })
  auction_id?: Types.ObjectId | Auction;

  @Prop({
    required: true,
    min: 1990,
    max: new Date().getFullYear() + 2,
  })
  year: number;

  @Prop({
    required: true,
    min: 0,
  })
  mileage_km: number;

  @Prop({
    required: true,
    min: 0,
  })
  battery_capacity_kwh: number;

  @Prop({
    required: true,
    min: 0,
  })
  range_km: number;
}

// Đảm bảo ít nhất 1 trong 2 trường listing_id hoặc auction_id phải có
export const EVDetailSchema = SchemaFactory.createForClass(EVDetail);

EVDetailSchema.pre('validate', function (next) {
  if (!this.listing_id && !this.auction_id) {
    return next(
      new Error('Either listing_id or auction_id is required for EVDetail'),
    );
  }
  next();
});
// Ensure uniqueness only when the field exists (allow multiple documents without auction_id/listing_id)
EVDetailSchema.index(
  { listing_id: 1 },
  { unique: true, partialFilterExpression: { listing_id: { $exists: true } } },
);
EVDetailSchema.index(
  { auction_id: 1 },
  { unique: true, partialFilterExpression: { auction_id: { $exists: true } } },
);
