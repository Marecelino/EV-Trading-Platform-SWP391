import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { TransactionStatus } from '../../model/transactions';

type TrendGranularity = 'day' | 'week' | 'month';

export class ReportsTrendQueryDto {
  @ApiPropertyOptional({
    enum: ['day', 'week', 'month'],
    description: 'Aggregation bucket size',
    example: 'month',
    default: 'month',
  })
  @IsOptional()
  @IsEnum(['day', 'week', 'month'], {
    message: 'granularity must be one of day, week, month',
  })
  granularity?: TrendGranularity;

  @ApiPropertyOptional({
    description: 'Limit number of returned periods (1-180)',
    example: 12,
    default: 12,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(180)
  limit?: number;

  @ApiPropertyOptional({
    description: 'ISO date (inclusive) to start the report window',
    example: '2025-01-01',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    description: 'ISO date (inclusive) to end the report window',
    example: '2025-03-31',
  })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({
    enum: TransactionStatus,
    description: 'Filter by transaction status',
    example: TransactionStatus.COMPLETED,
  })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @ApiPropertyOptional({
    description: 'Filter by buyer id',
    example: '671234567890abcdef123456',
  })
  @IsOptional()
  @IsMongoId()
  buyerId?: string;

  @ApiPropertyOptional({
    description: 'Filter by seller id',
    example: '671234567890abcdef654321',
  })
  @IsOptional()
  @IsMongoId()
  sellerId?: string;
}
