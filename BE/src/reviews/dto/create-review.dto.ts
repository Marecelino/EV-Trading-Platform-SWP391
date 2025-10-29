import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateReviewDto {
  @IsMongoId()
  reviewer_id: string;

  @IsMongoId()
  reviewee_id: string;

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @MinLength(10)
  @MaxLength(500)
  comment: string;

  @IsMongoId()
  transaction_id: string;

  @IsOptional()
  @IsBoolean()
  is_visible?: boolean;
}
