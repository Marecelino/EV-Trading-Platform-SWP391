import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdatePriceSuggestionDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  suggested_price?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(1)
  model_confidence?: number;

  @IsOptional()
  @IsString()
  model_name?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}