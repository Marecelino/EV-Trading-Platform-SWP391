import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';

@ApiTags('favorites')
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post()
  add(@Body() createFavoriteDto: CreateFavoriteDto) {
    return this.favoritesService.add(createFavoriteDto);
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
    @Query('listing_id') listingId: string,
  ) {
    return this.favoritesService.isFavorite(userId, listingId);
  }

  @Delete(':listingId')
  remove(
    @Query('user_id') userId: string,
    @Param('listingId') listingId: string,
  ) {
    return this.favoritesService.remove(userId, listingId);
  }
}
