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
import { EVDetail } from '../model/evdetails';
import { Brand, BrandDocument } from '../model/brands';

@Injectable()
export class EVAuctionService {
  constructor(
    @InjectModel(Auction.name) private readonly auctionModel: Model<any>,
    @InjectModel(Listing.name)
    private readonly listingModel: Model<ListingDocument>,
    @InjectModel(EVDetail.name) private readonly evDetailModel: Model<any>,
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

    payload['category'] = CategoryEnum.EV;
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

    // Upsert EVDetail: match by auction_id or listing_id (if provided)
    const selectorClauses: any[] = [{ auction_id: saved._id }];
    // If client provided a listing_id, try to match it. Otherwise match existing docs
    // where listing_id is null (or missing) so upsert will update that doc instead
    // of attempting to insert another document that would violate the unique index.
    if (dto.listing_id) {
      selectorClauses.push({ listing_id: dto.listing_id });
    } else {
      selectorClauses.push({ listing_id: null });
    }

    const evPayload: any = {
      year: dto.year,
      mileage_km: dto.mileage,
      battery_capacity_kwh: dto.battery_capacity,
      range_km: dto.range,
    };
    Object.keys(evPayload).forEach(
      (k) => evPayload[k] === undefined && delete evPayload[k],
    );

    const update: any = { $set: { ...evPayload, auction_id: saved._id } };
    if (dto.listing_id) update.$set.listing_id = dto.listing_id;

    const evDetail = await this.evDetailModel
      .findOneAndUpdate({ $or: selectorClauses }, update, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      })
      .lean();

    return { auction: saved.toObject(), evDetail };
  }

  async update(id: string, dto: any) {
    // Update listing fields
    const updatePayload: Record<string, unknown> = { ...dto };
    // prevent changing category through this method
    delete updatePayload['category'];

    if (dto.brand_name) {
      // resolve brand to id if brand_name provided
      const brand = await this.brandModel.findOne({
        name: new RegExp(`^${this.escapeRegex(dto.brand_name)}$`, 'i'),
      });
      if (!brand)
        throw new NotFoundException(`Brand \"${dto.brand_name}\" not found`);
      updatePayload['brand_id'] = brand._id;
      delete updatePayload['brand_name'];
    }

    const auction = await this.auctionModel
      .findByIdAndUpdate(id, updatePayload, { new: true, runValidators: true })
      .lean();
    if (!auction) throw new NotFoundException('Auction not found');

    // Update or create EV detail
    const evPayload: any = {};
    if (dto.year !== undefined) evPayload.year = dto.year;
    if (dto.mileage !== undefined) evPayload.mileage_km = dto.mileage;
    if (dto.battery_capacity !== undefined)
      evPayload.battery_capacity_kwh = dto.battery_capacity;
    if (dto.range !== undefined) evPayload.range_km = dto.range;

    if (Object.keys(evPayload).length > 0) {
      const selectorClauses: any[] = [{ auction_id: id }];
      if ((auction as any).listing_id)
        selectorClauses.push({
          listing_id: (auction as any).listing_id.toString(),
        });

      const update: any = { $set: { ...evPayload, auction_id: id } };
      if ((auction as any).listing_id)
        update.$set.listing_id = (auction as any).listing_id;

      await this.evDetailModel
        .findOneAndUpdate({ $or: selectorClauses }, update, {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        })
        .exec();
    }

    return auction;
  }
}
