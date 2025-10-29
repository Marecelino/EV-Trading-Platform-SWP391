import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PriceSuggestion,
  PriceSuggestionSchema,
} from '../model/pricesuggestions';
import { PriceSuggestionsController } from './pricesuggestions.controller';
import { PriceSuggestionsService } from './pricesuggestions.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PriceSuggestion.name, schema: PriceSuggestionSchema },
    ]),
  ],
  controllers: [PriceSuggestionsController],
  providers: [PriceSuggestionsService],
  exports: [PriceSuggestionsService],
})
export class PriceSuggestionsModule {}
