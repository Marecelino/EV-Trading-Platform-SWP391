import {
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  TransactionComplaintResolution,
  TransactionComplaintStatus,
} from '../../model/transactioncomplaints';

export class UpdateTransactionComplaintDto {
  @IsOptional()
  @IsEnum(TransactionComplaintStatus)
  status?: TransactionComplaintStatus;

  @IsOptional()
  @IsEnum(TransactionComplaintResolution)
  resolution?: TransactionComplaintResolution;

  @IsOptional()
  @IsMongoId()
  assigned_to?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  admin_notes?: string;
}
