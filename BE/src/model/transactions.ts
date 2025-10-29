import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum TransactionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ type: Types.ObjectId, ref: 'Listing' })
  listing_id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Auction' })
  auction_id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  buyer_id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  seller_id!: Types.ObjectId;

  @Prop({ required: true })
  price!: number;

  @Prop()
  payment_method?: string;

  @Prop()
  payment_reference?: string;

  @Prop({ type: Date })
  meeting_date?: Date;

  @Prop({ enum: TransactionStatus, default: TransactionStatus.PENDING })
  status!: TransactionStatus;

  @Prop()
  notes?: string;

  @Prop({ default: 0 })
  commission_rate?: number;

  @Prop({ default: 0 })
  platform_fee?: number;

  @Prop({ default: 0 })
  seller_payout?: number;

  @Prop({ type: Types.ObjectId, ref: 'Contract' })
  contract_id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Commission' })
  commission_id?: Types.ObjectId;
}

export type TransactionDocument = Transaction & Document;
export const TransactionSchema = SchemaFactory.createForClass(Transaction);
