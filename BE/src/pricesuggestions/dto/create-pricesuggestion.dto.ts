import { Type } from 'class-transformer';
import {
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePriceSuggestionDto {
  @ApiProperty({
    description: 'ID của listing cần gợi ý giá',
    example: '507f1f77bcf86cd799439011',
    pattern: '^[0-9a-fA-F]{24}$',
  })
  @IsMongoId()
  listing_id: string;

  @ApiProperty({
    description: 'Giá được gợi ý (VND)',
    example: 1500000000,
    minimum: 0,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  suggested_price: number;

  @ApiProperty({
    description: 'Độ tin cậy của model AI (0-1)',
    example: 0.85,
    minimum: 0,
    maximum: 1,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(1)
  model_confidence: number;

  @ApiPropertyOptional({
    description: 'Tên model AI được sử dụng',
    example: 'EV_Price_Predictor_v2.1',
    minLength: 1,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  model_name?: string;

  @ApiPropertyOptional({
    description: 'Ghi chú về gợi ý giá',
    example: 'Giá được tính dựa trên 150 xe tương tự đã bán trong 6 tháng qua',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
