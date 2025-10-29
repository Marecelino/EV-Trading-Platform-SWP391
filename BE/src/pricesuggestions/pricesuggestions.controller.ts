import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PriceSuggestionsService } from './pricesuggestions.service';
import { CreatePriceSuggestionDto } from './dto/create-pricesuggestion.dto';
import { UpdatePriceSuggestionDto } from './dto/update-pricesuggestion.dto';
import { FilterPriceSuggestionsDto } from './dto/filter-pricesuggestions.dto';

@ApiTags('pricesuggestions')
@Controller('pricesuggestions')
export class PriceSuggestionsController {
  constructor(
    private readonly priceSuggestionsService: PriceSuggestionsService,
  ) {}

  @Post()
  create(@Body() createPriceSuggestionDto: CreatePriceSuggestionDto) {
    return this.priceSuggestionsService.create(createPriceSuggestionDto);
  }

  @Get()
  findAll(@Query() filter: FilterPriceSuggestionsDto) {
    return this.priceSuggestionsService.findAll(
      filter,
      filter.page || 1,
      filter.limit || 20,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.priceSuggestionsService.findOne(id);
  }

  @Get('listing/:listingId')
  findByListing(@Param('listingId') listingId: string) {
    return this.priceSuggestionsService.findByListing(listingId);
  }

  @Get('listing/:listingId/latest')
  findLatestByListing(@Param('listingId') listingId: string) {
    return this.priceSuggestionsService.findLatestByListing(listingId);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updatePriceSuggestionDto: UpdatePriceSuggestionDto,
  ) {
    return this.priceSuggestionsService.update(id, updatePriceSuggestionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.priceSuggestionsService.remove(id);
  }

  @Delete('listing/:listingId')
  removeByListing(@Param('listingId') listingId: string) {
    return this.priceSuggestionsService.removeByListing(listingId);
  }
}
