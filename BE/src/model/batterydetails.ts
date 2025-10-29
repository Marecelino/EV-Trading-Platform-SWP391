import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Listing } from './listings';
import { Auction } from './auctions';

export type BatteryDetailDocument = HydratedDocument<BatteryDetail>;

@Schema({
  timestamps: true,
})
export class BatteryDetail {
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

  // Dung lượng pin (kWh)
  @Prop({
    required: true,
    min: 0,
  })
  capacity_kwh: number;

  // Sức khỏe pin (State of Health) as percentage 0-100
  @Prop({
    required: true,
    min: 0,
    max: 100,
  })
  soh_percent: number;

  @Prop({
    required: false,
    trim: true,
    maxlength: 100,
  })
  battery_type?: string;

  @Prop({
    required: false,
    min: 1900,
    max: new Date().getFullYear() + 5,
  })
  manufacture_year?: number;
}

export const BatteryDetailSchema = SchemaFactory.createForClass(BatteryDetail);
