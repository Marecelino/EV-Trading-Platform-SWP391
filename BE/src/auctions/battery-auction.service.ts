import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Auction, AuctionStatus } from '../model/auctions';
import {
  Listing,
  ListingDocument,
  CategoryEnum,
  ListingStatus,
} from '../model/listings';
import { BatteryDetail } from '../model/batterydetails';
import { Brand, BrandDocument } from '../model/brands';

@Injectable()
export class BatteryAuctionService {
  constructor(
    @InjectModel(Auction.name) private readonly auctionModel: Model<any>,
    @InjectModel(Listing.name)
    private readonly listingModel: Model<ListingDocument>,
    @InjectModel(BatteryDetail.name)
    private readonly batteryDetailModel: Model<any>,
    @InjectModel(Brand.name) private readonly brandModel: Model<BrandDocument>,
  ) {}

  private escapeRegex(input: string) {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async create(dto: any) {
    const { brand_name, status, ...rest } = dto;

    const payload: Record<string, unknown> = { ...rest };

    if (brand_name) {
      const brand = await this.brandModel.findOne({
        name: new RegExp(`^${this.escapeRegex(brand_name)}$`, 'i'),
      });
      if (!brand)
        throw new NotFoundException(`Brand \"${brand_name}\" not found`);
      payload['brand_id'] = brand._id;
    }

    payload['category'] = CategoryEnum.BATTERY;
    payload['status'] = status ?? AuctionStatus.SCHEDULED;
    if (payload['starting_price'] === undefined) {
      throw new BadRequestException('starting_price is required for auction');
    }
    // coerce to number if needed
    const starting = Number(payload['starting_price']);
    if (Number.isNaN(starting) || starting < 0) {
      throw new BadRequestException(
        'starting_price must be a non-negative number',
      );
    }
    payload['starting_price'] = starting;
    payload['current_price'] = starting;

    // Tạo auction
    const auction = new this.auctionModel(payload);
    const saved = await auction.save();

    // Upsert BatteryDetail: match by auction_id or listing_id (if provided)
    const selectorClauses: any[] = [{ auction_id: saved._id }];
    // If client provided a listing_id, try to match it. Otherwise match existing docs
    // where listing_id is null so upsert will update that doc instead of inserting
    // a new one that would conflict with the unique index on listing_id.
    if (dto.listing_id) {
      selectorClauses.push({ listing_id: dto.listing_id });
    } else {
      selectorClauses.push({ listing_id: null });
    }

    const batPayload: any = {
      capacity_kwh: dto.capacity_kwh ?? dto.battery_capacity,
      soh_percent: dto.soh_percent,
    };
    Object.keys(batPayload).forEach(
      (k) => batPayload[k] === undefined && delete batPayload[k],
    );

    const update: any = { $set: { ...batPayload, auction_id: saved._id } };
    if (dto.listing_id) update.$set.listing_id = dto.listing_id;

    const batteryDetail = await this.batteryDetailModel
      .findOneAndUpdate({ $or: selectorClauses }, update, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      })
      .lean();

    return { auction: saved.toObject(), batteryDetail };
  }

  async update(auctionId: string, dto: any) {
    const auction = await this.auctionModel.findById(auctionId);
    if (!auction) throw new NotFoundException('Auction not found');

    if (
      [AuctionStatus.ENDED, AuctionStatus.CANCELLED].includes(auction.status)
    ) {
      throw new BadRequestException(
        'Cannot update ended or cancelled auctions',
      );
    }

    const listingId = auction.listing_id?.toString();
    if (!listingId)
      throw new BadRequestException('Auction has no linked listing');

    const updateListingPayload: any = { ...dto };
    delete updateListingPayload['category'];

    if (dto.brand_name) {
      const brand = await this.brandModel.findOne({
        name: new RegExp(`^${this.escapeRegex(dto.brand_name)}$`, 'i'),
      });
      if (!brand)
        throw new NotFoundException(`Brand "${dto.brand_name}" not found`);
      updateListingPayload['brand_id'] = brand._id;
      delete updateListingPayload['brand_name'];
    }

    const updatedListing = await this.listingModel
      .findByIdAndUpdate(listingId, updateListingPayload, {
        new: true,
        runValidators: true,
      })
      .lean();
    if (!updatedListing)
      throw new NotFoundException('Linked listing not found');

    const batPayload: any = {};
    if (dto.capacity_kwh !== undefined)
      batPayload.capacity_kwh = dto.capacity_kwh;
    if (dto.battery_capacity !== undefined)
      batPayload.capacity_kwh = dto.battery_capacity;
    if (dto.soh_percent !== undefined) batPayload.soh_percent = dto.soh_percent;

    if (Object.keys(batPayload).length > 0) {
      const selectorClauses: any[] = [{ auction_id: auctionId }];
      if (listingId) selectorClauses.push({ listing_id: listingId });

      const update: any = { $set: { ...batPayload, auction_id: auctionId } };
      if (listingId) update.$set.listing_id = listingId;

      await this.batteryDetailModel
        .findOneAndUpdate({ $or: selectorClauses }, update, {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        })
        .exec();
    }

    const updateAuctionPayload: any = {};
    if (dto.start_time)
      updateAuctionPayload.start_time = new Date(dto.start_time);
    if (dto.end_time) updateAuctionPayload.end_time = new Date(dto.end_time);
    if (dto.starting_price !== undefined)
      updateAuctionPayload.starting_price = dto.starting_price;
    if (dto.min_increment !== undefined)
      updateAuctionPayload.min_increment = dto.min_increment;
    if (dto.buy_now_price !== undefined)
      updateAuctionPayload.buy_now_price = dto.buy_now_price;

    if (updateAuctionPayload.start_time && updateAuctionPayload.end_time) {
      if (updateAuctionPayload.end_time <= updateAuctionPayload.start_time) {
        throw new BadRequestException('End time must be after start time');
      }
    }

    const updatedAuction = await this.auctionModel
      .findByIdAndUpdate(auctionId, updateAuctionPayload, {
        new: true,
        runValidators: true,
      })
      .lean();

    return { auction: updatedAuction, listing: updatedListing };
  }
}
