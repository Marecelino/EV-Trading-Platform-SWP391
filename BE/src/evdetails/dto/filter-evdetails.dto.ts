import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class FilterEVDetailsDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minYear?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxYear?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  maxMileage?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  minBatteryCapacity?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  minRange?: number;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  driveType?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  seats?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number;
}