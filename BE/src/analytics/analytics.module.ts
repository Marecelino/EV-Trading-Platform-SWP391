import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Listing, ListingSchema } from '../model/listings';
import { Transaction, TransactionSchema } from '../model/transactions';
import { Favorite, FavoriteSchema } from '../model/favorites';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Listing.name, schema: ListingSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: Favorite.name, schema: FavoriteSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
