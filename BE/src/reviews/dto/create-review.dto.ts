import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsMongoId,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateReviewDto {
  @IsMongoId()
  @ApiProperty({
    example: '64b7f3a1d2f1c9a0b1e2f3c4',
    description: 'User id of the reviewee (Mongo ObjectId)',
  })
  reviewee_id: string;

  @IsMongoId()
  @ApiProperty({
    example: '64b7f4b2d2f1c9a0b1e2f3c5',
    description: 'Related transaction id (Mongo ObjectId)',
  })
  transaction_id: string;

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(5)
  @ApiProperty({ example: 5, description: 'Rating from 1 to 5' })
  rating: number;

  @IsString()
  @MinLength(10)
  @MaxLength(500)
  @ApiProperty({
    example: 'Người bán rất chuyên nghiệp, giao hàng đúng hạn và mô tả chính xác. Rất hài lòng!',
    description: 'Text comment, between 10 and 500 characters',
  })
  comment: string;
}
