import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from './users.schema';
import { Listing } from './listings';

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  CREDIT_CARD = 'credit_card',
  ESCROW = 'escrow',
}

export type TransactionDocument = HydratedDocument<Transaction>;

@Schema({
  timestamps: true,
})
export class Transaction {
  @Prop({
    type: Types.ObjectId,
    ref: 'Listing',
    required: true,
  })
  listing_id: Types.ObjectId | Listing;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  buyer_id: Types.ObjectId | User;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  seller_id: Types.ObjectId | User;

  @Prop({
    required: true,
    min: 0,
  })
  price: number;

  @Prop({
    type: String,
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Prop({
    type: String,
    enum: PaymentMethod,
  })
  payment_method: PaymentMethod;

  @Prop({
    min: 0,
    default: 0,
  })
  commission_amount: number;

  @Prop()
  payment_reference: string;

  @Prop()
  notes: string;

  @Prop()
  completion_date: Date;

  @Prop()
  meeting_location: string;

  @Prop()
  meeting_date: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

// Indexes
TransactionSchema.index({ buyer_id: 1, status: 1 });
TransactionSchema.index({ seller_id: 1, status: 1 });
TransactionSchema.index({ listing_id: 1 });
TransactionSchema.index({ status: 1, createdAt: -1 });
TransactionSchema.index({ payment_reference: 1 });

// Middleware để tính commission
TransactionSchema.pre('save', function (next) {
  if (this.isModified('price') && this.price > 0) {
    // Tính commission (có thể lấy từ config)
    this.commission_amount = this.price * 0.05;
  }
  next();
});
