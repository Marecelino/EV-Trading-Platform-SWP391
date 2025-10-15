import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateModelDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  year_start?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  year_end?: number;

  @IsOptional()
  @IsString()
  body_type?: string;

  @IsOptional()
  @IsString()
  drivetrain?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  battery_capacity?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  range?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  charging_time?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  motor_power?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  top_speed?: number;
}