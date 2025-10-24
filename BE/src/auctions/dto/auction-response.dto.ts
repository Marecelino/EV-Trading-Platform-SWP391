import { Type } from "class-transformer";
import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, IsDateString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class BidDto {
  @ApiProperty({
    description: 'User who placed the bid - can be ObjectId string or populated user object',
    example: {
      _id: '507f1f77bcf86cd799439013',
      name: 'Alice Johnson',
      email: 'alice@example.com'
    }
  })
  @IsString()
  user_id!: any; // can be string (id) or populated object

  @ApiProperty({
    description: 'Bid amount in VND',
    example: 925000000,
    type: 'number'
  })
  @IsNumber()
  amount!: number;

  @ApiProperty({
    description: 'When the bid was placed',
    example: '2025-10-24T14:30:00.000Z',
    type: 'string',
    format: 'date-time'
  })
  @IsDateString()
  created_at!: string;
}

export class AuctionResponseDto {
  @ApiProperty({
    description: 'Auction MongoDB ObjectId',
    example: '672f8b5e7c8a5b8e4e6b1c2a',
    type: 'string'
  })
  @IsString()
  _id!: string;

  @ApiProperty({
    description: 'Associated listing - can be ObjectId string or populated listing object',
    example: {
      _id: '6515a8b5e7c8a5b8e4e6b1c1',
      title: 'VinFast VF8 Plus 2024',
      description: 'Premium electric SUV...',
      price: 1200000000,
      images: ['img1.jpg', 'img2.jpg']
    }
  })
  @IsOptional()
  listing_id!: any; // can be string id or populated listing

  @ApiProperty({
    description: 'Seller information - can be ObjectId string or populated user object',
    example: {
      _id: '507f1f77bcf86cd799439011',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+84901234567'
    }
  })
  @IsOptional()
  seller_id!: any; // can be string id or populated user

  @ApiProperty({
    description: 'Auction start time',
    example: '2025-10-25T10:00:00.000Z',
    type: 'string',
    format: 'date-time'
  })
  @IsDateString()
  start_time!: string;

  @ApiProperty({
    description: 'Auction end time',
    example: '2025-10-27T18:00:00.000Z',
    type: 'string',
    format: 'date-time'
  })
  @IsDateString()
  end_time!: string;

  @ApiProperty({
    description: 'Starting price of the auction in VND',
    example: 800000000,
    type: 'number'
  })
  @IsNumber()
  starting_price!: number;

  @ApiProperty({
    description: 'Current highest bid amount in VND',
    example: 925000000,
    type: 'number'
  })
  @IsNumber()
  current_price!: number;

  @ApiProperty({
    description: 'Minimum increment for new bids in VND',
    example: 5000000,
    type: 'number'
  })
  @IsNumber()
  min_increment!: number;

  @ApiProperty({
    description: 'Buy now price - instant win amount in VND',
    example: 1200000000,
    type: 'number',
    required: false
  })
  @IsOptional()
  @IsNumber()
  buy_now_price?: number;

  @ApiProperty({
    description: 'Current auction status',
    example: 'live',
    enum: ['scheduled', 'live', 'ended', 'cancelled'],
    type: 'string'
  })
  @IsString()
  status!: string;

  @ApiProperty({
    description: 'Array of all bids placed on this auction, ordered by most recent first',
    type: [BidDto],
    example: [
      {
        user_id: {
          _id: '507f1f77bcf86cd799439013',
          name: 'Alice Johnson'
        },
        amount: 925000000,
        created_at: '2025-10-24T14:30:00.000Z'
      },
      {
        user_id: {
          _id: '507f1f77bcf86cd799439012',
          name: 'Jane Smith'
        },
        amount: 900000000,
        created_at: '2025-10-24T12:15:00.000Z'
      }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BidDto)
  bids!: BidDto[];

  @ApiProperty({
    description: 'When the auction was created',
    example: '2025-10-24T08:00:00.000Z',
    type: 'string',
    format: 'date-time'
  })
  @IsDateString()
  created_at!: string;

  @ApiProperty({
    description: 'When the auction was last updated',
    example: '2025-10-24T14:30:00.000Z',
    type: 'string',
    format: 'date-time'
  })
  @IsDateString()
  updated_at!: string;
}
