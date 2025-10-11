import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Listing } from './listings';

@Schema({
  timestamps: true // Tự động thêm createdAt và updatedAt
})
export class PriceSuggestion extends Document {
  // Tham chiếu đến listing
  @Prop({ type: Types.ObjectId, ref: 'Listing', required: true })
  listing_id: Types.ObjectId | Listing;

  @Prop({ 
    required: true,
    min: 0 // Giá không thể âm
  })
  suggested_price: number;

  @Prop({ 
    required: true,
    min: 0,
    max: 1 // Độ tin cậy từ 0 đến 1 (0-100%)
  })
  model_confidence: number;

  // Thêm trường để lưu tên model AI đã tạo suggestion
  @Prop({ 
    type: String,
    default: 'default_model'
  })
  model_name: string;

  // Thêm trường ghi chú (optional)
  @Prop()
  notes: string;

  // createdAt và updatedAt sẽ tự động được thêm vào nhờ timestamps: true
}

export const PriceSuggestionSchema = SchemaFactory.createForClass(PriceSuggestion);

// Tạo index để tối ưu truy vấn
PriceSuggestionSchema.index({ listing_id: 1 });
PriceSuggestionSchema.index({ model_confidence: -1 }); // Sắp xếp theo độ tin cậy cao nhất
PriceSuggestionSchema.index({ createdAt: -1 }); // Sắp xếp theo thời gian mới nhất

// Thêm validation middleware
PriceSuggestionSchema.pre('save', function(next) {
  // Đảm bảo model_confidence nằm trong khoảng 0-1
  if (this.model_confidence < 0 || this.model_confidence > 1) {
    next(new Error('Model confidence must be between 0 and 1'));
  }
  
  // Đảm bảo suggested_price không âm
  if (this.suggested_price < 0) {
    next(new Error('Suggested price cannot be negative'));
  }
  
  next();
});