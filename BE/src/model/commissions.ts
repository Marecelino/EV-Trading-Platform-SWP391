import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Transaction } from './transactions';
import { CommissionConfig } from './commissionconfigs';

export enum CommissionStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

@Schema({
  timestamps: true,
})
export class Commission extends Document {
  @Prop({
    type: Types.ObjectId,
    ref: 'Transaction',
    required: true,
    unique: true,
  })
  transaction_id: Types.ObjectId | Transaction;

  @Prop({
    type: Types.ObjectId,
    ref: 'CommissionConfig',
    required: false,
  })
  config_id?: Types.ObjectId | CommissionConfig;

  @Prop({
    required: true,
    min: 0,
    max: 100,
  })
  percentage: number;

  @Prop({
    required: true,
    min: 0,
  })
  amount: number;

  @Prop({
    type: String,
    enum: CommissionStatus,
    default: CommissionStatus.PENDING,
  })
  status: CommissionStatus;

  @Prop()
  paid_at: Date;

  @Prop()
  payment_reference: string;

  @Prop()
  notes: string;
}

export const CommissionSchema = SchemaFactory.createForClass(Commission);

// Indexes
CommissionSchema.index({ transaction_id: 1 });
CommissionSchema.index({ status: 1, createdAt: -1 });
CommissionSchema.index({ config_id: 1 });
CommissionSchema.index({ paid_at: 1 });
