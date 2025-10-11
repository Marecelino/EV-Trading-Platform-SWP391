import { Type } from 'class-transformer';
import { IsEnum, IsMongoId, IsOptional, IsString, Min } from 'class-validator';
import { TransactionStatus, PaymentMethod } from '../../model/transactions';

export class FilterTransactionsDto {
  @IsOptional()
  @IsMongoId()
  buyer_id?: string;

  @IsOptional()
  @IsMongoId()
  seller_id?: string;

  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @IsOptional()
  @IsEnum(PaymentMethod)
  payment_method?: PaymentMethod;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number;
}
