import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Transaction } from './transactions';
import { User } from './users.schema';

export enum TransactionComplaintStatus {
  OPEN = 'OPEN',
  IN_REVIEW = 'IN_REVIEW',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
}

export enum TransactionComplaintReason {
  QUALITY_ISSUE = 'QUALITY_ISSUE',
  NON_PAYMENT = 'NON_PAYMENT',
  FRAUD = 'FRAUD',
  OTHER = 'OTHER',
}

export enum TransactionComplaintResolution {
  UNSET = 'UNSET',
  REFUND = 'REFUND',
  PARTIAL_REFUND = 'PARTIAL_REFUND',
  NO_ACTION = 'NO_ACTION',
  OTHER = 'OTHER',
}

export type TransactionComplaintDocument =
  HydratedDocument<TransactionComplaint>;

@Schema({ timestamps: true })
export class TransactionComplaint {
  @Prop({ type: Types.ObjectId, ref: Transaction.name, required: true })
  transaction_id: Types.ObjectId | Transaction;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  complainant_id: Types.ObjectId | User;

  @Prop({ type: Types.ObjectId, ref: User.name })
  respondent_id?: Types.ObjectId | User;

  @Prop({
    type: String,
    enum: TransactionComplaintReason,
    required: true,
  })
  reason: TransactionComplaintReason;

  @Prop({ trim: true, minlength: 10, maxlength: 1000 })
  description: string;

  @Prop({ type: [String], default: [] })
  attachments: string[];

  @Prop({
    type: String,
    enum: TransactionComplaintStatus,
    default: TransactionComplaintStatus.OPEN,
  })
  status: TransactionComplaintStatus;

  @Prop({ type: String })
  admin_notes?: string;

  @Prop({
    type: String,
    enum: TransactionComplaintResolution,
    default: TransactionComplaintResolution.UNSET,
  })
  resolution: TransactionComplaintResolution;

  @Prop({ type: Types.ObjectId, ref: User.name })
  assigned_to?: Types.ObjectId | User;

  @Prop({ type: Date })
  resolved_at?: Date;
}

export const TransactionComplaintSchema =
  SchemaFactory.createForClass(TransactionComplaint);

TransactionComplaintSchema.index({ transaction_id: 1, status: 1 });
TransactionComplaintSchema.index({ complainant_id: 1, createdAt: -1 });
TransactionComplaintSchema.index({ description: 'text', admin_notes: 'text' });
