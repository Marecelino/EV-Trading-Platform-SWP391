import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { TransactionStatus } from '../../model/transactions';

export class FilterTransactionsDto {
  @ApiPropertyOptional({ description: 'Filter by buyer id' })
  @IsOptional()
  @IsMongoId()
  buyer_id?: string;

  @ApiPropertyOptional({ description: 'Filter by seller id' })
  @IsOptional()
  @IsMongoId()
  seller_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: TransactionStatus,
  })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @ApiPropertyOptional({
    description: 'Filter by payment method (plain text match)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  payment_method?: string;

  @ApiPropertyOptional({
    description: 'Free text search across reference and notes',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ description: 'Page size', default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;
}
