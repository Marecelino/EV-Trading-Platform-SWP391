import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Listing } from './listings';

@Schema({
  timestamps: true,
})
export class EVDetail extends Document {
  @Prop({
    type: Types.ObjectId,
    ref: 'Listing',
    required: true,
    unique: true,
  })
  listing_id: Types.ObjectId | Listing;

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

  @Prop({
    required: true,
    trim: true,
  })
  condition: string;

  @Prop({
    required: true,
    trim: true,
  })
  color: string;

  @Prop({
    required: true,
    min: 1,
    max: 9,
  })
  seats: number;

  @Prop({
    required: true,
    trim: true,
  })
  drive_type: string; // FWD, RWD, AWD

  // Additional EV specific fields
  @Prop()
  charging_time_ac: number; // hours

  @Prop()
  charging_time_dc: number; // minutes

  @Prop()
  motor_power: number; // kW

  @Prop()
  top_speed: number; // km/h

  @Prop()
  acceleration_0_100: number; // seconds

  @Prop()
  charging_port_type: string;

  @Prop({
    type: [String],
  })
  features: string[];
}

export const EVDetailSchema = SchemaFactory.createForClass(EVDetail);

// Indexes
EVDetailSchema.index({ listing_id: 1 });
EVDetailSchema.index({ year: 1, mileage_km: 1 });
EVDetailSchema.index({ battery_capacity_kwh: 1, range_km: 1 });
EVDetailSchema.index({ color: 1, seats: 1 });
