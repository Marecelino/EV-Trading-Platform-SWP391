import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ListingStatus, VehicleCondition } from '../../model/listings';

export class CreateListingDto {
  @IsMongoId()
  seller_id: string;

  @IsMongoId()
  brand_id: string;

  @IsMongoId()
  model_id: string;

  @IsMongoId()
  category_id: string;

  @IsString()
  @MinLength(5)
  @MaxLength(100)
  title: string;

  @IsString()
  @MinLength(20)
  @MaxLength(2000)
  description: string;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  price: number;

  @IsEnum(VehicleCondition)
  condition: VehicleCondition;

  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus;

  @IsOptional()
  @IsBoolean()
  is_verified?: boolean;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  images: string[];

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  year?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  mileage?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  battery_capacity?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  range?: number;

  @IsOptional()
  @IsString()
  expiry_date?: string;
}
