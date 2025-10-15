import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber, IsUrl, MinLength, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Tên danh mục',
    example: 'Pin xe điện',
    minLength: 2,
    maxLength: 50
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @ApiProperty({
    description: 'Mô tả danh mục',
    example: 'Danh mục cho các loại pin xe điện và phụ kiện',
    maxLength: 500,
    required: false
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'URL icon danh mục',
    example: 'https://example.com/battery-icon.png',
    required: false
  })
  @IsOptional()
  @IsUrl()
  icon_url?: string;

  @ApiProperty({
    description: 'ID danh mục cha',
    example: '507f1f77bcf86cd799439011',
    required: false
  })
  @IsOptional()
  @IsString()
  parent_category?: string;

  @ApiProperty({
    description: 'Trạng thái hoạt động',
    example: true,
    default: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiProperty({
    description: 'Thứ tự sắp xếp',
    example: 0,
    default: 0,
    required: false
  })
  @IsOptional()
  @IsNumber()
  sort_order?: number;

  @ApiProperty({
    description: 'Số lượng listing',
    example: 0,
    default: 0,
    required: false
  })
  @IsOptional()
  @IsNumber()
  listing_count?: number;
}