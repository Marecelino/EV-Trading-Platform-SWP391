import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from './users.schema';

export enum NotificationType {
  LISTING_APPROVED = 'listing_approved',
  LISTING_REJECTED = 'listing_rejected',
  NEW_MESSAGE = 'new_message',
  TRANSACTION_COMPLETED = 'transaction_completed',
  PRICE_SUGGESTION = 'price_suggestion',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
  REVIEW_RECEIVED = 'review_received',
}

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({
  timestamps: true,
})
export class Notification {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  user_id: Types.ObjectId | User;

  @Prop({
    required: true,
    trim: true,
    maxlength: 500,
  })
  message: string;

  @Prop({
    type: String,
    enum: NotificationType,
    required: true,
  })
  type: NotificationType;

  @Prop({
    default: false,
  })
  is_read: boolean;

  @Prop()
  related_id: string; // ID của object liên quan (listing, transaction, etc.)

  @Prop()
  action_url: string; // URL để chuyển hướng khi click notification

  @Prop()
  read_at: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Indexes
NotificationSchema.index({ user_id: 1, is_read: 1, createdAt: -1 });
NotificationSchema.index({ user_id: 1, type: 1 });
NotificationSchema.index({ related_id: 1 });
