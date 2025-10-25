import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuctionsController } from './auctions.controller';
import { AuctionsService } from './auctions.service';
import { Auction, AuctionSchema } from '../model/auctions';
import { EVAuctionService } from './ev-auction.service';
import { BatteryAuctionService } from './battery-auction.service';
import { Listing, ListingSchema } from '../model/listings';
import { Brand, BrandSchema } from '../model/brands';
import { EVDetail, EVDetailSchema } from '../model/evdetails';
import { BatteryDetail, BatteryDetailSchema } from '../model/batterydetails';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Auction.name, schema: AuctionSchema },
      { name: Listing.name, schema: ListingSchema },
      { name: Brand.name, schema: BrandSchema },
      { name: EVDetail.name, schema: EVDetailSchema },
      { name: BatteryDetail.name, schema: BatteryDetailSchema },
    ]),
  ],
  controllers: [AuctionsController],
  providers: [AuctionsService, EVAuctionService, BatteryAuctionService],
  exports: [AuctionsService, EVAuctionService, BatteryAuctionService],
})
export class AuctionsModule { }