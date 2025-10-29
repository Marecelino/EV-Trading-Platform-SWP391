import { Type } from 'class-transformer';
import {
  IsArray,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Min,
  Max,
  IsEnum,
  IsNotEmpty,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleCondition, CategoryEnum } from '../../model/listings';

export class CreateEVAuctionDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  seller_id: string;

  @ApiProperty({ example: 'Tesla' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  brand_name: string;

  @ApiProperty({
    description: 'Start time of the auction in ISO 8601 format',
    example: '2025-10-25T10:00:00Z',
    type: 'string',
    format: 'date-time',
  })
  @IsDateString()
  @IsNotEmpty()
  start_time!: string;

  @ApiProperty({
    description: 'End time of the auction in ISO 8601 format',
    example: '2025-10-27T18:00:00Z',
    type: 'string',
    format: 'date-time',
  })
  @IsDateString()
  @IsNotEmpty()
  end_time!: string;

  @ApiProperty({
    description: 'Starting price for the auction in VND',
    example: 800000000,
    type: 'number',
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  starting_price!: number;

  @ApiProperty({
    description: 'Minimum increment for each bid in VND',
    example: 5000000,
    type: 'number',
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  min_increment!: number;

  @ApiProperty({
    description: 'Optional buy now price - instant win price in VND',
    example: 1200000000,
    type: 'number',
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  buy_now_price?: number;

  @ApiProperty({ example: 'Nice EV', minLength: 5, maxLength: 100 })
  @IsString()
  @MinLength(5)
  @MaxLength(100)
  title: string;

  @ApiProperty({
    example: 'Detailed description',
    minLength: 20,
    maxLength: 2000,
  })
  @IsString()
  @MinLength(20)
  @MaxLength(2000)
  description: string;

  @ApiProperty({ enum: VehicleCondition })
  @IsEnum(VehicleCondition)
  condition: VehicleCondition;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  images: string[];

  @ApiPropertyOptional({ example: 2022 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1990)
  @Max(new Date().getFullYear() + 2)
  year?: number;

  @ApiPropertyOptional({ example: 15000 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  mileage?: number;

  @ApiPropertyOptional({ example: 75 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  battery_capacity?: number;

  @ApiPropertyOptional({ example: 450 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  range?: number;

  @ApiPropertyOptional({ example: 'Ho Chi Minh City' })
  @IsOptional()
  @IsString()
  location?: string;
}
