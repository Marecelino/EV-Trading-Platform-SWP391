import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TransactionStatus } from '../../model/transactions';

export class UpdateTransactionStatusDto {
  @IsEnum(TransactionStatus)
  status: TransactionStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
