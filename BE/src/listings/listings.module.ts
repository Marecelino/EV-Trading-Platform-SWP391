import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Listing, ListingSchema } from '../model/listings';
import {
  PriceSuggestion,
  PriceSuggestionSchema,
} from '../model/pricesuggestions';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Listing.name, schema: ListingSchema },
      { name: PriceSuggestion.name, schema: PriceSuggestionSchema },
    ]),
  ],
  controllers: [ListingsController],
  providers: [ListingsService],
  exports: [ListingsService],
})
export class ListingsModule {}
