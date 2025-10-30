import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseArrayPipe,
  Patch,
  Post,
  Query,
  ParseEnumPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ListingsService } from './listings.service';
import { EVListingsService } from './ev-listings.service';
import { BatteryListingsService } from './battery-listings.service';
import { CreateEVListingDto } from './dto/create-ev-listing.dto';
import { CreateBatteryListingDto } from './dto/create-battery-listing.dto';
import { FilterListingsDto } from './dto/filter-listings.dto';
import { SearchListingsDto } from './dto/search-listings.dto';
import { PriceSuggestionDto } from './dto/price-suggestion.dto';
import { ListingStatus } from '../model/listings';
import { UpdateListingStatusDto } from './dto/update-listing-status.dto';
import { ApiBody } from '@nestjs/swagger';

@ApiTags('listings')
@ApiBearerAuth()
@Controller('listings')
export class ListingsController {
  constructor(
    private readonly listingsService: ListingsService,
    private readonly evListingsService: EVListingsService,
    private readonly batteryListingsService: BatteryListingsService,
  ) {}

  @Post('ev')
  createEV(@Body() dto: CreateEVListingDto) {
    return this.evListingsService.create(dto);
  }

  @Post('battery')
  createBattery(@Body() dto: CreateBatteryListingDto) {
    return this.batteryListingsService.create(dto);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search EV and battery listings' })
  search(@Query() filters: SearchListingsDto) {
    return this.listingsService.searchVehicles(filters);
  }

  @Get()
  findAll(@Query() filters: FilterListingsDto) {
    return this.listingsService.findAll(filters);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active listings (convenience endpoint)' })
  active(@Query() filters: FilterListingsDto) {
    // Ensure status is ACTIVE regardless of caller
    const merged = { ...(filters || {}), status: ListingStatus.ACTIVE } as FilterListingsDto;
    return this.listingsService.findAll(merged);
  }

  @Get('compare')
  @ApiOperation({ summary: 'Compare multiple listings by IDs' })
  @ApiQuery({
    name: 'ids',
    required: true,
    description: 'Comma separated list of listing IDs to compare',
    example: '671234567890abcdef123456,671234567890abcdef654321',
  })
  compare(
    @Query(
      'ids',
      new ParseArrayPipe({ items: String, separator: ',', optional: false }),
    )
    ids: string[],
  ) {
    return this.listingsService.compareListings(ids);
  }

  @Patch('ev/:id')
  updateEV(@Param('id') id: string, @Body() dto: CreateEVListingDto) {
    return this.evListingsService.update(id, dto);
  }
  @Patch('battery/:id')
  updateBattery(@Param('id') id: string, @Body() dto: CreateBatteryListingDto) {
    return this.batteryListingsService.update(id, dto);
  }
  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateListingDto: UpdateListingDto) {
  //   return this.listingsService.update(id, updateListingDto);
  // }

  @Patch(':id/status')
  @ApiBody({
    type: UpdateListingStatusDto,
    examples: {
      Active: { summary: 'Set listing active', value: { status: ListingStatus.ACTIVE } },
      Sold: { summary: 'Set listing sold', value: { status: ListingStatus.SOLD } },
      Removed: { summary: 'Remove listing', value: { status: ListingStatus.REMOVED } },
    },
  })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateListingStatusDto) {
    return this.listingsService.updateStatus(id, dto.status);
  }

  // @Post(':id/views')
  // incrementView(@Param('id') id: string) {
  //   return this.listingsService.incrementViewCount(id);
  // }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.listingsService.remove(id);
  }

  @Get('seller/:sellerId')
  @ApiOperation({
    summary: 'Get listings by seller (user)',
    description:
      'Retrieve all listings created by a specific user (seller) with pagination and optional status filter',
  })
  @ApiParam({
    name: 'sellerId',
    description: 'User ID of the seller',
    example: '671234567890abcdef123456',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (starts from 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
    example: 10,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by listing status',
    enum: ListingStatus,
  })
  @ApiResponse({
    status: 200,
    description: 'Listings retrieved successfully',
    schema: {
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              price: { type: 'number' },
              status: { type: 'string' },
              seller_id: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                  phone: { type: 'string' },
                },
              },
            },
          },
        },
        meta: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Invalid seller ID',
  })
  findBySeller(
    @Param('sellerId') sellerId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: ListingStatus,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.listingsService.findBySeller(
      sellerId,
      pageNum,
      limitNum,
      status,
    );
  }

  @Post('price-suggestion')
  getPriceSuggestion(@Body() dto: PriceSuggestionDto) {
    return this.listingsService.suggestPrice(dto);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate listing (set status active)' })
  @ApiParam({ name: 'id', description: 'Listing ID' })
  @ApiResponse({ status: 200, description: 'Listing activated' })
  async activateListing(@Param('id') id: string) {
    return this.listingsService.updateStatus(id, ListingStatus.ACTIVE);
  }

  @Get(':id/recommendations')
  recommend(@Param('id') id: string, @Query('limit') limit?: number) {
    return this.listingsService.getRecommendations(id, Number(limit) || 6);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.listingsService.findOne(id);
  }
}
