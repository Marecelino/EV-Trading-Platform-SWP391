import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { CreateFavoriteListingDto } from './dto/create-favorite-listing.dto';
import { CreateFavoriteAuctionDto } from './dto/create-favorite-auction.dto';

@ApiTags('favorites')
@ApiBearerAuth()
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) { }

  // @Post()
  // add(@Body() createFavoriteDto: CreateFavoriteDto) {
  //   return this.favoritesService.add(createFavoriteDto);
  // }

  // Convenience endpoint to favorite a listing directly
  @Post('listing')
  addListing(@Body() body: CreateFavoriteListingDto) {
    const dto: CreateFavoriteListingDto = {
      listing_id: body.listing_id,
      user_id: body.user_id,
    };
    return this.favoritesService.add(dto);
  }

  // Convenience endpoint to favorite an auction directly
  @Post('auction')
  addAuction(@Body() body: CreateFavoriteAuctionDto) {
    const dto: CreateFavoriteAuctionDto = {
      auction_id: body.auction_id,
      user_id: body.user_id,
    };
    return this.favoritesService.add(dto);
  }

  @Get()
  list(
    @Query('user_id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.favoritesService.listByUser(
      userId,
      Number(page) || 1,
      Number(limit) || 12,
    );
  }

  @Get('check')
  isFavorite(
    @Query('user_id') userId: string,
    @Query('target_id') targetId: string,
  ) {
    return this.favoritesService.isFavorite(userId, targetId);
  }

  @Delete(':targetId')
  remove(
    @Query('user_id') userId: string,
    @Param('targetId') targetId: string,
  ) {
    return this.favoritesService.remove(userId, targetId);
  }

  // Remove favorite for a listing
  @Delete('listing/:listingId')
  removeListing(
    @Query('user_id') userId: string,
    @Param('listingId') listingId: string,
  ) {
    return this.favoritesService.remove(userId, listingId);
  }

  // Remove favorite for an auction
  @Delete('auction/:auctionId')
  removeAuction(
    @Query('user_id') userId: string,
    @Param('auctionId') auctionId: string,
  ) {
    return this.favoritesService.remove(userId, auctionId);
  }
}
