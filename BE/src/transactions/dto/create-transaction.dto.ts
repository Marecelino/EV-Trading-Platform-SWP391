import { Type } from 'class-transformer';
import {
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PaymentMethod } from '../../model/transactions';

export class CreateTransactionDto {
  @IsMongoId()
  listing_id: string;

  @IsMongoId()
  buyer_id: string;

  @IsMongoId()
  seller_id: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  price: number;

  @IsOptional()
  @IsEnum(PaymentMethod)
  payment_method?: PaymentMethod;

  @IsOptional()
  @IsString()
  payment_reference?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  meeting_location?: string;

  @IsOptional()
  @IsString()
  meeting_date?: string;
}
