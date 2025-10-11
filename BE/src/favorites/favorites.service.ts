import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Favorite, FavoriteDocument } from '../model/favorites';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { ListingsService } from '../listings/listings.service';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectModel(Favorite.name)
    private readonly favoriteModel: Model<FavoriteDocument>,
    private readonly listingsService: ListingsService,
  ) {}

  async add(createFavoriteDto: CreateFavoriteDto) {
    try {
      const favorite = new this.favoriteModel(createFavoriteDto);
      const saved = await favorite.save();
      await this.listingsService.adjustFavoriteCount(
        createFavoriteDto.listing_id,
        1,
      );
      return saved;
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Listing already favorited');
      }
      throw error;
    }
  }

  async remove(userId: string, listingId: string) {
    const favorite = await this.favoriteModel
      .findOneAndDelete({ user_id: userId, listing_id: listingId })
      .lean();

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    await this.listingsService.adjustFavoriteCount(listingId, -1);
    return favorite;
  }

  async listByUser(userId: string, page = 1, limit = 12) {
    const query: FilterQuery<FavoriteDocument> = { user_id: userId };
    const skip = (page - 1) * limit;

    const [favorites, total] = await Promise.all([
      this.favoriteModel
        .find(query)
        .populate('listing_id')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.favoriteModel.countDocuments(query),
    ]);

    return {
      data: favorites,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async isFavorite(userId: string, listingId: string) {
    const favorite = await this.favoriteModel.exists({
      user_id: userId,
      listing_id: listingId,
    });
    return { isFavorite: Boolean(favorite) };
  }
}
