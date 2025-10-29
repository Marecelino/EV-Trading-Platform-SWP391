import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsUrl,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateBrandDto {
  @ApiProperty({
    description: 'Tên thương hiệu',
    example: 'Tesla',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @ApiProperty({
    description: 'Mô tả thương hiệu',
    example: 'Thương hiệu xe điện hàng đầu thế giới',
    maxLength: 500,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'URL logo thương hiệu',
    example: 'https://example.com/tesla-logo.png',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  logo_url?: string;

  @ApiProperty({
    description: 'Website chính thức',
    example: 'https://www.tesla.com',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiProperty({
    description: 'Quốc gia',
    example: 'United States',
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

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
    description: 'Số lượng listing',
    example: 0,
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  listing_count?: number;
}
