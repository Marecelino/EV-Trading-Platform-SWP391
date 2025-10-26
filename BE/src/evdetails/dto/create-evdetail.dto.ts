import { Type } from 'class-transformer';
import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEVDetailDto {
  @ApiProperty({
    description: 'ID của listing xe điện',
    example: '507f1f77bcf86cd799439011',
    pattern: '^[0-9a-fA-F]{24}$',
  })
  @IsMongoId()
  listing_id: string;

  @ApiProperty({
    description: 'Năm sản xuất xe',
    example: 2023,
    minimum: 1990,
    maximum: new Date().getFullYear() + 2,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(1990)
  @Max(new Date().getFullYear() + 2)
  year: number;

  @ApiProperty({
    description: 'Số km đã đi',
    example: 15000,
    minimum: 0,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  mileage_km: number;

  @ApiProperty({
    description: 'Dung lượng pin (kWh)',
    example: 75.5,
    minimum: 0,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  battery_capacity_kwh: number;

  @ApiProperty({
    description: 'Quãng đường di chuyển (km)',
    example: 450,
    minimum: 0,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  range_km: number;

  @ApiProperty({
    description: 'Tình trạng xe',
    example: 'Mới',
    enum: ['Mới', 'Đã qua sử dụng', 'Cần sửa chữa'],
  })
  @IsString()
  @IsNotEmpty()
  condition: string;

  @ApiProperty({
    description: 'Màu sắc xe',
    example: 'Trắng',
    enum: ['Trắng', 'Đen', 'Xám', 'Xanh', 'Đỏ', 'Bạc', 'Khác'],
  })
  @IsString()
  @IsNotEmpty()
  color: string;

  @ApiProperty({
    description: 'Số chỗ ngồi',
    example: 5,
    minimum: 1,
    maximum: 9,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(9)
  seats: number;

  @ApiProperty({
    description: 'Loại dẫn động',
    example: 'AWD',
    enum: ['FWD', 'RWD', 'AWD'],
  })
  @IsString()
  @IsNotEmpty()
  drive_type: string;

  @ApiPropertyOptional({
    description: 'Thời gian sạc AC (giờ)',
    example: 8.5,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  charging_time_ac?: number;

  @ApiPropertyOptional({
    description: 'Thời gian sạc DC (giờ)',
    example: 1.2,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  charging_time_dc?: number;

  @ApiPropertyOptional({
    description: 'Công suất động cơ (kW)',
    example: 250,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  motor_power?: number;

  @ApiPropertyOptional({
    description: 'Tốc độ tối đa (km/h)',
    example: 200,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  top_speed?: number;

  @ApiPropertyOptional({
    description: 'Tăng tốc 0-100km/h (giây)',
    example: 5.8,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  acceleration_0_100?: number;

  @ApiPropertyOptional({
    description: 'Loại cổng sạc',
    example: 'Type 2',
    enum: ['Type 1', 'Type 2', 'CCS', 'CHAdeMO', 'Tesla Supercharger'],
  })
  @IsOptional()
  @IsString()
  charging_port_type?: string;

  @ApiPropertyOptional({
    description: 'Tính năng đặc biệt',
    example: ['Autopilot', 'Sưởi ghế', 'Camera 360°', 'Màn hình cảm ứng'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];
}
