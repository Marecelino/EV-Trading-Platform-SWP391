import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateModelDto {
  @ApiProperty({
    description: 'ID của thương hiệu xe',
    example: '507f1f77bcf86cd799439011',
    pattern: '^[0-9a-fA-F]{24}$'
  })
  @IsMongoId()
  brand_id: string;

  @ApiProperty({
    description: 'Tên model xe',
    example: 'Model S',
    minLength: 1,
    maxLength: 100
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Mô tả chi tiết về model',
    example: 'Sedan hạng sang với công nghệ tự lái tiên tiến',
    maxLength: 1000
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Năm bắt đầu sản xuất',
    example: 2020,
    minimum: 1990
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  year_start?: number;

  @ApiPropertyOptional({
    description: 'Năm kết thúc sản xuất (null nếu vẫn đang sản xuất)',
    example: 2024,
    minimum: 1990
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  year_end?: number;

  @ApiPropertyOptional({
    description: 'Kiểu dáng xe',
    example: 'Sedan',
    enum: ['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Wagon', 'Pickup', 'Van', 'Convertible']
  })
  @IsOptional()
  @IsString()
  body_type?: string;

  @ApiPropertyOptional({
    description: 'Hệ thống dẫn động',
    example: 'AWD',
    enum: ['FWD', 'RWD', 'AWD', '4WD']
  })
  @IsOptional()
  @IsString()
  drivetrain?: string;

  @ApiPropertyOptional({
    description: 'Trạng thái hoạt động của model',
    example: true,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({
    description: 'Dung lượng pin (kWh)',
    example: 100,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  battery_capacity?: number;

  @ApiPropertyOptional({
    description: 'Phạm vi hoạt động (km)',
    example: 500,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  range?: number;

  @ApiPropertyOptional({
    description: 'Thời gian sạc nhanh (giờ)',
    example: 1.5,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  charging_time?: number;

  @ApiPropertyOptional({
    description: 'Công suất động cơ (kW)',
    example: 300,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  motor_power?: number;

  @ApiPropertyOptional({
    description: 'Tốc độ tối đa (km/h)',
    example: 250,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  top_speed?: number;
}