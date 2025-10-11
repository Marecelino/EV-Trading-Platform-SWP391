import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  timestamps: true
})
export class CommissionConfig extends Document {
  @Prop({
    required: true,
    min: 0,
    max: 100,
    type: Number
  })
  percentage: number; // Phần trăm hoa hồng

  @Prop({
    required: true,
    min: 0,
    type: Number
  })
  min_fee: number; // Phí tối thiểu

  @Prop({
    required: true,
    min: 0,
    type: Number
  })
  max_fee: number; // Phí tối đa

  @Prop({
    required: true,
    type: Date
  })
  effective_from: Date; // Ngày có hiệu lực

  @Prop({
    type: Date
  })
  effective_to: Date; // Ngày hết hiệu lực

  @Prop({
    default: true
  })
  is_active: boolean; // Trạng thái active

  @Prop()
  description: string; // Mô tả về config

  @Prop()
  created_by: string; // Admin tạo config
}

export const CommissionConfigSchema = SchemaFactory.createForClass(CommissionConfig);

// Indexes
CommissionConfigSchema.index({ effective_from: 1, is_active: 1 });
CommissionConfigSchema.index({ is_active: 1, effective_from: -1 });

// Validation middleware
CommissionConfigSchema.pre('save', function(next) {
  // Đảm bảo max_fee >= min_fee
  if (this.max_fee < this.min_fee) {
    next(new Error('max_fee must be greater than or equal to min_fee'));
  }
  
  // Đảm bảo effective_to (nếu có) > effective_from
  if (this.effective_to && this.effective_to <= this.effective_from) {
    next(new Error('effective_to must be greater than effective_from'));
  }
  
  next();
});

// Static method để lấy config hiện tại
CommissionConfigSchema.statics.getCurrentConfig = function() {
  const now = new Date();
  return this.findOne({
    is_active: true,
    effective_from: { $lte: now },
    $or: [
      { effective_to: { $exists: false } },
      { effective_to: { $gte: now } }
    ]
  }).sort({ effective_from: -1 });
};