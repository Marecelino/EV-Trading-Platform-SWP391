import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsString, IsOptional, IsDateString, Min, Max } from 'class-validator';

export class CreateBatteryDetailDto {
  @ApiProperty({
    description: 'ID của listing',
    example: '507f1f77bcf86cd799439011'
  })
  @IsString()
  listing_id: string;


  @ApiProperty({
    description: 'Dung lượng pin (kWh)',
    example: 75.5,
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  capacity_kwh: number;

  @ApiProperty({
    description: 'Tình trạng sức khỏe pin (%)',
    example: 85,
    minimum: 0,
    maximum: 100
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  soh_percent: number;

  @ApiProperty({
    description: 'Số chu kỳ sạc',
    example: 450,
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  cycle_count: number;

  @ApiProperty({
    description: 'Điện áp (V)',
    example: 400,
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  voltage_v: number;

  @ApiProperty({
    description: 'Trọng lượng (kg)',
    example: 450.5,
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  weight_kg: number;

  @ApiProperty({
    description: 'Xuất xứ',
    example: 'China'
  })
  @IsString()
  origin: string;

  @ApiProperty({
    description: 'Số tháng bảo hành còn lại',
    example: 24,
    required: false
  })
  @IsOptional()
  @IsNumber()
  warranty_remaining_months?: number;

  @ApiProperty({
    description: 'Ngày kiểm tra sức khỏe cuối cùng',
    example: '2024-10-15T00:00:00.000Z',
    required: false
  })
  @IsOptional()
  @IsDateString()
  last_health_check?: string;

  @ApiProperty({
    description: 'Nhiệt độ tối thiểu (°C)',
    example: -20,
    required: false
  })
  @IsOptional()
  @IsNumber()
  temperature_range_min?: number;

  @ApiProperty({
    description: 'Nhiệt độ tối đa (°C)',
    example: 60,
    required: false
  })
  @IsOptional()
  @IsNumber()
  temperature_range_max?: number;

  @ApiProperty({
    description: 'Chu kỳ sạc bảo hành',
    example: 3000,
    required: false
  })
  @IsOptional()
  @IsNumber()
  charging_cycles_warranty?: number;

  @ApiProperty({
    description: 'Tỷ lệ suy giảm hàng năm (%)',
    example: 2.5,
    required: false
  })
  @IsOptional()
  @IsNumber()
  degradation_rate_annual?: number;
}