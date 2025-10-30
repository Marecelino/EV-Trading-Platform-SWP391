import { IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFavoriteAuctionDto {
    @ApiProperty({
        description: 'ID of the auction to favorite',
        example: '507f1f77bcf86cd799439021',
        pattern: '^[0-9a-fA-F]{24}$',
    })
    @IsMongoId()
    auction_id: string;

    @ApiProperty({
        description: 'ID of the user who favorites',
        example: '507f1f77bcf86cd799439012',
        pattern: '^[0-9a-fA-F]{24}$',
    })
    @IsMongoId()
    user_id: string;
}
