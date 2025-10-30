import { Type } from 'class-transformer';
import {
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { TransactionComplaintStatus } from '../../model/transactioncomplaints';

export class FilterTransactionComplaintsDto {
  @IsOptional()
  @IsEnum(TransactionComplaintStatus)
  status?: TransactionComplaintStatus;

  @IsOptional()
  @IsMongoId()
  transaction_id?: string;

  @IsOptional()
  @IsMongoId()
  complainant_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  page?: number;
}
