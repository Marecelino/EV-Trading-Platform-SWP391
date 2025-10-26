import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum ContractStatus {
  DRAFT = 'DRAFT',
  PENDING_SIGNATURE = 'PENDING_SIGNATURE',
  SIGNED = 'SIGNED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
  ERROR = 'ERROR',
}

@Schema({ timestamps: true })
export class Contract {
  @Prop({ type: Types.ObjectId, ref: 'Transaction', required: true })
  transaction_id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Payment', required: true })
  payment_id!: Types.ObjectId;

  @Prop({ required: true, unique: true })
  contract_no!: string;

  @Prop({ required: true })
  document_url!: string;

  @Prop({ enum: ContractStatus, default: ContractStatus.DRAFT })
  status!: ContractStatus;

  @Prop({ default: 'Standard sale contract' })
  terms_and_conditions!: string;

  @Prop()
  notes?: string;

  @Prop({ type: Date })
  signed_at?: Date;

  @Prop({ type: Array, default: [] })
  audit_events!: Array<{
    label: string;
    performed_by?: string;
    performed_at: Date;
    payload?: Record<string, unknown>;
  }>;

  @Prop()
  provider?: string;

  @Prop()
  provider_document_id?: string;

  @Prop()
  provider_invite_id?: string;
}

export type ContractDocument = Contract & Document;
export const ContractSchema = SchemaFactory.createForClass(Contract);
