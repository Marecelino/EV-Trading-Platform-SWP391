import { IsEnum } from 'class-validator';
import { AuctionStatus } from '../../model/auctions';

export class UpdateAuctionStatusDto {
  @IsEnum(AuctionStatus)
  status: AuctionStatus;
}
