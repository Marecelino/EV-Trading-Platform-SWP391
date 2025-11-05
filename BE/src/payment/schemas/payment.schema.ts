import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum PaymentMethod {
  VNPAY = 'VNPAY',
}

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, required: true })
  buyer_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  seller_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  listing_id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  auction_id?: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, enum: PaymentMethod })
  payment_method: PaymentMethod;

  @Prop({ required: true, enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  // VNPay specific fields
  @Prop()
  vnp_TransactionNo?: string;

  @Prop()
  vnp_PayDate?: string;

  @Prop()
  vnp_OrderInfo?: string;

  @Prop()
  vnp_ResponseCode?: string;

  @Prop({ type: Object })
  payment_response?: any;

  @Prop({ type: Types.ObjectId })
  transaction_id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Commission' })
  commission_id?: Types.ObjectId;

  @Prop({ default: 0 })
  platform_fee?: number;

  @Prop({ default: 0 })
  seller_payout?: number;

  @Prop({ type: Types.ObjectId, ref: 'Contract' })
  contract_id?: Types.ObjectId;

  @Prop({ default: false })
  is_listing_fee?: boolean;
}

export type PaymentDocument = Payment & Document;
export const PaymentSchema = SchemaFactory.createForClass(Payment);
