import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { TransactionStatus } from '../../model/transactions';

export class ReportsSummaryQueryDto {
  @ApiPropertyOptional({
    description: 'ISO date (inclusive) to start the report window',
    example: '2025-01-01',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    description: 'ISO date (inclusive) to end the report window',
    example: '2025-01-31',
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
