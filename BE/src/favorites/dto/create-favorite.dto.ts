import { IsMongoId } from 'class-validator';

export class CreateFavoriteDto {
  @IsMongoId()
  listing_id: string;

  @IsMongoId()
  user_id: string;
}
