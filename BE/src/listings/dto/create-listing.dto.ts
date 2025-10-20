// ...existing code...
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
import { ApiProperty } from '@nestjs/swagger';
import { ListingStatus, VehicleCondition } from '../../model/listings';

export class CreateListingDto {
  @ApiProperty({
    description: 'MongoDB ObjectId of the user creating the listing',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId()
  seller_id: string;

  @ApiProperty({
    description: 'Name of the vehicle brand',
    example: 'Tesla',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  brand_name: string;

  @ApiProperty({
    description: 'Name of the vehicle model',
    example: 'Model 3 Long Range',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  model_name: string;

  @ApiProperty({
    description: 'Name of the listing category',
    example: 'Ô tô điện',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  category_name: string;

  @ApiProperty({
    description: 'Title of the listing',
    example: 'Tesla Model 3 Long Range - Excellent Condition',
    minLength: 5,
    maxLength: 100,
  })
  @IsString()
  @MinLength(5)
  @MaxLength(100)
  title: string;

  @ApiProperty({
    description: 'Detailed description of the vehicle',
    example: 'Well-maintained Tesla Model 3 with all premium features. Single owner, regular service history, excellent battery health.',
    minLength: 20,
    maxLength: 2000,
  })
  @IsString()
  @MinLength(20)
  @MaxLength(2000)
  description: string;

  @ApiProperty({
    description: 'Price of the vehicle in USD',
    example: 45000,
    minimum: 1,
  })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  price: number;

  @ApiProperty({
    description: 'Current condition of the vehicle',
    enum: VehicleCondition,
    example: VehicleCondition.EXCELLENT,
  })
  @IsEnum(VehicleCondition)
  condition: VehicleCondition;

  @ApiProperty({
    description: 'Current status of the listing',
    enum: ListingStatus,
    example: ListingStatus.ACTIVE,
    required: false,
  })
  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus;

  @ApiProperty({
    description: 'Whether the listing has been verified by admin',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_verified?: boolean;

  @ApiProperty({
    description: 'Array of image URLs for the vehicle',
    example: [
      'https://example.com/images/car1_front.jpg',
      'https://example.com/images/car1_side.jpg',
      'https://example.com/images/car1_interior.jpg'
    ],
    minItems: 1,
    maxItems: 10,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  images: string[];

  @ApiProperty({
    description: 'Manufacturing year of the vehicle',
    example: 2022,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  year?: number;

  @ApiProperty({
    description: 'Total mileage of the vehicle in kilometers',
    example: 15000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  mileage?: number;

  @ApiProperty({
    description: 'Location where the vehicle is available',
    example: 'Ho Chi Minh City, Vietnam',
    required: false,
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({
    description: 'Battery capacity in kWh',
    example: 75,
    required: false,
  })
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
// ...existing code...