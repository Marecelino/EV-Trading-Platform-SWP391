import { Type } from 'class-transformer';
import { IsBoolean, IsMongoId, IsOptional, IsString, Min } from 'class-validator';

export class FilterModelsDto {
  @IsOptional()
  @IsMongoId()
  brand_id?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  body_type?: string;

  @IsOptional()
  @IsString()
  drivetrain?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_active?: boolean;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number;
}