import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Listing, ListingSchema } from '../model/listings';
import {
  PriceSuggestion,
  PriceSuggestionSchema,
} from '../model/pricesuggestions';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';
import { Category, CategorySchema } from 'src/model/categories';
import { Models, ModelSchema } from 'src/model/models';
import { Brand, BrandSchema } from 'src/model/brands';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Listing.name, schema: ListingSchema },
      { name: PriceSuggestion.name, schema: PriceSuggestionSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Models.name, schema: ModelSchema },
      { name: Brand.name, schema: BrandSchema },

    ]),
  ],
  controllers: [ListingsController],
  providers: [ListingsService],
  exports: [ListingsService],
})
export class ListingsModule {}
