import { IsEnum } from 'class-validator';
import { ListingStatus } from '../../model/listings';

export class UpdateListingStatusDto {
  @IsEnum(ListingStatus)
  status: ListingStatus;
}
