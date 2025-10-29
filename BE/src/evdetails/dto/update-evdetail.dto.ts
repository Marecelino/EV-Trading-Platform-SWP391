import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateEVDetailDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1990)
  @Max(new Date().getFullYear() + 2)
  year?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  mileage_km?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  battery_capacity_kwh?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  range_km?: number;

  @IsOptional()
  @IsString()
  condition?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(9)
  seats?: number;

  @IsOptional()
  @IsString()
  drive_type?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  charging_time_ac?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  charging_time_dc?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  motor_power?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  top_speed?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  acceleration_0_100?: number;

  @IsOptional()
  @IsString()
  charging_port_type?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];
}
