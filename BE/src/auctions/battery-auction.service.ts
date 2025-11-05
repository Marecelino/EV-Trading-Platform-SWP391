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
import {
  Payment,
  PaymentDocument,
  PaymentStatus,
  PaymentMethod,
} from '../payment/schemas/payment.schema';
import { PaymentService } from '../payment/payment.service';
import { User, UserDocument } from '../model/users.schema';

@Injectable()
export class BatteryAuctionService {
  constructor(
    @InjectModel(Auction.name) private readonly auctionModel: Model<any>,
    @InjectModel(Listing.name)
    private readonly listingModel: Model<ListingDocument>,
    @InjectModel(BatteryDetail.name)
    private readonly batteryDetailModel: Model<any>,
    @InjectModel(Brand.name) private readonly brandModel: Model<BrandDocument>,
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly paymentService: PaymentService,
  ) {}

  private escapeRegex(input: string) {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async create(dto: any, authUserId?: string, ipAddress?: string) {
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
    // New auctions start as DRAFT; payment must be completed to move to PENDING
    payload['status'] = status ?? AuctionStatus.DRAFT;
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

    // Create a listing fee payment record (seller pays listing fee)
    try {
      const listingFeeAmount = 150000; // VND
      const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com';
      let platformSellerId: any = (saved as any).seller_id;
      try {
        const admin = await this.userModel
          .findOne({ email: adminEmail })
          .lean();
        if (admin && admin._id) platformSellerId = admin._id;
      } catch (e) {
        // ignore — fallback to auction's seller_id
      }

      // Determine who should be recorded as the buyer (payer) for the listing fee.
      // Prefer the authenticated request user when available so authorization
      // checks in PaymentService succeed when we attempt to build a VNPay URL.
      const requestBuyer = authUserId ?? String((saved as any).seller_id);

      const payment = await this.paymentModel.create({
        buyer_id: requestBuyer,
        seller_id: platformSellerId,
        auction_id: saved._id,
        is_listing_fee: true,
        amount: listingFeeAmount,
        payment_method: PaymentMethod.VNPAY,
        status: PaymentStatus.PENDING,
      } as any);
      (saved as any)._listingFeePayment = payment;
      // Try to build VNPay URL via PaymentService (preferred) using requester context
      try {
        const ip = ipAddress ?? '127.0.0.1';
        const { paymentUrl } =
          await this.paymentService.createVNPayUrlForPayment(
            (payment._id as any).toString(),
            requestBuyer,
            ip,
          );
        (saved as any)._listingFeePayment.paymentUrl = paymentUrl;
      } catch (e) {
        // Non-fatal: frontend can request URL separately via GET /payment/:id/url
        // eslint-disable-next-line no-console
        console.warn(
          'Failed to build VNPay URL for listing fee payment',
          e?.message || e,
        );
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(
        'Failed to create listing fee payment record',
        err?.message || err,
      );
    }

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

    const auctionObj: any = saved.toObject();
    const listingPayment: any = (saved as any)._listingFeePayment || null;
    if (listingPayment) {
      // ensure payment object is plain JS object
      auctionObj._listingFeePayment = listingPayment;
    }

    return {
      auction: auctionObj,
      batteryDetail,
      payment: listingPayment,
      paymentUrl: listingPayment?.paymentUrl ?? null,
    };
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
