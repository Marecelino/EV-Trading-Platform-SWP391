import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from './users.schema';

export type ReviewDocument = HydratedDocument<Review>;

@Schema({
  timestamps: true,
})
export class Review {
  // Người viết review
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  reviewer_id: Types.ObjectId | User;

  // Người được review
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  reviewee_id: Types.ObjectId | User;

  @Prop({
    required: true,
    min: 1,
    max: 5,
  })
  rating: number;

  @Prop({
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 500,
  })
  comment: string;

  // Có thể liên kết với transaction cụ thể
  @Prop({
    type: Types.ObjectId,
    ref: 'Transaction',
  })
  transaction_id: Types.ObjectId;

  // Trạng thái review (để admin có thể ẩn/hiện)
  @Prop({
    default: true,
  })
  is_visible: boolean;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

// Indexes
ReviewSchema.index({ reviewer_id: 1, reviewee_id: 1 });
ReviewSchema.index({ reviewee_id: 1, rating: 1 });
ReviewSchema.index({ transaction_id: 1 });
ReviewSchema.index({ is_visible: 1, createdAt: -1 });

// Đảm bảo một người không thể tự review chính mình
ReviewSchema.pre('save', function (next) {
  if (this.reviewer_id.toString() === this.reviewee_id.toString()) {
    next(new Error('Cannot review yourself'));
  }
  next();
});
