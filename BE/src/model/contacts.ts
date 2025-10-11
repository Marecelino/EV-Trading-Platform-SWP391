import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Transaction } from './transactions';

export enum ContractStatus {
  DRAFT = 'draft',
  SIGNED = 'signed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

@Schema({
  timestamps: true,
})
export class Contract extends Document {
  @Prop({
    type: Types.ObjectId,
    ref: 'Transaction',
    required: true,
    unique: true,
  })
  transaction_id: Types.ObjectId | Transaction;

  @Prop({
    required: true,
    unique: true,
    trim: true,
  })
  contract_no: string;

  @Prop({
    type: String,
    enum: ContractStatus,
    default: ContractStatus.DRAFT,
  })
  status: ContractStatus;

  @Prop()
  signed_at: Date;

  @Prop()
  expires_at: Date;

  @Prop({
    required: true,
  })
  document_url: string;

  @Prop()
  terms_and_conditions: string;

  @Prop({
    type: [String],
  })
  signatures: string[]; // URLs của chữ ký số

  @Prop()
  witness_signature: string;

  @Prop()
  notes: string;
}

export const ContractSchema = SchemaFactory.createForClass(Contract);

// Indexes
ContractSchema.index({ transaction_id: 1 });
ContractSchema.index({ contract_no: 1 });
ContractSchema.index({ status: 1, createdAt: -1 });
ContractSchema.index({ expires_at: 1 });
