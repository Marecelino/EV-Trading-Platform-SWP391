import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { TransactionStatus } from '../../model/transactions';

export class UpdateTransactionStatusDto {
  @ApiPropertyOptional({
    description: 'New status for the transaction',
    enum: TransactionStatus,
  })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @ApiPropertyOptional({
    description: 'Optional note to accompany the status change',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({
    description: 'Contract associated to the transaction if available',
  })
  @IsOptional()
  @IsMongoId()
  contract_id?: string;
}
