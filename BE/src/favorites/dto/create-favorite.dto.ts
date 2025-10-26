import { IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFavoriteDto {
  @ApiProperty({
    description: 'ID của listing xe điện',
    example: '507f1f77bcf86cd799439011',
    pattern: '^[0-9a-fA-F]{24}$'
  })
  @IsMongoId()
  listing_id: string;

  @ApiProperty({
    description: 'ID của người dùng',
    example: '507f1f77bcf86cd799439012',
    pattern: '^[0-9a-fA-F]{24}$'
  })
  @IsMongoId()
  user_id: string;
}
