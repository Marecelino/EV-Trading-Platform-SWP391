import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Listing, ListingSchema } from '../model/listings';
import {
  PriceSuggestion,
  PriceSuggestionSchema,
} from '../model/pricesuggestions';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';
import { EVListingsService } from './ev-listings.service';
import { BatteryListingsService } from './battery-listings.service';
import { Brand, BrandSchema } from 'src/model/brands';
import { EVDetail, EVDetailSchema } from 'src/model/evdetails';
import { BatteryDetail, BatteryDetailSchema } from 'src/model/batterydetails';
import { Favorite, FavoriteSchema } from 'src/model/favorites';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Listing.name, schema: ListingSchema },
      { name: PriceSuggestion.name, schema: PriceSuggestionSchema },

      { name: Brand.name, schema: BrandSchema },
      { name: EVDetail.name, schema: EVDetailSchema },
      { name: BatteryDetail.name, schema: BatteryDetailSchema },
      { name: Favorite.name, schema: FavoriteSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [ListingsController],
  providers: [ListingsService, EVListingsService, BatteryListingsService],
  exports: [ListingsService, EVListingsService, BatteryListingsService],
})
export class ListingsModule { }
