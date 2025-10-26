import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import {
  CategoryEnum,
  Listing,
  ListingDocument,
  ListingStatus,
} from '../model/listings';

import {
  PriceSuggestion,
  PriceSuggestionDocument,
} from '../model/pricesuggestions';

import { FilterListingsDto } from './dto/filter-listings.dto';
import { PriceSuggestionDto } from './dto/price-suggestion.dto';
import { Brand, BrandDocument } from 'src/model/brands';
import { EVDetail } from 'src/model/evdetails';
import { BatteryDetail } from 'src/model/batterydetails';

type NumberCondition = {
  $gte?: number;
  $lte?: number;
};

const buildNumberCondition = (
  min?: number,
  max?: number,
): NumberCondition | undefined => {
  const condition: NumberCondition = {};
  if (min !== undefined) {
    condition.$gte = min;
  }
  if (max !== undefined) {
    condition.$lte = max;
  }
  return Object.keys(condition).length > 0 ? condition : undefined;
};

@Injectable()
export class ListingsService {
  constructor(
    @InjectModel(Listing.name)
    private readonly listingModel: Model<ListingDocument>,
    @InjectModel(PriceSuggestion.name)
    private readonly priceSuggestionModel: Model<PriceSuggestionDocument>,
    // injected brand/model/category models
    @InjectModel(Brand.name)
    private readonly brandModel: Model<BrandDocument>,
    @InjectModel(EVDetail.name)
    private readonly evDetailModel: Model<any>,
    @InjectModel(BatteryDetail.name)
    private readonly batteryDetailModel: Model<any>,
  ) {}
  private escapeRegex(input: string) {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async findAll(filters: FilterListingsDto) {
    const {
      brand_id,
      status,
      condition,
      search,
      minPrice,
      maxPrice,
      location,
      limit = 12,
      page = 1,
    } = filters;

    const query: FilterQuery<ListingDocument> = {};

    if (brand_id) query.brand_id = brand_id;
    if (status) query.status = status;
    if (condition) query.condition = condition;
    if (location) query.location = { $regex: new RegExp(location, 'i') };

    const priceCondition = buildNumberCondition(minPrice, maxPrice);
    if (priceCondition) {
      query.price = priceCondition as unknown as ListingDocument['price'];
    }
    if (search) {
      query.$text = { $search: search };
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.listingModel
        .find(query)
        .populate({ path: 'seller_id', select: 'name email phone' })
        .populate({ path: 'brand_id', select: 'name' })
        .sort({ is_featured: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<Listing & { _id: string; createdAt?: Date }>(),
      this.listingModel.countDocuments(query),
    ]);

    const dataWithDetail = await Promise.all(
      (Array.isArray(data) ? data : []).map(async (item) => {
        if (item.category === 'ev' || item.category === CategoryEnum.EV) {
          const evDetail = await this.evDetailModel
            .findOne({ listing_id: item._id })
            .lean();
          return { ...item, evDetail };
        }
        if (
          item.category === 'battery' ||
          item.category === CategoryEnum.BATTERY
        ) {
          const batteryDetail = await this.batteryDetailModel
            .findOne({ listing_id: item._id })
            .lean();
          return { ...item, batteryDetail };
        }
        return item;
      }),
    );

    return {
      data: dataWithDetail,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const listing = await this.listingModel
      .findById(id)
      .populate('seller_id', 'name email phone')
      .lean();

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    return listing;
  }

  async updateStatus(id: string, status: ListingStatus) {
    const listing = await this.listingModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .lean<Listing & { _id: string }>();

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    return listing;
  }

  // async update(id: string, updateListingDto: UpdateListingDto) {
  //   const updatePayload: Record<string, unknown> = {
  //     ...updateListingDto,
  //   };

  //   const listing = await this.listingModel
  //     .findByIdAndUpdate(id, updatePayload, { new: true, runValidators: true })
  //     .lean<Listing & { _id: string }>();

  //   if (!listing) {
  //     throw new NotFoundException('Listing not found');
  //   }

  //   return listing;
  // }

  // async updateStatus(id: string, status: ListingStatus) {
  //   const listing = await this.listingModel
  //     .findByIdAndUpdate(id, { status }, { new: true })
  //     .lean<Listing & { _id: string }>();

  //   if (!listing) {
  //     throw new NotFoundException('Listing not found');
  //   }

  //   return listing;
  // }

  // async incrementViewCount(id: string) {
  //   const listing = await this.listingModel
  //     .findByIdAndUpdate(id, { $inc: { view_count: 1 } }, { new: true })
  //     .lean<Listing & { _id: string }>();

  //   if (!listing) {
  //     throw new NotFoundException('Listing not found');
  //   }

  //   return { view_count: listing.view_count };
  // }

  async remove(id: string) {
    const listing = await this.listingModel
      .findById(id)
      .lean<Listing & { _id: string }>();
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    const listingId = listing._id;
    const selectors: any[] = [];
    if (Types.ObjectId.isValid(String(listingId)))
      selectors.push({ listing_id: new Types.ObjectId(String(listingId)) });
    selectors.push({ listing_id: String(listingId) });

    // Delete detail documents for this listing
    if (
      listing.category === CategoryEnum.EV ||
      String(listing.category) === 'ev'
    ) {
      const found = await this.evDetailModel.find({ $or: selectors }).lean();
      if (found.length > 0) {
        const ids = found.map((d) => d._id).filter(Boolean);
        const del = await this.evDetailModel.deleteMany({ _id: { $in: ids } });

        console.log('Deleted evdetails for listing', {
          listingId,
          foundCount: found.length,
          deletedCount: del.deletedCount,
        });
      }
    } else if (
      listing.category === CategoryEnum.BATTERY ||
      String(listing.category) === 'battery'
    ) {
      const found = await this.batteryDetailModel
        .find({ $or: selectors })
        .lean();
      if (found.length > 0) {
        const ids = found.map((d) => d._id).filter(Boolean);
        const del = await this.batteryDetailModel.deleteMany({
          _id: { $in: ids },
        });

        console.log('Deleted batterydetails for listing', {
          listingId,
          foundCount: found.length,
          deletedCount: del.deletedCount,
        });
      }
    }

    // Delete auctions that reference this listing and their related details

    // Finally delete the listing
    await this.listingModel.findByIdAndDelete(id);
    return listing;
  }

  // async adjustFavoriteCount(id: string, delta: number) {
  async adjustFavoriteCount(id: string, delta: number) {
    await this.listingModel
      .findByIdAndUpdate(id, { $inc: { favorite_count: delta } })
      .exec();
  }

  async suggestPrice(dto: PriceSuggestionDto) {
    const { mileage, condition, battery_capacity } = dto;

    const query: FilterQuery<ListingDocument> = {
      status: ListingStatus.SOLD,
    };

    if (condition) {
      query.condition = condition;
    }

    const comparableListings = (await this.listingModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(20)
      .lean()) as unknown as Array<
      Listing & { _id: Types.ObjectId; createdAt?: Date }
    >;

    if (comparableListings.length === 0) {
      return {
        suggested_price: null,
        model_confidence: 0,
        comparable_count: 0,
      };
    }

    const avgPrice =
      comparableListings.reduce((sum, item) => sum + (item.price ?? 0), 0) /
      comparableListings.length;

    const confidence = Math.min(1, comparableListings.length / 20);

    return {
      suggested_price: Math.round(avgPrice),
      model_confidence: confidence,
      comparable_count: comparableListings.length,
      comparables: comparableListings.map((item) => ({
        id: item._id,
        price: item.price,

        condition: item.condition,

        createdAt: item.createdAt,
      })),
    };
  }

  async recordSuggestion(
    listingId: string,
    suggestion: {
      suggested_price: number;
      model_confidence: number;
      model_name?: string;
      notes?: string;
    },
  ) {
    return this.priceSuggestionModel.create({
      listing_id: listingId,
      ...suggestion,
    });
  }

  async getRecommendations(listingId: string, limit = 6) {
    const baseListing = await this.listingModel
      .findById(listingId)
      .lean<Listing & { _id: string }>();
    if (!baseListing) {
      throw new NotFoundException('Listing not found');
    }

    const recommendationQuery: FilterQuery<ListingDocument> = {
      _id: { $ne: listingId },
      status: ListingStatus.ACTIVE,
    };

    if (baseListing.brand_id) {
      recommendationQuery.brand_id = baseListing.brand_id;
    }

    return (await this.listingModel
      .find(recommendationQuery)
      .sort({ is_featured: -1, createdAt: -1 })
      .limit(limit)
      .lean()) as unknown as Array<
      Listing & { _id: Types.ObjectId; createdAt?: Date }
    >;
  }

  /**
   * FIND BY SELLER - Get listings by seller (user) with pagination and filters
   * @param sellerId - ID of the seller (user)
   * @param page - Page number (starts from 1)
   * @param limit - Number of items per page
   * @param status - Optional filter by listing status
   * @returns Paginated listings with seller info
   */
  async findBySeller(
    sellerId: string,
    page: number = 1,
    limit: number = 10,
    status?: ListingStatus,
  ) {
    // Validate seller ID
    if (!Types.ObjectId.isValid(sellerId)) {
      throw new NotFoundException('Invalid seller ID format');
    }

    // Validate pagination params
    if (page < 1) page = 1;
    if (limit < 1) limit = 10;
    if (limit > 50) limit = 50; // Maximum limit

    const skip = (page - 1) * limit;

    try {
      // Build base query - try both string and ObjectId formats
      const query: FilterQuery<ListingDocument> = {
        $or: [
          { seller_id: sellerId }, // Try matching the string directly
          { seller_id: new Types.ObjectId(sellerId) }, // Try matching as ObjectId
        ],
      };

      // console.log('Query:', JSON.stringify(query));

      // // Add status filter if provided
      // if (status) {
      //   // Convert status to lowercase to match DB format
      //   query.status = status.toLowerCase();
      // }

      // console.log('Final query with status:', JSON.stringify(query));

      // Execute query with pagination
      const [data, total] = await Promise.all([
        this.listingModel
          .find(query)
          .select([
            'title',
            'description',
            'price',
            'status',
            'condition',
            'location',
            'images',
            'view_count',
            'favorite_count',
            'createdAt',
            'updatedAt',
            'expiry_date',
            'is_featured',
          ])
          .populate('seller_id', 'name email phone')
          .populate('brand_id', 'name')
          .populate('category_id', 'name')
          .sort({ is_featured: -1, createdAt: -1 }) // Featured items first, then newest
          .skip(skip)
          .limit(limit)
          .lean(),
        this.listingModel.countDocuments(query),
      ]);

      // Return formatted response
      return {
        data,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasPreviousPage: page > 1,
          hasNextPage: page < Math.ceil(total / limit),
          // Additional meta info
          itemsInPage: data.length,
          startIndex: skip + 1,
          endIndex: skip + data.length,
          status: status || 'all',
        },
      };
    } catch (error) {
      console.error('Find listings by seller error:', error);
      throw new Error(`Failed to fetch listings: ${error.message}`);
    }
  }
}
