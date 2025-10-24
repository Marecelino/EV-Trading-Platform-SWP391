import { IsString, IsNotEmpty, IsDateString, IsNumber, Min, IsOptional } from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class CreateAuctionDto {
  @ApiProperty({
    description: 'MongoDB ObjectId of the listing to auction',
    example: '6515a8b5e7c8a5b8e4e6b1c1',
    type: 'string'
  })
  @IsString()
  @IsNotEmpty()
  listing_id!: string;

  @ApiProperty({
    description: 'MongoDB ObjectId of the seller creating the auction',
    example: '507f1f77bcf86cd799439011',
    type: 'string'
  })
  @IsString()
  @IsNotEmpty()
  seller_id!: string;

  @ApiProperty({
    description: 'Start time of the auction in ISO 8601 format',
    example: '2025-10-25T10:00:00Z',
    type: 'string',
    format: 'date-time'
  })
  @IsDateString()
  @IsNotEmpty()
  start_time!: string;

  @ApiProperty({
    description: 'End time of the auction in ISO 8601 format',
    example: '2025-10-27T18:00:00Z',
    type: 'string',
    format: 'date-time'
  })
  @IsDateString()
  @IsNotEmpty()
  end_time!: string;

  @ApiProperty({
    description: 'Starting price for the auction in VND',
    example: 800000000,
    type: 'number',
    minimum: 0
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  starting_price!: number;

  @ApiProperty({
    description: 'Minimum increment for each bid in VND',
    example: 5000000,
    type: 'number',
    minimum: 0
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  min_increment!: number;

  @ApiProperty({
    description: 'Optional buy now price - instant win price in VND',
    example: 1200000000,
    type: 'number',
    minimum: 0,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  buy_now_price?: number;
}
