import { Type } from 'class-transformer';
import { IsBoolean, IsMongoId, IsOptional, Max, Min } from 'class-validator';

export class FilterReviewsDto {
  @IsOptional()
  @IsMongoId()
  reviewer_id?: string;

  @IsOptional()
  @IsMongoId()
  reviewee_id?: string;

  @IsOptional()
  @IsMongoId()
  transaction_id?: string;

  @IsOptional()
  @IsBoolean()
  is_visible?: boolean;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(5)
  minRating?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(5)
  maxRating?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number;
}
