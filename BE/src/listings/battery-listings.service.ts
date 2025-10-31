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
import {
  Payment,
  PaymentDocument,
  PaymentStatus,
  PaymentMethod,
} from '../payment/schemas/payment.schema';
import { PaymentService } from '../payment/payment.service';
import { User, UserDocument } from '../model/users.schema';

@Injectable()
export class BatteryListingsService {
  constructor(
    @InjectModel(Listing.name)
    private readonly listingModel: Model<ListingDocument>,
    @InjectModel(BatteryDetail.name)
    private readonly batteryDetailModel: Model<any>,
    @InjectModel(Brand.name)
    private readonly brandModel: Model<BrandDocument>,
    @InjectModel(Payment.name) private readonly paymentModel: Model<PaymentDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly paymentService: PaymentService,
  ) { }

  private escapeRegex(input: string) {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async create(dto: any, authUserId?: string, ipAddress?: string) {
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
    // New listings default to payment_pending so seller can pay listing fee
    payload['status'] = status ?? ListingStatus.PAYMENT_PENDING;

    const listing = new this.listingModel(payload);
    const saved = await listing.save();

    // Create listing fee payment record
    try {
      const listingFeeAmount = 15000; // VND
      const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com';
      let platformSellerId: any = (saved as any).seller_id;
      try {
        const admin = await this.userModel.findOne({ email: adminEmail }).lean();
        if (admin && admin._id) platformSellerId = admin._id;
      } catch (e) {
        // ignore — fallback to listing's seller_id
      }

      const requestBuyer = authUserId ?? String((saved as any).seller_id);

      const payment = await this.paymentModel.create({
        buyer_id: requestBuyer,
        seller_id: platformSellerId,
        listing_id: saved._id,
        amount: listingFeeAmount,
        payment_method: PaymentMethod.VNPAY,
        status: PaymentStatus.PENDING,
      } as any);
      (saved as any)._listingFeePayment = payment;
      try {
        const ip = ipAddress ?? '127.0.0.1';
        const { paymentUrl } = await this.paymentService.createVNPayUrlForPayment(
          (payment._id as any).toString(),
          requestBuyer,
          ip,
        );
        (saved as any)._listingFeePayment.paymentUrl = paymentUrl;
      } catch (err) {
        console.warn('Failed to build VNPay URL for listing fee payment', err?.message || err);
      }
    } catch (err) {
      console.warn('Failed to create listing fee payment record', err?.message || err);
    }

    // create BatteryDetail
    const batteryPayload: any = {
      listing_id: saved._id,
      capacity_kwh: dto.capacity_kwh ?? dto.battery_capacity,
      soh_percent: dto.soh_percent,
      battery_type: dto.battery_type,
      manufacture_year: dto.manufacture_year,
    };
    Object.keys(batteryPayload).forEach(
      (k) => batteryPayload[k] === undefined && delete batteryPayload[k],
    );
    const batteryDetail = await this.batteryDetailModel.create(batteryPayload);

    // Trả về cả listing and batteryDetail (include payment info if present)
    const listingObj: any = saved.toObject();
    if ((saved as any)._listingFeePayment) listingObj._listingFeePayment = (saved as any)._listingFeePayment;
    return {
      listing: listingObj,
      batteryDetail: batteryDetail.toObject(),
      payment: (saved as any)._listingFeePayment ?? null,
      paymentUrl: (saved as any)._listingFeePayment?.paymentUrl ?? null,
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
    if (dto.battery_type !== undefined)
      batPayload.battery_type = dto.battery_type;
    if (dto.manufacture_year !== undefined)
      batPayload.manufacture_year = dto.manufacture_year;

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
