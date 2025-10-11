import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { Listing, ListingDocument, ListingStatus } from '../model/listings';
import {
  PriceSuggestion,
  PriceSuggestionDocument,
} from '../model/pricesuggestions';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { FilterListingsDto } from './dto/filter-listings.dto';
import { PriceSuggestionDto } from './dto/price-suggestion.dto';

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
  ) {}

  async create(createListingDto: CreateListingDto) {
    const listing = new this.listingModel({
      ...createListingDto,
      expiry_date: createListingDto.expiry_date
        ? new Date(createListingDto.expiry_date)
        : undefined,
      status: createListingDto.status ?? ListingStatus.DRAFT,
    });
    return listing.save();
  }

  async findAll(filters: FilterListingsDto) {
    const {
      brand_id,
      model_id,
      category_id,
      status = ListingStatus.ACTIVE,
      condition,
      search,
      minPrice,
      maxPrice,
      location,
      minRange,
      maxRange,
      minCapacity,
      maxCapacity,
      limit = 12,
      page = 1,
    } = filters;

    const query: FilterQuery<ListingDocument> = {};

    if (brand_id) query.brand_id = brand_id;
    if (model_id) query.model_id = model_id;
    if (category_id) query.category_id = category_id;
    if (status) query.status = status;
    if (condition) query.condition = condition;
    if (location) query.location = { $regex: new RegExp(location, 'i') };

    const priceCondition = buildNumberCondition(minPrice, maxPrice);
    if (priceCondition) {
      query.price = priceCondition as unknown as ListingDocument['price'];
    }

    const rangeCondition = buildNumberCondition(minRange, maxRange);
    if (rangeCondition) {
      query.range = rangeCondition as unknown as ListingDocument['range'];
    }

    const capacityCondition = buildNumberCondition(minCapacity, maxCapacity);
    if (capacityCondition) {
      query.battery_capacity =
        capacityCondition as unknown as ListingDocument['battery_capacity'];
    }

    if (search) {
      query.$text = { $search: search };
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.listingModel
        .find(query)
        .sort({ is_featured: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<Listing & { _id: string; createdAt?: Date }>(),
      this.listingModel.countDocuments(query),
    ]);

    return {
      data,
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

  async update(id: string, updateListingDto: UpdateListingDto) {
    const updatePayload: Record<string, unknown> = {
      ...updateListingDto,
    };

    if (updateListingDto.expiry_date) {
      updatePayload.expiry_date = new Date(updateListingDto.expiry_date);
    }

    const listing = await this.listingModel
      .findByIdAndUpdate(id, updatePayload, { new: true, runValidators: true })
      .lean<Listing & { _id: string }>();

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

  async incrementViewCount(id: string) {
    const listing = await this.listingModel
      .findByIdAndUpdate(id, { $inc: { view_count: 1 } }, { new: true })
      .lean<Listing & { _id: string }>();

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    return { view_count: listing.view_count };
  }

  async remove(id: string) {
    const listing = await this.listingModel
      .findByIdAndDelete(id)
      .lean<Listing & { _id: string }>();
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }
    return listing;
  }

  async adjustFavoriteCount(id: string, delta: number) {
    await this.listingModel
      .findByIdAndUpdate(id, { $inc: { favorite_count: delta } })
      .exec();
  }

  async suggestPrice(dto: PriceSuggestionDto) {
    const { model_id, mileage, condition, battery_capacity } = dto;

    const query: FilterQuery<ListingDocument> = {
      model_id,
      status: ListingStatus.SOLD,
    };

    if (mileage !== undefined) {
      query.mileage = {
        $lte: mileage * 1.2,
      } as unknown as ListingDocument['mileage'];
    }

    if (condition) {
      query.condition = condition;
    }

    if (battery_capacity !== undefined) {
      query.battery_capacity = {
        $gte: battery_capacity * 0.8,
      } as unknown as ListingDocument['battery_capacity'];
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
        mileage: item.mileage,
        condition: item.condition,
        battery_capacity: item.battery_capacity,
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
      category_id: baseListing.category_id,
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
}
