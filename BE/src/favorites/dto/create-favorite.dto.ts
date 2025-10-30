import { IsMongoId, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFavoriteDto {
  @ApiProperty({
    description: 'ID of the listing to favorite (optional if favoriting an auction)',
    example: '507f1f77bcf86cd799439011',
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  listing_id?: string;

  @ApiProperty({
    description: 'ID of the auction to favorite (optional if favoriting a listing)',
    example: '507f1f77bcf86cd799439021',
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  auction_id?: string;

  @ApiProperty({
    description: "ID of the user who favorites (required)",
    example: '507f1f77bcf86cd799439012',
  })
  @IsMongoId()
  user_id: string;
}
