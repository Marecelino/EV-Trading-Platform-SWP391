import {
  IsBoolean,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
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
  @Min(1)
  rating: number;

  @IsString()
  @MinLength(10)
  @MaxLength(500)
  comment: string;

  @IsOptional()
  @IsMongoId()
  transaction_id?: string;

  @IsOptional()
  @IsBoolean()
  is_visible?: boolean;
}
