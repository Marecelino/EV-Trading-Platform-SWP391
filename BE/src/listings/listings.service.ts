import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
import { SearchListingsDto } from './dto/search-listings.dto';
import { PriceSuggestionDto } from './dto/price-suggestion.dto';
import { Brand, BrandDocument } from 'src/model/brands';
import { EVDetail } from 'src/model/evdetails';
import { BatteryDetail } from 'src/model/batterydetails';
import { Favorite, FavoriteDocument } from 'src/model/favorites';
import { NotificationType } from 'src/model/notifications';
import { NotificationsService } from 'src/notifications/notifications.service';
import type { ComparisonResponse, ListingWithDetails } from './comparison.util';
import { buildComparisonResponse } from './comparison.util';

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
    @InjectModel(Favorite.name)
    private readonly favoriteModel: Model<FavoriteDocument>,
    private readonly notificationsService: NotificationsService,
  ) { }
  private escapeRegex(input: string) {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private buildSearchRegex(term?: string): RegExp | null {
    if (!term) {
      return null;
    }

    const words = term
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0)
      .map((word) => this.escapeRegex(word));

    if (!words.length) {
      return null;
    }

    const pattern = words.join('.*');
    return new RegExp(pattern, 'i');
  }

  private buildListingDetailQuery(
    listingIds: string[],
  ): FilterQuery<any> | null {
    const uniqueIds = Array.from(
      new Set(
        (listingIds || [])
          .map((id) => (id ? String(id) : ''))
          .filter((id) => id.length > 0),
      ),
    );

    if (uniqueIds.length === 0) {
      return null;
    }

    const objectIds: Types.ObjectId[] = [];
    const stringIds: string[] = [];

    uniqueIds.forEach((id) => {
      if (Types.ObjectId.isValid(id)) {
        objectIds.push(new Types.ObjectId(id));
      } else {
        stringIds.push(id);
      }
    });

    const clauses: FilterQuery<any>[] = [];
    if (objectIds.length) {
      clauses.push({ listing_id: { $in: objectIds } });
    }
    if (stringIds.length) {
      clauses.push({ listing_id: { $in: stringIds } });
    }

    if (clauses.length === 0) {
      return null;
    }

    if (clauses.length === 1) {
      return clauses[0];
    }

    return { $or: clauses };
  }

  private async resolveDetailListingIds(
    filters: FilterListingsDto,
  ): Promise<Set<string> | null> {
    const {
      category,
      minYear,
      maxYear,
      minMileage,
      maxMileage,
      minRange,
      maxRange,
      minCapacity,
      maxCapacity,
      minSoh,
      maxSoh,
      batteryType,
      minManufactureYear,
      maxManufactureYear,
    } = filters;

    const batteryTypeTerm = batteryType?.trim() || undefined;

    const wantsEV = !category || category === CategoryEnum.EV;
    const wantsBattery = !category || category === CategoryEnum.BATTERY;

    const hasEvDetailFilters = [
      minYear,
      maxYear,
      minMileage,
      maxMileage,
      minRange,
      maxRange,
      minCapacity,
      maxCapacity,
    ].some((value) => value !== undefined);

    const hasBatteryDetailFilters = [
      minCapacity,
      maxCapacity,
      minSoh,
      maxSoh,
      batteryTypeTerm,
      minManufactureYear,
      maxManufactureYear,
    ].some((value) => value !== undefined);

    let evListingIds: Set<string> | null = null;
    if (wantsEV && hasEvDetailFilters) {
      const evDetailQuery: FilterQuery<any> = {};
      const yearCondition = buildNumberCondition(minYear, maxYear);
      if (yearCondition) {
        evDetailQuery.year = yearCondition;
      }
      const mileageCondition = buildNumberCondition(minMileage, maxMileage);
      if (mileageCondition) {
        evDetailQuery.mileage_km = mileageCondition;
      }
      const rangeCondition = buildNumberCondition(minRange, maxRange);
      if (rangeCondition) {
        evDetailQuery.range_km = rangeCondition;
      }
      const capacityCondition = buildNumberCondition(minCapacity, maxCapacity);
      if (capacityCondition) {
        evDetailQuery.battery_capacity_kwh = capacityCondition;
      }

      if (Object.keys(evDetailQuery).length > 0) {
        evDetailQuery.listing_id = { $exists: true };
        const evDetails = await this.evDetailModel
          .find(evDetailQuery)
          .select('listing_id')
          .lean();

        evListingIds = new Set(
          (Array.isArray(evDetails) ? evDetails : [])
            .map((detail: any) => detail?.listing_id)
            .filter((id) => id)
            .map((id) => String(id)),
        );
      }
    }

    let batteryListingIds: Set<string> | null = null;
    if (wantsBattery && hasBatteryDetailFilters) {
      const batteryDetailQuery: FilterQuery<any> = {};
      const capacityCondition = buildNumberCondition(minCapacity, maxCapacity);
      if (capacityCondition) {
        batteryDetailQuery.capacity_kwh = capacityCondition;
      }
      const sohCondition = buildNumberCondition(minSoh, maxSoh);
      if (sohCondition) {
        batteryDetailQuery.soh_percent = sohCondition;
      }
      const manufactureCondition = buildNumberCondition(
        minManufactureYear,
        maxManufactureYear,
      );
      if (manufactureCondition) {
        batteryDetailQuery.manufacture_year = manufactureCondition;
      }
      if (batteryTypeTerm) {
        batteryDetailQuery.battery_type = {
          $regex: new RegExp(this.escapeRegex(batteryTypeTerm), 'i'),
        };
      }

      if (Object.keys(batteryDetailQuery).length > 0) {
        batteryDetailQuery.listing_id = { $exists: true };
        const batteryDetails = await this.batteryDetailModel
          .find(batteryDetailQuery)
          .select('listing_id')
          .lean();

        batteryListingIds = new Set(
          (Array.isArray(batteryDetails) ? batteryDetails : [])
            .map((detail: any) => detail?.listing_id)
            .filter((id) => id)
            .map((id) => String(id)),
        );
      }
    }

    if (category === CategoryEnum.EV) {
      return evListingIds;
    }

    if (category === CategoryEnum.BATTERY) {
      return batteryListingIds;
    }

    if (evListingIds && batteryListingIds) {
      return new Set([
        ...Array.from(evListingIds),
        ...Array.from(batteryListingIds),
      ]);
    }

    return evListingIds ?? batteryListingIds ?? null;
  }

  private async hydrateListings<T extends Listing & { _id: any }>(
    listings: T[],
  ): Promise<Array<T & { evDetail?: any; batteryDetail?: any }>> {
    if (!Array.isArray(listings) || listings.length === 0) {
      return [];
    }

    const listingIds = listings
      .map((item) => (item?._id ? String(item._id) : null))
      .filter((id): id is string => Boolean(id));

    const detailQuery = this.buildListingDetailQuery(listingIds);

    const [evDetails, batteryDetails] = await Promise.all([
      detailQuery ? this.evDetailModel.find(detailQuery).lean() : [],
      detailQuery ? this.batteryDetailModel.find(detailQuery).lean() : [],
    ]);

    const evDetailArray = Array.isArray(evDetails)
      ? (evDetails as Array<{ listing_id?: any }>)
      : [];
    const batteryDetailArray = Array.isArray(batteryDetails)
      ? (batteryDetails as Array<{ listing_id?: any }>)
      : [];

    const evDetailMap = new Map<string, any>(
      evDetailArray
        .filter((detail) => detail?.listing_id)
        .map((detail) => [String(detail.listing_id), detail]),
    );

    const batteryDetailMap = new Map<string, any>(
      batteryDetailArray
        .filter((detail) => detail?.listing_id)
        .map((detail) => [String(detail.listing_id), detail]),
    );

    return listings.map((item) => {
      const idStr = String(item._id);
      const categoryValue = String(item.category);

      if (categoryValue === CategoryEnum.EV) {
        const evDetail = evDetailMap.get(idStr) ?? null;
        return { ...item, evDetail };
      }

      if (categoryValue === CategoryEnum.BATTERY) {
        const batteryDetail = batteryDetailMap.get(idStr) ?? null;
        return { ...item, batteryDetail };
      }

      return item;
    });
  }

  async findAll(filters: FilterListingsDto) {
    const {
      brand_id,
      brandName,
      status,
      condition,
      search,
      minPrice,
      maxPrice,
      location,
      minYear,
      maxYear,
      minMileage,
      maxMileage,
      minRange,
      maxRange,
      minCapacity,
      maxCapacity,
      minSoh,
      maxSoh,
      category,
      limit: limitParam = 12,
      page: pageParam = 1,
    } = filters;

    const safeLimit = Math.min(Math.max(limitParam ?? 12, 1), 50);
    const safePage = Math.max(pageParam ?? 1, 1);

    const query: FilterQuery<ListingDocument> = {};

    if (status) query.status = status;
    if (condition) query.condition = condition;
    if (category) query.category = category;
    if (location) {
      query.location = {
        $regex: new RegExp(this.escapeRegex(location), 'i'),
      };
    }

    const brandIdSet = new Set<string>();
    if (brand_id) {
      if (!Types.ObjectId.isValid(brand_id)) {
        return {
          data: [],
          meta: {
            page: safePage,
            limit: safeLimit,
            total: 0,
            totalPages: 0,
          },
        };
      }
      brandIdSet.add(String(brand_id));
    }

    if (brandName) {
      const brandMatches = await this.brandModel
        .find({
          name: { $regex: new RegExp(this.escapeRegex(brandName), 'i') },
        })
        .select('_id')
        .lean<Array<{ _id: Types.ObjectId }>>();

      brandMatches.forEach((brand) => brandIdSet.add(String(brand._id)));

      if (brandMatches.length === 0 && brandIdSet.size === 0) {
        return {
          data: [],
          meta: {
            page: safePage,
            limit: safeLimit,
            total: 0,
            totalPages: 0,
          },
        };
      }
    }

    if (brandIdSet.size > 0) {
      const brandObjectIds = Array.from(brandIdSet).map(
        (id) => new Types.ObjectId(id),
      );
      query.brand_id =
        brandObjectIds.length === 1
          ? brandObjectIds[0]
          : { $in: brandObjectIds };
    }

    const priceCondition = buildNumberCondition(minPrice, maxPrice);
    if (priceCondition) {
      query.price = priceCondition as unknown as ListingDocument['price'];
    }
    if (search) {
      query.$text = { $search: search };
    }

    const detailListingIds = await this.resolveDetailListingIds(filters);

    if (detailListingIds) {
      if (detailListingIds.size === 0) {
        return {
          data: [],
          meta: {
            page: safePage,
            limit: safeLimit,
            total: 0,
            totalPages: 0,
          },
        };
      }

      const objectIdList = Array.from(detailListingIds)
        .filter((id) => Types.ObjectId.isValid(id))
        .map((id) => new Types.ObjectId(id));

      if (objectIdList.length === 0) {
        return {
          data: [],
          meta: {
            page: safePage,
            limit: safeLimit,
            total: 0,
            totalPages: 0,
          },
        };
      }

      query._id =
        objectIdList.length === 1 ? objectIdList[0] : { $in: objectIdList };
    }

    const skip = (safePage - 1) * safeLimit;

    const [data, total] = await Promise.all([
      this.listingModel
        .find(query)
        .populate({ path: 'seller_id', select: 'name email phone' })
        .populate({ path: 'brand_id', select: 'name' })
        .sort({ is_featured: -1, createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean<Listing & { _id: Types.ObjectId; createdAt?: Date }>(),
      this.listingModel.countDocuments(query),
    ]);

    const dataWithDetail = await this.hydrateListings(
      Array.isArray(data) ? data : [],
    );

    return {
      data: dataWithDetail,
      meta: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  async searchVehicles(filters: SearchListingsDto) {
    const {
      keyword,
      brand_id,
      brandName,
      status,
      condition,
      category,
      location,
      minPrice,
      maxPrice,
      limit: limitParam = 10,
      page: pageParam = 1,
    } = filters;

    const searchTerm = keyword;

    const safeLimit = Math.min(Math.max(limitParam ?? 10, 1), 50);
    const safePage = Math.max(pageParam ?? 1, 1);

    const query: FilterQuery<ListingDocument> = {};

    const effectiveStatus = status ?? ListingStatus.ACTIVE;
    if (effectiveStatus) {
      query.status = effectiveStatus;
    }

    if (condition) {
      query.condition = condition;
    }
    if (category) {
      query.category = category;
    }
    if (location) {
      query.location = {
        $regex: new RegExp(this.escapeRegex(location), 'i'),
      };
    }

    const brandIdSet = new Set<string>();
    if (brand_id) {
      if (!Types.ObjectId.isValid(brand_id)) {
        return {
          data: [],
          meta: {
            page: safePage,
            limit: safeLimit,
            total: 0,
            totalPages: 0,
          },
        };
      }
      brandIdSet.add(String(brand_id));
    }

    if (brandName) {
      const brandMatches = await this.brandModel
        .find({
          name: { $regex: new RegExp(this.escapeRegex(brandName), 'i') },
        })
        .select('_id')
        .lean<Array<{ _id: Types.ObjectId }>>();

      brandMatches.forEach((brand) => brandIdSet.add(String(brand._id)));

      if (brandMatches.length === 0 && brandIdSet.size === 0) {
        return {
          data: [],
          meta: {
            page: safePage,
            limit: safeLimit,
            total: 0,
            totalPages: 0,
          },
        };
      }
    }

    if (brandIdSet.size > 0) {
      const brandObjectIds = Array.from(brandIdSet).map(
        (id) => new Types.ObjectId(id),
      );
      query.brand_id =
        brandObjectIds.length === 1
          ? brandObjectIds[0]
          : { $in: brandObjectIds };
    }

    const priceCondition = buildNumberCondition(minPrice, maxPrice);
    if (priceCondition) {
      query.price = priceCondition as unknown as ListingDocument['price'];
    }

    const detailListingIds = await this.resolveDetailListingIds(filters);

    if (detailListingIds) {
      if (detailListingIds.size === 0) {
        return {
          data: [],
          meta: {
            page: safePage,
            limit: safeLimit,
            total: 0,
            totalPages: 0,
          },
        };
      }

      const objectIdList = Array.from(detailListingIds)
        .filter((id) => Types.ObjectId.isValid(id))
        .map((id) => new Types.ObjectId(id));

      if (objectIdList.length === 0) {
        return {
          data: [],
          meta: {
            page: safePage,
            limit: safeLimit,
            total: 0,
            totalPages: 0,
          },
        };
      }

      query._id =
        objectIdList.length === 1 ? objectIdList[0] : { $in: objectIdList };
    }

    const searchRegex = this.buildSearchRegex(searchTerm);
    const orConditions: FilterQuery<ListingDocument>[] = [];

    if (searchRegex) {
      orConditions.push({ title: { $regex: searchRegex } });
      orConditions.push({ description: { $regex: searchRegex } });
      orConditions.push({ location: { $regex: searchRegex } });

      const brandKeywordMatches = await this.brandModel
        .find({ name: { $regex: searchRegex } })
        .select('_id')
        .lean<Array<{ _id: Types.ObjectId }>>();

      const brandKeywordObjectIds = brandKeywordMatches
        .map((brand) => brand?._id)
        .filter((id): id is Types.ObjectId => Boolean(id))
        .map((id) => new Types.ObjectId(id));

      if (brandKeywordObjectIds.length) {
        orConditions.push({ brand_id: { $in: brandKeywordObjectIds } });
      }
    }

    if (searchRegex && !orConditions.length) {
      orConditions.push({ title: { $regex: searchRegex } });
    }

    if (orConditions.length > 0) {
      query.$or = orConditions;
    }

    const skip = (safePage - 1) * safeLimit;

    const [data, total] = await Promise.all([
      this.listingModel
        .find(query)
        .populate({ path: 'seller_id', select: 'name email phone' })
        .populate({ path: 'brand_id', select: 'name' })
        .sort({ is_featured: -1, createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean<Listing & { _id: Types.ObjectId; createdAt?: Date }>(),
      this.listingModel.countDocuments(query),
    ]);

    const dataWithDetail = await this.hydrateListings(
      Array.isArray(data) ? data : [],
    );

    return {
      data: dataWithDetail,
      meta: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  async findManyByIds(listingIds: string[]) {
    const orderedDistinctIds = Array.from(
      new Set(
        (listingIds || [])
          .map((id) => (id ? String(id) : ''))
          .filter((id) => id.length > 0),
      ),
    );

    if (orderedDistinctIds.length === 0) {
      return [];
    }

    const objectIds = orderedDistinctIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));

    if (objectIds.length === 0) {
      return [];
    }

    const listings = (await this.listingModel
      .find({ _id: { $in: objectIds } })
      .populate({ path: 'seller_id', select: 'name email phone' })
      .populate({ path: 'brand_id', select: 'name' })
      .lean()) as Array<Listing & { _id: Types.ObjectId; createdAt?: Date }>;

    if (!listings.length) {
      return [];
    }

    const enriched = await this.hydrateListings(listings);

    const listingMap = new Map(
      enriched.map((item) => [String(item._id), item]),
    );

    return orderedDistinctIds
      .map((id) => listingMap.get(id))
      .filter((item): item is (typeof enriched)[number] => Boolean(item));
  }

  async compareListings(ids: string[]): Promise<ComparisonResponse> {
    const normalizedIds = Array.from(
      new Set((ids || []).map((id) => (id ? String(id) : '')).filter(Boolean)),
    );

    if (normalizedIds.length < 2) {
      throw new BadRequestException(
        'At least two listing IDs are required for comparison',
      );
    }

    if (normalizedIds.length > 3) {
      throw new BadRequestException('You can compare up to 3 listings at once');
    }

    const listings = await this.findManyByIds(normalizedIds);
    const foundIdSet = new Set(listings.map((item) => String(item._id)));
    const missingIds = normalizedIds.filter((id) => !foundIdSet.has(id));

    if (listings.length < 2) {
      throw new NotFoundException(
        'Not enough listings found to perform a comparison',
      );
    }

    const categorySet = new Set(listings.map((item) => item.category));
    if (categorySet.size !== 1) {
      throw new BadRequestException(
        'Listings must share the same category (EV or battery) for comparison',
      );
    }

    const [category] = Array.from(categorySet);

    return buildComparisonResponse({
      category,
      listings: listings as unknown as ListingWithDetails[],
      missingIds,
      requestedOrder: normalizedIds,
    });
  }

  async findOne(id: string) {
    const listing = (await this.listingModel
      .findById(id)
      .populate('seller_id', 'name email phone')
      .populate('brand_id', 'name')
      .lean()) as (Listing & { _id: Types.ObjectId }) | null;

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    const [enriched] = await this.hydrateListings([listing]);
    return enriched ?? listing;
  }

  async updateStatus(id: string, status: ListingStatus) {
    const listing = await this.listingModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .lean<Listing & { _id: any }>();

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // Find users who favorited this listing
    const favorites = await this.favoriteModel
      .find({ listing_id: id })
      .select('user_id')
      .lean<Array<{ user_id?: any }>>();

    if (Array.isArray(favorites) && favorites.length > 0) {
      // Build notification type and message based on status
      const mapStatusToType = (s: ListingStatus) => {
        switch (s) {
          case ListingStatus.SOLD:
            return NotificationType.FAVORITE_LISTING_SOLD;
          case ListingStatus.ACTIVE:
            return NotificationType.LISTING_APPROVED;
          case ListingStatus.REMOVED:
          case ListingStatus.EXPIRED:
            return NotificationType.LISTING_REJECTED;
          default:
            return NotificationType.SYSTEM_ANNOUNCEMENT;
        }
      };

      const type = mapStatusToType(status);
      const title = listing.title || 'Tin rao bán';

      // Prefer the persisted listing.status (safer if caller passed undefined)
      const finalStatus = (listing as any).status ?? status;

      const statusLabels: Record<string, string> = {
        [ListingStatus.DRAFT]: 'bản nháp',
        [ListingStatus.ACTIVE]: 'đang hoạt động',
        [ListingStatus.SOLD]: 'đã bán',
        [ListingStatus.EXPIRED]: 'hết hạn',
        [ListingStatus.REMOVED]: 'đã gỡ',
      };

      const humanStatus = finalStatus
        ? statusLabels[String(finalStatus)] ?? String(finalStatus)
        : 'không xác định';

      const message =
        finalStatus === ListingStatus.SOLD
          ? `Một tin bạn đã đánh dấu yêu thích đã được bán: "${title}".`
          : `Trạng thái tin "${title}" đã thay đổi thành: ${humanStatus}.`;

      // Send notifications (best-effort — don't fail update if notifications fail)
      await Promise.all(
        favorites.map(async (fav) => {
          const userId = fav?.user_id ? String(fav.user_id) : undefined;
          if (!userId) return null;
          try {
            await this.notificationsService.create({
              user_id: userId,
              message,
              type,
              related_id: String(listing._id),
              action_url: `/listings/${String(listing._id)}`,
            } as any);
          } catch (err) {
            // Log and continue
            console.error('Failed to create favorite notification', {
              listingId: id,
              userId,
              err: err?.message ?? err,
            });
          }
          return null;
        }),
      );
    }

    return listing;
  }




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
    const listingCategory = String(listing.category);

    if (listingCategory === CategoryEnum.EV) {
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
    } else if (listingCategory === CategoryEnum.BATTERY) {
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
    const { condition } = dto;

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

    const recommendations = (await this.listingModel
      .find(recommendationQuery)
      .sort({ is_featured: -1, createdAt: -1 })
      .limit(limit)
      .lean()) as Array<Listing & { _id: Types.ObjectId; createdAt?: Date }>;

    return this.hydrateListings(recommendations);
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

      if (status) {
        query.status = status;
      }

      // Execute query with pagination
      const [data, total] = await Promise.all([
        this.listingModel
          .find(query)
          .select([
            'category',
            'brand_id',
            'seller_id',
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

      const dataWithDetails = await this.hydrateListings(
        Array.isArray(data) ? data : [],
      );

      // Return formatted response
      return {
        data: dataWithDetails,
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
