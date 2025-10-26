import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { CommissionStatus } from '../../model/commissions';

export class CreateCommissionDto {
  @ApiProperty({
    description: 'ID của giao dịch',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  transaction_id: string;

  @ApiProperty({
    description: 'ID của cấu hình hoa hồng',
    example: '507f1f77bcf86cd799439012',
  })
  @IsString()
  config_id: string;

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
    description: 'Số tiền hoa hồng (VND)',
    example: 500000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: 'Trạng thái hoa hồng',
    enum: CommissionStatus,
    example: CommissionStatus.PENDING,
    default: CommissionStatus.PENDING,
    required: false,
  })
  @IsOptional()
  @IsEnum(CommissionStatus)
  status?: CommissionStatus;
}
