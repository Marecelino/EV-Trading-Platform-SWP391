import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Listing,
  ListingDocument,
  CategoryEnum,
  ListingStatus,
} from '../model/listings';
import { BatteryDetail } from '../model/batterydetails';
import { Brand, BrandDocument } from '../model/brands';

@Injectable()
export class BatteryListingsService {
  constructor(
    @InjectModel(Listing.name)
    private readonly listingModel: Model<ListingDocument>,
    @InjectModel(BatteryDetail.name)
    private readonly batteryDetailModel: Model<any>,
    @InjectModel(Brand.name)
    private readonly brandModel: Model<BrandDocument>,
  ) {}

  private escapeRegex(input: string) {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async create(dto: any) {
    const { brand_name, model_name, category, status, ...rest } = dto;

    const payload: Record<string, unknown> = { ...rest };

    // Prevent accidental duplicate creates: if the same seller created a listing with the same
    // title very recently (within 10s), return the existing one instead of creating a new doc.
    if (payload['seller_id'] && payload['title']) {
      const recent = (await this.listingModel
        .findOne({ seller_id: payload['seller_id'], title: payload['title'] })
        .sort({ createdAt: -1 })
        .lean()) as any;
      if (recent) {
        const age = Date.now() - new Date(recent.createdAt).getTime();
        if (age < 10000) {
          const batteryDetail = await this.batteryDetailModel
            .findOne({ listing_id: recent._id })
            .lean();
          return { listing: recent, batteryDetail };
        }
      }
    }

    // resolve brand
    if (brand_name) {
      const brand = await this.brandModel.findOne({
        name: new RegExp(`^${this.escapeRegex(brand_name)}$`, 'i'),
      });
      if (!brand)
        throw new NotFoundException(`Brand \"${brand_name}\" not found`);
      payload['brand_id'] = brand._id;
    }

    payload['category'] = CategoryEnum.BATTERY;
    payload['status'] = status ?? ListingStatus.DRAFT;

    const listing = new this.listingModel(payload);
    const saved = await listing.save();

    // create BatteryDetail
    const batteryPayload: any = {
      listing_id: saved._id,
      capacity_kwh: dto.capacity_kwh ?? dto.battery_capacity,
      soh_percent: dto.soh_percent,
    };
    Object.keys(batteryPayload).forEach(
      (k) => batteryPayload[k] === undefined && delete batteryPayload[k],
    );
    const batteryDetail = await this.batteryDetailModel.create(batteryPayload);

    // Trả về cả listing và batteryDetail
    return {
      listing: saved.toObject(),
      batteryDetail: batteryDetail.toObject(),
    };
  }

  async update(id: string, dto: any) {
    // Lấy listing để kiểm tra category
    const listing = await this.listingModel.findById(id).lean();
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.category !== CategoryEnum.BATTERY) {
      throw new NotFoundException('Chỉ được cập nhật listing loại battery');
    }

    const updatePayload: Record<string, unknown> = { ...dto };
    // prevent changing category
    delete updatePayload['category'];

    if (dto.brand_name) {
      const brand = await this.brandModel.findOne({
        name: new RegExp(`^${this.escapeRegex(dto.brand_name)}$`, 'i'),
      });
      if (!brand)
        throw new NotFoundException(`Brand \"${dto.brand_name}\" not found`);
      updatePayload['brand_id'] = brand._id;
      delete updatePayload['brand_name'];
    }

    const updatedListing = await this.listingModel
      .findByIdAndUpdate(id, updatePayload, { new: true, runValidators: true })
      .lean();

    const batPayload: any = {};
    if (dto.capacity_kwh !== undefined)
      batPayload.capacity_kwh = dto.capacity_kwh;
    if (dto.battery_capacity !== undefined)
      batPayload.capacity_kwh = dto.battery_capacity;
    if (dto.soh_percent !== undefined) batPayload.soh_percent = dto.soh_percent;

    let batteryDetail: any = null;
    if (Object.keys(batPayload).length > 0) {
      batteryDetail = await this.batteryDetailModel
        .findOneAndUpdate(
          { listing_id: id },
          { $set: batPayload },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        )
        .lean();
    } else {
      batteryDetail = await this.batteryDetailModel
        .findOne({ listing_id: id })
        .lean();
    }

    return { listing: updatedListing, batteryDetail };
  }
}
