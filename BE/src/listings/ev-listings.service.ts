import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Listing, ListingDocument, CategoryEnum, ListingStatus } from '../model/listings';
import { EVDetail } from '../model/evdetails';
import { Brand, BrandDocument } from '../model/brands';

@Injectable()
export class EVListingsService {
    constructor(
        @InjectModel(Listing.name)
        private readonly listingModel: Model<ListingDocument>,
        @InjectModel(EVDetail.name)
        private readonly evDetailModel: Model<any>,
        @InjectModel(Brand.name)
        private readonly brandModel: Model<BrandDocument>,
    ) { }

    private escapeRegex(input: string) {
        return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    async create(dto: any) {
        const { brand_name, model_name, category, status, ...rest } = dto;

        const payload: Record<string, unknown> = { ...rest };

        // resolve brand
        if (brand_name) {
            const brand = await this.brandModel.findOne({
                name: new RegExp(`^${this.escapeRegex(brand_name)}$`, 'i'),
            });
            if (!brand) throw new NotFoundException(`Brand \"${brand_name}\" not found`);
            payload['brand_id'] = brand._id;
        }

        payload['category'] = CategoryEnum.EV;
        payload['status'] = status ?? ListingStatus.DRAFT;

        const listing = new this.listingModel(payload);
        const saved = await listing.save();

        // create EVDetail
        const evPayload: any = {
            listing_id: saved._id,
            year: dto.year,
            mileage_km: dto.mileage,
            battery_capacity_kwh: dto.battery_capacity,
            range_km: dto.range,
        };
        Object.keys(evPayload).forEach((k) => evPayload[k] === undefined && delete evPayload[k]);
        const evDetail = await this.evDetailModel.create(evPayload);

        // Trả về cả listing và evDetail
        return { listing: saved.toObject(), evDetail: evDetail.toObject() };
    }

    async update(id: string, dto: any) {
        // Lấy listing để kiểm tra category
        const listing = await this.listingModel.findById(id).lean();
        if (!listing) throw new NotFoundException('Listing not found');
        if (listing.category !== CategoryEnum.EV) {
            throw new NotFoundException('Chỉ được cập nhật listing loại EV');
        }

        const updatePayload: Record<string, unknown> = { ...dto };
        // prevent changing category through this method
        delete updatePayload['category'];

        if (dto.brand_name) {
            // resolve brand to id if brand_name provided
            const brand = await this.brandModel.findOne({
                name: new RegExp(`^${this.escapeRegex(dto.brand_name)}$`, 'i'),
            });
            if (!brand) throw new NotFoundException(`Brand \"${dto.brand_name}\" not found`);
            updatePayload['brand_id'] = brand._id;
            delete updatePayload['brand_name'];
        }

        const updatedListing = await this.listingModel.findByIdAndUpdate(id, updatePayload, { new: true, runValidators: true }).lean();
        if (!updatedListing) throw new NotFoundException('Listing not found');

        // Update or create EV detail
        const evPayload: any = {};
        if (dto.year !== undefined) evPayload.year = dto.year;
        if (dto.mileage !== undefined) evPayload.mileage_km = dto.mileage;
        if (dto.battery_capacity !== undefined) evPayload.battery_capacity_kwh = dto.battery_capacity;
        if (dto.range !== undefined) evPayload.range_km = dto.range;

        let evDetail: any = null;
        if (Object.keys(evPayload).length > 0) {
            evDetail = await this.evDetailModel.findOneAndUpdate(
                { listing_id: id },
                { $set: evPayload },
                { upsert: true, new: true, setDefaultsOnInsert: true },
            ).lean();
        } else {
            evDetail = await this.evDetailModel.findOne({ listing_id: id }).lean();
        }

        // Trả về cả listing và evDetail
        return { listing: updatedListing, evDetail };
    }
}
