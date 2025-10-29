import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsDateString,
  IsOptional,
  IsBoolean,
  IsString,
  Min,
  Max,
} from 'class-validator';

export class CreateCommissionConfigDto {
  @ApiProperty({
    description: 'Phần trăm hoa hồng',
    example: 5.5,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage: number;

  @ApiProperty({
    description: 'Phí tối thiểu (VND)',
    example: 10000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  min_fee: number;

  @ApiProperty({
    description: 'Phí tối đa (VND)',
    example: 1000000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  max_fee: number;

  @ApiProperty({
    description: 'Ngày có hiệu lực',
    example: '2024-10-15T00:00:00.000Z',
  })
  @IsDateString()
  effective_from: string;

  @ApiProperty({
    description: 'Ngày hết hiệu lực',
    example: '2024-12-31T23:59:59.999Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  effective_to?: string;

  @ApiProperty({
    description: 'Trạng thái hoạt động',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiProperty({
    description: 'Mô tả về config',
    example: 'Cấu hình hoa hồng cho giao dịch pin xe điện',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Admin tạo config',
    example: 'admin001',
    required: false,
  })
  @IsOptional()
  @IsString()
  created_by?: string;
}
