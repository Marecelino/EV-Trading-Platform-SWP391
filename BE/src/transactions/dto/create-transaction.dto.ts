import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { TransactionStatus } from '../../model/transactions';

export class CreateTransactionDto {
  @ApiProperty({ description: 'Listing associated with the transaction' })
  @IsMongoId()
  listing_id!: string;

  @ApiProperty({ description: 'Buyer initiating the transaction' })
  @IsMongoId()
  buyer_id!: string;

  @ApiProperty({ description: 'Seller offering the listing' })
  @IsMongoId()
  seller_id!: string;

  @ApiProperty({ description: 'Final agreed upon price', example: 150000000 })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiPropertyOptional({
    description: 'Payment method used for the transaction',
  })
  @IsOptional()
  @IsString()
  payment_method?: string;

  @ApiPropertyOptional({
    description: 'External reference to correlate payment provider information',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  payment_reference?: string;

  @ApiPropertyOptional({
    description: 'Scheduled meeting date (if any) between buyer and seller',
  })
  @IsOptional()
  @IsDateString()
  meeting_date?: string;

  @ApiPropertyOptional({ description: 'Internal note from the platform' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({
    description: 'Optional initial status for the transaction',
    enum: TransactionStatus,
  })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @ApiPropertyOptional({
    description:
      'Commission rate applied to the transaction (percentage based value, e.g., 0.05 for 5%)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  commission_rate?: number;

  @ApiPropertyOptional({
    description: 'Calculated platform fee collected by the marketplace',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  platform_fee?: number;

  @ApiPropertyOptional({
    description: 'Net amount to be transferred to the seller after fees',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  seller_payout?: number;
}
