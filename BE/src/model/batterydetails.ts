import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Listing } from './listings';

export enum BatteryChemistry {
  LITHIUM_ION = 'lithium_ion',
  LITHIUM_IRON_PHOSPHATE = 'lithium_iron_phosphate',
  NICKEL_METAL_HYDRIDE = 'nickel_metal_hydride',
  SOLID_STATE = 'solid_state',
}

@Schema({
  timestamps: true,
})
export class BatteryDetail extends Document {
  @Prop({
    type: Types.ObjectId,
    ref: 'Listing',
    required: true,
    unique: true,
  })
  listing_id: Types.ObjectId | Listing;

  @Prop({
    type: String,
    enum: BatteryChemistry,
    required: true,
  })
  chemistry: BatteryChemistry;

  @Prop({
    required: true,
    min: 0,
  })
  capacity_kwh: number;

  @Prop({
    required: true,
    min: 0,
    max: 100,
  })
  soh_percent: number; // State of Health

  @Prop({
    required: true,
    min: 0,
  })
  cycle_count: number;

  @Prop({
    required: true,
    min: 0,
  })
  voltage_v: number;

  @Prop({
    required: true,
    min: 0,
  })
  weight_kg: number;

  @Prop({
    required: true,
    trim: true,
  })
  origin: string;

  @Prop()
  warranty_remaining_months: number;

  @Prop()
  last_health_check: Date;

  @Prop()
  temperature_range_min: number; // Celsius

  @Prop()
  temperature_range_max: number; // Celsius

  @Prop()
  charging_cycles_warranty: number;

  @Prop()
  degradation_rate_annual: number; // Percentage per year
}

export const BatteryDetailSchema = SchemaFactory.createForClass(BatteryDetail);

// Indexes
BatteryDetailSchema.index({ listing_id: 1 });
BatteryDetailSchema.index({ chemistry: 1, capacity_kwh: 1 });
BatteryDetailSchema.index({ soh_percent: 1, cycle_count: 1 });
BatteryDetailSchema.index({ warranty_remaining_months: 1 });
