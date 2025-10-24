import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuctionsController } from './auctions.controller';
import { AuctionsService } from './auctions.service';
import { Auction, AuctionSchema } from '../model/auctions';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Auction.name, schema: AuctionSchema },
    ]),
  ],
  controllers: [AuctionsController],
  providers: [AuctionsService],
  exports: [AuctionsService],
})
export class AuctionsModule {}