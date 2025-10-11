import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Brand } from './brands';

@Schema({
  timestamps: true,
})
export class Model extends Document {
  @Prop({
    type: Types.ObjectId,
    ref: 'Brand',
    required: true,
  })
  brand_id: Types.ObjectId | Brand;

  @Prop({
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 100,
  })
  name: string;

  @Prop({
    trim: true,
    maxlength: 1000,
  })
  description: string;

  @Prop()
  year_start: number;

  @Prop()
  year_end: number;

  @Prop()
  body_type: string; // SUV, Sedan, Hatchback, etc.

  @Prop()
  drivetrain: string; // FWD, RWD, AWD

  @Prop({
    default: true,
  })
  is_active: boolean;

  @Prop({
    default: 0,
  })
  listing_count: number;

  // EV specific fields
  @Prop()
  battery_capacity: number; // kWh

  @Prop()
  range: number; // km

  @Prop()
  charging_time: number; // hours

  @Prop()
  motor_power: number; // kW

  @Prop()
  top_speed: number; // km/h
}

export const ModelSchema = SchemaFactory.createForClass(Model);

// Indexes
ModelSchema.index({ brand_id: 1, name: 1 });
ModelSchema.index({ brand_id: 1, is_active: 1 });
ModelSchema.index({ year_start: 1, year_end: 1 });
ModelSchema.index({ body_type: 1 });

// Text search index
ModelSchema.index({ name: 'text', description: 'text' });
