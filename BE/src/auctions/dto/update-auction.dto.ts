import { IsOptional, IsString, IsDateString, IsNumber, Min } from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateAuctionDto {
  @ApiProperty({
    description: 'MongoDB ObjectId of the listing (rarely updated)',
    example: '6515a8b5e7c8a5b8e4e6b1c1',
    type: 'string',
    required: false
  })
  @IsOptional()
  @IsString()
  listing_id?: string;

  @ApiProperty({
    description: 'MongoDB ObjectId of the seller (rarely updated)',
    example: '507f1f77bcf86cd799439011',
    type: 'string',
    required: false
  })
  @IsOptional()
  @IsString()
  seller_id?: string;

  @ApiProperty({
    description: 'Updated start time in ISO 8601 format',
    example: '2025-10-25T12:00:00Z',
    type: 'string',
    format: 'date-time',
    required: false
  })
  @IsOptional()
  @IsDateString()
  start_time?: string;

  @ApiProperty({
    description: 'Updated end time in ISO 8601 format - commonly used to extend auctions',
    example: '2025-10-28T18:00:00Z',
    type: 'string',
    format: 'date-time',
    required: false
  })
  @IsOptional()
  @IsDateString()
  end_time?: string;

  @ApiProperty({
    description: 'Updated starting price in VND (only if no bids placed)',
    example: 900000000,
    type: 'number',
    minimum: 0,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  starting_price?: number;

  @ApiProperty({
    description: 'Updated minimum increment for bids in VND',
    example: 10000000,
    type: 'number',
    minimum: 0,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  min_increment?: number;

  @ApiProperty({
    description: 'Updated buy now price in VND - can be removed by setting to null',
    example: 1500000000,
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
