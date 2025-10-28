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
    const safePage = page > 0 ? page : 1;
    const safeLimit = limit > 0 ? limit : 12;
    const skip = (safePage - 1) * safeLimit;

    const [favorites, total] = await Promise.all([
      this.favoriteModel
        .find(query)
        .populate('listing_id')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      this.favoriteModel.countDocuments(query),
    ]);

    const listingIds = (Array.isArray(favorites) ? favorites : [])
      .map((favorite) => {
        const listingRef = favorite?.listing_id as
          | string
          | { _id?: unknown }
          | undefined;
        if (!listingRef) {
          return null;
        }
        if (typeof listingRef === 'string') {
          return listingRef;
        }
        if (listingRef._id) {
          return String(listingRef._id);
        }
        return null;
      })
      .filter((id): id is string => Boolean(id));

    const listings = await this.listingsService.findManyByIds(listingIds);
    const listingMap = new Map(
      listings.map((listing) => [String(listing._id), listing]),
    );

    const enrichedFavorites = (Array.isArray(favorites) ? favorites : []).map(
      (favorite) => {
        const listingRef = favorite?.listing_id as
          | string
          | { _id?: unknown }
          | undefined;
        const listingId =
          typeof listingRef === 'string'
            ? listingRef
            : listingRef && listingRef._id
              ? String(listingRef._id)
              : null;

        const enrichedListing = listingId
          ? (listingMap.get(listingId) ?? favorite.listing_id)
          : favorite.listing_id;

        return {
          ...favorite,
          listing_id: enrichedListing ?? null,
        };
      },
    );

    return {
      data: enrichedFavorites,
      meta: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
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
