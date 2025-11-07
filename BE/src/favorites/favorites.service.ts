import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Favorite, FavoriteDocument } from '../model/favorites';
import { ListingsService } from '../listings/listings.service';
import { AuctionsService } from '../auctions/auctions.service';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectModel(Favorite.name)
    private readonly favoriteModel: Model<FavoriteDocument>,
    private readonly listingsService: ListingsService,
    private readonly auctionsService: AuctionsService,
  ) { }


  async remove(userId: string, listingId: string) {
    // Support removing either a listing favorite or an auction favorite.
    const targetId = listingId;

    const favorite = await this.favoriteModel
      .findOneAndDelete({
        user_id: userId,
        $or: [{ listing_id: targetId }, { auction_id: targetId }],
      })
      .lean();

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    // Adjust favorite counts depending on which field was set
    if (favorite.listing_id) {
      const lid = (favorite.listing_id as any)?._id ?? favorite.listing_id;
      try {
        await this.listingsService.adjustFavoriteCount(String(lid), -1);
      } catch (err) {
        // non-fatal: log and continue
        console.error('Failed to decrement listing favorite count', err?.message ?? err);
      }
    }

    if (favorite.auction_id) {
      const aid = (favorite.auction_id as any)?._id ?? favorite.auction_id;
      try {
        await this.auctionsService.adjustFavoriteCount(String(aid), -1);
      } catch (err) {
        console.error('Failed to decrement auction favorite count', err?.message ?? err);
      }
    }

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
    // Check whether the user has favorited the provided target id
    const exists = await this.favoriteModel.exists({
      user_id: userId,
      $or: [{ listing_id: listingId }, { auction_id: listingId }],
    });
    return { isFavorite: Boolean(exists) };
  }

  async add(dto: { user_id: string; listing_id?: string; auction_id?: string }) {
    const { user_id, listing_id, auction_id } = dto as any;

    // require exactly one target
    if ((!listing_id && !auction_id) || (listing_id && auction_id)) {
      throw new BadRequestException('Provide exactly one of listing_id or auction_id');
    }

    // Check if favorite already exists to provide better error message
    const existingFavorite = await this.favoriteModel.findOne({
      user_id,
      ...(listing_id ? { listing_id } : { auction_id }),
    });

    if (existingFavorite) {
      throw new ConflictException('Favorite already exists');
    }

    // Build insert document without including fields that are undefined/null
    const insertDoc: any = { user_id };
    if (listing_id) insertDoc.listing_id = listing_id;
    if (auction_id) insertDoc.auction_id = auction_id;

    let created: any;
    try {
      created = await this.favoriteModel.create(insertDoc);
    } catch (err: any) {
      // Translate duplicate key errors into Conflict with guidance
      if (err && (err.code === 11000 || err.code === 11001)) {
        const keyValue = err.keyValue || {};
        if (keyValue.listing_id === null) {
          throw new ConflictException(
            'Failed to create favorite due to existing DB index treating missing listing_id as null. ' +
            'Please drop the old index on (user_id, listing_id) or recreate the partial index to allow multiple auction favorites. ' +
            'Example (mongo): db.favorites.dropIndex("user_id_1_listing_id_1");',
          );
        }
        throw new ConflictException('Favorite already exists');
      }
      throw err;
    }

    // Adjust favorite counters
    try {
      if (listing_id) await this.listingsService.adjustFavoriteCount(listing_id, 1);
      if (auction_id) await this.auctionsService.adjustFavoriteCount(auction_id, 1);
    } catch (err) {
      // Log but don't fail the creation; counters can be fixed later
      console.error('Failed to adjust favorite count after create', err?.message ?? err);
    }

    return created;
  }
}
