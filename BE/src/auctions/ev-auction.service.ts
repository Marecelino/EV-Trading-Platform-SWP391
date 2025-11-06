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
import {
  Payment,
  PaymentDocument,
  PaymentStatus,
  PaymentMethod,
} from '../payment/schemas/payment.schema';
import { PaymentService } from '../payment/payment.service';
import { User, UserDocument } from '../model/users.schema';

@Injectable()
export class EVAuctionService {
  constructor(
    @InjectModel(Auction.name) private readonly auctionModel: Model<any>,
    @InjectModel(Listing.name)
    private readonly listingModel: Model<ListingDocument>,
    @InjectModel(EVDetail.name) private readonly evDetailModel: Model<any>,
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

    payload['category'] = CategoryEnum.EV;
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
      const listingFeeAmount = 15000; // VND
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

      // Prefer the authenticated requester as the buyer (payer) for the listing fee.
      const requestBuyer = authUserId ?? String((saved as any).seller_id);

      const payment = await this.paymentModel.create({
        buyer_id: requestBuyer, // use authenticated user when available
        seller_id: platformSellerId,
        auction_id: saved._id,
        is_listing_fee: true,
        amount: listingFeeAmount,
        payment_method: PaymentMethod.VNPAY,
        status: PaymentStatus.PENDING,
      } as any);

      (saved as any)._listingFeePayment = payment;

      // Try to build VNPay URL using authenticated user and client IP
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
        // Non-fatal: frontend can request URL separately via payment endpoint
        // eslint-disable-next-line no-console
        console.warn(
          'Failed to build VNPay URL for listing fee payment',
          e?.message || e,
        );
      }
    } catch (err) {
      // Non-fatal: log and continue creating auction. Caller can create payment later.
      // eslint-disable-next-line no-console
      console.warn(
        'Failed to create listing fee payment record',
        err?.message || err,
      );
    }

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

    const auctionObj: any = saved.toObject();
    const listingPayment: any = (saved as any)._listingFeePayment || null;
    if (listingPayment) {
      auctionObj._listingFeePayment = listingPayment;
    }

    return {
      auction: auctionObj,
      evDetail,
      payment: listingPayment,
      paymentUrl: listingPayment?.paymentUrl ?? null,
    };
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
