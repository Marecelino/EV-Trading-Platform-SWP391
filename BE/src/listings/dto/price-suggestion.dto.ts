import { Type } from 'class-transformer';
import { IsEnum, IsMongoId, IsNumber, IsOptional, Min } from 'class-validator';
import { VehicleCondition } from '../../model/listings';

export class PriceSuggestionDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  mileage?: number;

  @IsOptional()
  @IsEnum(VehicleCondition)
  condition?: VehicleCondition;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  battery_capacity?: number;
}
