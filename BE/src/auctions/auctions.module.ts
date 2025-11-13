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
import { Favorite, FavoriteSchema } from '../model/favorites';
import { NotificationsModule } from '../notifications/notifications.module';
import { forwardRef } from '@nestjs/common';
import { PaymentModule } from 'src/payment/payment.module';
import { Payment, PaymentSchema } from 'src/payment/schemas/payment.schema';
import { User, UserSchema } from 'src/model/users.schema';
import { PlatformSettingsModule } from '../platform-settings/platform-settings.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Auction.name, schema: AuctionSchema },
      { name: Listing.name, schema: ListingSchema },
      { name: Brand.name, schema: BrandSchema },
      { name: EVDetail.name, schema: EVDetailSchema },
      { name: BatteryDetail.name, schema: BatteryDetailSchema },
      { name: Favorite.name, schema: FavoriteSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: User.name, schema: UserSchema },
    ]),
    NotificationsModule,
    forwardRef(() => PaymentModule),
    PlatformSettingsModule,
  ],
  controllers: [AuctionsController],
  providers: [AuctionsService, EVAuctionService, BatteryAuctionService],
  exports: [AuctionsService, EVAuctionService, BatteryAuctionService],
})
export class AuctionsModule { }
