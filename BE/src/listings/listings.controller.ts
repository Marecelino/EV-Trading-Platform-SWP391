import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { FilterListingsDto } from './dto/filter-listings.dto';
import { PriceSuggestionDto } from './dto/price-suggestion.dto';
import { ListingStatus } from '../model/listings';

@ApiTags('listings')
@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Post()
  create(@Body() createListingDto: CreateListingDto) {
    return this.listingsService.create(createListingDto);
  }

  @Get()
  findAll(@Query() filters: FilterListingsDto) {
    return this.listingsService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.listingsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateListingDto: UpdateListingDto) {
    return this.listingsService.update(id, updateListingDto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: ListingStatus) {
    return this.listingsService.updateStatus(id, status);
  }

  @Post(':id/views')
  incrementView(@Param('id') id: string) {
    return this.listingsService.incrementViewCount(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.listingsService.remove(id);
  }

  @Post('price-suggestion')
  getPriceSuggestion(@Body() dto: PriceSuggestionDto) {
    return this.listingsService.suggestPrice(dto);
  }

  @Get(':id/recommendations')
  recommend(@Param('id') id: string, @Query('limit') limit?: number) {
    return this.listingsService.getRecommendations(id, Number(limit) || 6);
  }
}
