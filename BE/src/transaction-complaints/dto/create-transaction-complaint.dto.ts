import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { TransactionComplaintReason } from '../../model/transactioncomplaints';

export class CreateTransactionComplaintDto {
  @IsEnum(TransactionComplaintReason)
  reason: TransactionComplaintReason;

  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  description: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}
