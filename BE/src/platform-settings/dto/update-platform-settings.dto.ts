import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class UpdatePlatformSettingsDto {
  @ApiProperty({
    description: 'Phí đăng tin (VND)',
    example: 15000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  listing_fee_amount?: number;

  @ApiProperty({
    description: 'Tỷ lệ hoa hồng mặc định (0.02 = 2%)',
    example: 0.02,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  commission_default_rate?: number;

  @ApiProperty({
    description: 'Ngưỡng giá trị để tính hoa hồng (VND)',
    example: 100000000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  commission_threshold?: number;
}

