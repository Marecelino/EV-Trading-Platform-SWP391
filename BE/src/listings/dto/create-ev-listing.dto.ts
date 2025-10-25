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
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleCondition, CategoryEnum } from '../../model/listings';

export class CreateEVListingDto {
    @ApiProperty({ example: '507f1f77bcf86cd799439011' })
    @IsMongoId()
    seller_id: string;

    @ApiProperty({ example: 'Tesla' })
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    brand_name: string;

    @ApiProperty({ example: 'Nice EV', minLength: 5, maxLength: 100 })
    @IsString()
    @MinLength(5)
    @MaxLength(100)
    title: string;

    @ApiProperty({ example: 'Detailed description', minLength: 20, maxLength: 2000 })
    @IsString()
    @MinLength(20)
    @MaxLength(2000)
    description: string;

    @ApiProperty({ example: 30000 })
    @IsNumber()
    @Type(() => Number)
    price: number;

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
