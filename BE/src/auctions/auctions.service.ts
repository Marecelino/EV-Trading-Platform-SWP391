import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as mongoose from 'mongoose';
import { Auction, AuctionStatus } from '../model/auctions';
import { PaymentListingStatus } from '../model/listings';
import { Favorite, FavoriteDocument } from '../model/favorites';
import { NotificationType } from '../model/notifications';
import { NotificationsService } from '../notifications/notifications.service';
import { UpdateAuctionDto } from './dto/update-auction.dto';
import { CreateBidDto } from './dto/create-bid.dto';

@Injectable()
export class AuctionsService {
  constructor(
    @InjectModel(Auction.name) private auctionModel: Model<Auction>,
    @InjectModel('EVDetail') private evDetailModel: Model<any>,
    @InjectModel('BatteryDetail') private batteryDetailModel: Model<any>,
    @InjectModel(Favorite.name)
    private readonly favoriteModel: Model<FavoriteDocument>,
    private readonly notificationsService: NotificationsService,
  ) { }

  /**
   * CREATE - Create new auction
   */

  /**
   * READ - Get all auctions with pagination
   */
  async findAll(page = 1, limit = 10, filter = {}) {
    try {
      const skip = (page - 1) * limit;

      const [auctions, total] = await Promise.all([
        this.auctionModel
          .find(filter)
          .populate([
            { path: 'seller_id', select: 'name email phone' },
            { path: 'bids.user_id', select: 'name email phone' },
          ])
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        this.auctionModel.countDocuments(filter),
      ]);

      const dataWithDetail = await Promise.all(
        auctions.map(async (auction) => {
          const category = String(
            (auction as any).category || '',
          ).toLowerCase();
          const auctionId = (auction as any)._id;

          if (category === 'ev') {
            const evDetail = await this.evDetailModel
              .findOne({ auction_id: auctionId })
              .lean();
            return { ...auction, auction_id: auctionId, evDetail };
          }
          if (category === 'battery') {
            const batteryDetail = await this.batteryDetailModel
              .findOne({ auction_id: auctionId })
              .lean();
            return { ...auction, auction_id: auctionId, batteryDetail };
          }

          return { ...auction, auction_id: auctionId };
        }),
      );

      return {
        data: dataWithDetail,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      };
    } catch (error) {
      throw new BadRequestException(
        'Failed to fetch auctions: ' + error.message,
      );
    }
  }
  /**
   * READ - Get auction by ID
   */
  async findOne(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid auction ID');
    }

    try {
      const auctionDoc = await this.auctionModel
        .findById(id)
        .populate('seller_id', 'name email phone')
        .populate('bids.user_id', 'name email phone')
        .exec();

      if (!auctionDoc) {
        throw new NotFoundException('Auction not found');
      }

      // Convert to plain object and attach detail document by auction_id
      const auction = auctionDoc.toObject
        ? auctionDoc.toObject()
        : (auctionDoc as any);
      const category = String(auction.category || '').toLowerCase();
      const auctionId = auction._id;

      if (category === 'ev') {
        const evDetail = await this.evDetailModel
          .findOne({ auction_id: auctionId })
          .lean();
        return { ...auction, auction_id: auctionId, evDetail };
      }
      if (category === 'battery') {
        const batteryDetail = await this.batteryDetailModel
          .findOne({ auction_id: auctionId })
          .lean();
        return { ...auction, auction_id: auctionId, batteryDetail };
      }

      return { ...auction, auction_id: auctionId };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        'Failed to fetch auction: ' + error.message,
      );
    }
  }

  /**
   * READ - Get auctions by user (seller)
   */
  async findBySeller(userId: string, page = 1, limit = 10) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    return this.findAll(page, limit, { seller_id: userId });
  }

  /**
   * READ - Get live auctions
   */
  async findLiveAuctions(page = 1, limit = 10) {
    return this.findAll(page, limit, { status: AuctionStatus.LIVE });
  }

  /**
   * UPDATE - Update auction
   */
  async update(id: string, dto: UpdateAuctionDto) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid auction ID');
    }

    try {
      const auction = await this.auctionModel.findById(id);
      if (!auction) {
        throw new NotFoundException('Auction not found');
      }

      const oldStatus = auction.status;
      // Preserve old price to detect price updates and notify favorites
      const oldPrice = (auction as any).current_price;

      // Prevent updates to ended or cancelled auctions
      if (
        [AuctionStatus.ENDED, AuctionStatus.CANCELLED].includes(auction.status)
      ) {
        throw new BadRequestException(
          'Cannot update ended or cancelled auctions',
        );
      }

      // Prepare update data
      const updateData: any = { ...dto };
      if (dto.start_time) updateData.start_time = new Date(dto.start_time);
      if (dto.end_time) updateData.end_time = new Date(dto.end_time);

      // Validate dates if updating both
      if (updateData.start_time && updateData.end_time) {
        if (updateData.end_time <= updateData.start_time) {
          throw new BadRequestException('End time must be after start time');
        }
      }

      const updatedDoc = await this.auctionModel
        .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
        .populate('seller_id', 'name email phone')
        .populate('bids.user_id', 'name email phone')
        .exec();

      if (!updatedDoc) {
        throw new NotFoundException('Auction not found after update');
      }

      // If status changed to ENDED, notify users who favorited this auction
      try {
        const updatedStatus = updatedDoc.status;
        const auctionIdStr = String(updatedDoc._id);
        if (oldStatus !== AuctionStatus.ENDED && updatedStatus === AuctionStatus.ENDED) {
          const favorites = await this.favoriteModel.find({ auction_id: auctionIdStr }).lean();
          const recipients = (favorites || []).map((f) => String(f.user_id));

          if (recipients.length > 0) {
            await Promise.all(
              recipients.map((uid) =>
                this.notificationsService.create({
                  user_id: uid,
                  message: `Auction "${updatedDoc.title}" has ended.`,
                  type: NotificationType.FAVORITE_AUCTION_SOLD as any,
                  related_id: auctionIdStr,
                  action_url: `/auctions/${auctionIdStr}`,
                }),
              ),
            );
          }
        }
      } catch (err) {
        console.error('Failed to create favorite notifications for auction status update', err);
      }

      // If price changed as part of this update, notify favorites
      try {
        const newPrice = (updatedDoc as any).current_price;
        const auctionIdStr = String(updatedDoc._id);
        if (typeof oldPrice !== 'undefined' && typeof newPrice !== 'undefined' && oldPrice !== newPrice) {
          // Build selectors to match favorites by auction_id (ObjectId or string)
          // and also by listing_id if this auction is tied to a listing.
          const selectors: any[] = [];
          if (mongoose.Types.ObjectId.isValid(auctionIdStr)) selectors.push({ auction_id: new mongoose.Types.ObjectId(auctionIdStr) });
          selectors.push({ auction_id: auctionIdStr });

          const listingId = ((updatedDoc as any).listing_id && String(((updatedDoc as any).listing_id as any)?._id ?? (updatedDoc as any).listing_id)) || null;
          if (listingId) {
            if (mongoose.Types.ObjectId.isValid(listingId)) selectors.push({ listing_id: new mongoose.Types.ObjectId(listingId) });
            selectors.push({ listing_id: listingId });
          }

          const favorites = await this.favoriteModel.find({ $or: selectors }).lean();
          const recipients = (favorites || []).map((f) => String(f.user_id));

          if (recipients.length > 0) {
            await Promise.all(
              recipients.map((uid) =>
                this.notificationsService.create({
                  user_id: uid,
                  message: `Price updated to ${newPrice} on auction "${updatedDoc.title}".`,
                  type: NotificationType.FAVORITE_AUCTION_BID as any,
                  related_id: auctionIdStr,
                  action_url: `/auctions/${auctionIdStr}`,
                }),
              ),
            );
          }
        }
      } catch (err) {
        console.error('Failed to create favorite notifications for auction price update', err);
      }

      const updated = updatedDoc.toObject
        ? updatedDoc.toObject()
        : (updatedDoc as any);
      const category = String(updated.category || '').toLowerCase();
      const auctionId = updated._id;

      if (category === 'ev') {
        const evDetail = await this.evDetailModel
          .findOne({ auction_id: auctionId })
          .lean();
        return { ...updated, auction_id: auctionId, evDetail };
      }
      if (category === 'battery') {
        const batteryDetail = await this.batteryDetailModel
          .findOne({ auction_id: auctionId })
          .lean();
        return { ...updated, auction_id: auctionId, batteryDetail };
      }

      return { ...updated, auction_id: auctionId };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        'Failed to update auction: ' + error.message,
      );
    }
  }

  /**
   * UPDATE STATUS - Update auction status and notify favorites (best-effort)
   */
  async updateStatus(id: string, status: AuctionStatus) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid auction ID');
    }

    try {
      const updatedDoc = await this.auctionModel
        .findByIdAndUpdate(id, { status }, { new: true })
        .populate('seller_id', 'name email phone')
        .populate('bids.user_id', 'name email phone')
        .exec();

      if (!updatedDoc) {
        throw new NotFoundException('Auction not found');
      }

      // Notify favorites (match by auction_id and listing_id if present)
      try {
        const auctionIdStr = String(updatedDoc._id);
        const selectors: any[] = [];
        if (mongoose.Types.ObjectId.isValid(auctionIdStr)) selectors.push({ auction_id: new mongoose.Types.ObjectId(auctionIdStr) });
        selectors.push({ auction_id: auctionIdStr });

        const listingId = ((updatedDoc as any).listing_id && String(((updatedDoc as any).listing_id as any)?._id ?? (updatedDoc as any).listing_id)) || null;
        if (listingId) {
          if (mongoose.Types.ObjectId.isValid(listingId)) selectors.push({ listing_id: new mongoose.Types.ObjectId(listingId) });
          selectors.push({ listing_id: listingId });
        }

        const favorites = await this.favoriteModel.find({ $or: selectors }).lean();
        const recipients = (favorites || []).map((f) => String((f as any).user_id));

        if (recipients.length > 0) {
          const message = status === AuctionStatus.ENDED
            ? `Auction "${(updatedDoc as any).title}" has ended.`
            : `Auction "${(updatedDoc as any).title}" status changed to ${String(status)}.`;

          const type = status === AuctionStatus.ENDED
            ? NotificationType.FAVORITE_AUCTION_SOLD
            : NotificationType.SYSTEM_ANNOUNCEMENT;

          await Promise.all(
            recipients.map((uid) =>
              this.notificationsService.create({
                user_id: uid,
                message,
                type: type as any,
                related_id: auctionIdStr,
                action_url: `/auctions/${auctionIdStr}`,
              }),
            ),
          );
        }
      } catch (err) {
        console.error('Failed to create favorite notifications for auction status update', err);
      }

      return updatedDoc.toObject ? updatedDoc.toObject() : (updatedDoc as any);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to update auction status: ' + error.message);
    }
  }

  /**
   * Update only the payment_status of an auction (e.g., PENDING -> COMPLETED).
   * Mirrors ListingsService.updatePaymentStatus for consistency.
   */
  async updatePaymentStatus(id: string, paymentStatus: PaymentListingStatus) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid auction ID');
    }

    const updated = await this.auctionModel
      .findByIdAndUpdate(id, { payment_status: paymentStatus }, { new: true })
      .populate('seller_id', 'name email phone')
      .populate('bids.user_id', 'name email phone')
      .lean();

    if (!updated) throw new NotFoundException('Auction not found');

    return updated as any;
  }

  /**
   * DELETE - Delete auction
   */
  async remove(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid auction ID');
    }

    try {
      const auction = await this.auctionModel.findById(id);
      if (!auction) {
        throw new NotFoundException('Auction not found');
      }

      // Business rules for deletion
      if (auction.bids && auction.bids.length > 0) {
        throw new BadRequestException(
          'Cannot delete auction with existing bids',
        );
      }

      if (auction.status === AuctionStatus.LIVE) {
        throw new BadRequestException('Cannot delete live auctions');
      }

      // Remove related details robustly (match auction_id and listing_id if present)
      const category = String((auction as any).category || '').toLowerCase();
      const listingId = (auction as any).listing_id
        ? (auction as any).listing_id.toString()
        : null;

      const selectors: any[] = [];
      if (mongoose.Types.ObjectId.isValid(id))
        selectors.push({ auction_id: new mongoose.Types.ObjectId(id) });
      selectors.push({ auction_id: id });
      if (listingId) {
        if (mongoose.Types.ObjectId.isValid(listingId))
          selectors.push({
            listing_id: new mongoose.Types.ObjectId(listingId),
          });
        selectors.push({ listing_id: listingId });
      }

      if (category === 'ev') {
        const found = await this.evDetailModel.find({ $or: selectors }).lean();
        if (found.length > 0) {
          const ids = found.map((d) => d._id).filter(Boolean);
          const del = await this.evDetailModel.deleteMany({
            _id: { $in: ids },
          });

          console.log('Deleted evdetails', {
            foundCount: found.length,
            deletedCount: del.deletedCount,
          });
        }
      } else if (category === 'battery') {
        const found = await this.batteryDetailModel
          .find({ $or: selectors })
          .lean();
        if (found.length > 0) {
          const ids = found.map((d) => d._id).filter(Boolean);
          const del = await this.batteryDetailModel.deleteMany({
            _id: { $in: ids },
          });

          console.log('Deleted batterydetails', {
            foundCount: found.length,
            deletedCount: del.deletedCount,
          });
        }
      }

      await this.auctionModel.findByIdAndDelete(id);

      return {
        message: 'Auction and related details deleted successfully',
        deletedId: id,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        'Failed to delete auction: ' + error.message,
      );
    }
  }

  /**
   * PLACE BID - Place bid on auction (without transaction for now)
   */
  async placeBid(auctionId: string, userId: string, dto: CreateBidDto) {
    if (!mongoose.Types.ObjectId.isValid(auctionId)) {
      throw new BadRequestException('Invalid auction ID');
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    try {
      const auction = await this.auctionModel.findById(auctionId);
      if (!auction) {
        throw new NotFoundException('Auction not found');
      }

      // Validate auction state
      const now = new Date();
      if (auction.status !== AuctionStatus.LIVE) {
        throw new BadRequestException('Auction is not live');
      }
      if (auction.end_time <= now) {
        throw new BadRequestException('Auction has ended');
      }
      if (auction.seller_id.toString() === userId) {
        throw new BadRequestException('User cannot bid on their own auction');
      }

      // Validate bid amount
      const minBid = auction.current_price + auction.min_increment;
      if (dto.amount < minBid) {
        throw new BadRequestException(`Minimum bid is ${minBid}`);
      }

      // Save old price for notification logic
      const oldPrice = auction.current_price;

      // Create bid record
      const bidRecord = {
        user_id: new mongoose.Types.ObjectId(userId),
        amount: dto.amount,
        created_at: now,
      };

      // Update auction
      auction.bids.unshift(bidRecord);
      auction.current_price = dto.amount;

      // Check buy now price
      if (auction.buy_now_price && dto.amount >= auction.buy_now_price) {
        auction.status = AuctionStatus.ENDED;
        auction.end_time = now;
      }

      await auction.save();

      // Return updated auction with related detail attached
      const updatedDoc = await this.auctionModel
        .findById(auctionId)
        .populate('seller_id', 'name email phone')
        .populate('bids.user_id', 'name email phone')
        .exec();

      if (!updatedDoc) {
        throw new NotFoundException('Auction not found after bidding');
      }

      const updated = updatedDoc.toObject
        ? updatedDoc.toObject()
        : (updatedDoc as any);
      const category = String(updated.category || '').toLowerCase();

      // attach detail document if available
      let result: any = { ...updated, auction_id: auctionId };
      if (category === 'ev') {
        const evDetail = await this.evDetailModel.findOne({ auction_id: auctionId }).lean();
        result = { ...result, evDetail };
      } else if (category === 'battery') {
        const batteryDetail = await this.batteryDetailModel.findOne({ auction_id: auctionId }).lean();
        result = { ...result, batteryDetail };
      }

      // Notifications to favorites from placeBid have been disabled.
      // If favorite notifications are needed for bids, handle them via a dedicated
      // background job or elsewhere to avoid duplicate/undesired sends.

      return result;
    } catch (error) {
      console.error('Place bid error:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to place bid: ' + error.message);
    }
  }

  /**
   * END AUCTION - End auction manually
   */
  async endAuction(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid auction ID');
    }

    try {
      const auction = await this.auctionModel.findById(id);
      if (!auction) {
        throw new NotFoundException('Auction not found');
      }

      if (auction.status === AuctionStatus.ENDED) {
        return auction;
      }

      if (
        ![AuctionStatus.LIVE, AuctionStatus.SCHEDULED].includes(auction.status)
      ) {
        throw new BadRequestException(
          'Only live or scheduled auctions can be ended',
        );
      }

      auction.status = AuctionStatus.ENDED;
      auction.end_time = new Date();

      const saved = await auction.save();

      // Notify users who favorited this auction that it ended
      try {
        // include favorites by auction_id and by listing_id (if the auction references a listing)
        const auctionIdStr = String(saved._id);
        const selectors: any[] = [];
        if (mongoose.Types.ObjectId.isValid(auctionIdStr)) selectors.push({ auction_id: new mongoose.Types.ObjectId(auctionIdStr) });
        selectors.push({ auction_id: auctionIdStr });
        const listingId = ((saved as any).listing_id && String(((saved as any).listing_id as any)?._id ?? (saved as any).listing_id)) || null;
        if (listingId) {
          if (mongoose.Types.ObjectId.isValid(listingId)) selectors.push({ listing_id: new mongoose.Types.ObjectId(listingId) });
          selectors.push({ listing_id: listingId });
        }

        const favorites = await this.favoriteModel.find({ $or: selectors }).lean();
        const recipients = (favorites || []).map((f) => String(f.user_id));

        if (recipients.length > 0) {
          await Promise.all(
            recipients.map((uid) =>
              this.notificationsService.create({
                user_id: uid,
                message: `Auction "${saved.title}" has ended.`,
                type: NotificationType.FAVORITE_AUCTION_SOLD as any,
                related_id: auctionIdStr,
                action_url: `/auctions/${auctionIdStr}`,
              }),
            ),
          );
        }
      } catch (err) {
        console.error('Failed to create favorite notifications for auction end', err);
      }

      return saved;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to end auction: ' + error.message);
    }
  }

  /**
   * ACTIVATE AUCTION - mark auction as live immediately.
   * If auction was scheduled with a future start_time/end_time, this will
   * set start_time to now and shift end_time by the original duration.
   */
  async activateAuction(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid auction ID');
    }

    try {
      const auction = await this.auctionModel.findById(id);
      if (!auction) throw new NotFoundException('Auction not found');

      if (auction.status === AuctionStatus.LIVE) return auction;
      if (auction.status === AuctionStatus.ENDED || auction.status === AuctionStatus.CANCELLED) {
        throw new BadRequestException('Cannot activate ended or cancelled auction');
      }

      const now = new Date();
      // compute existing duration if possible
      let durationMs = null as number | null;
      if (auction.start_time && auction.end_time) {
        durationMs = auction.end_time.getTime() - auction.start_time.getTime();
      }

      auction.start_time = now;
      if (durationMs && durationMs > 0) {
        auction.end_time = new Date(now.getTime() + durationMs);
      }
      auction.status = AuctionStatus.LIVE;

      await auction.save();

      const updated = await this.auctionModel
        .findById(id)
        .populate('seller_id', 'name email phone')
        .populate('bids.user_id', 'name email phone')
        .exec();

      return updated;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new BadRequestException('Failed to activate auction: ' + error.message);
    }
  }

  /**
   * TEST CONNECTION - Simple test to check database connection
   */
  async testConnection() {
    try {
      const count = await this.auctionModel.countDocuments();
      return {
        status: 'connected',
        message: `Database connection successful. Found ${count} auctions.`,
        timestamp: new Date(),
      };
    } catch (error) {
      throw new BadRequestException(
        'Database connection failed: ' + error.message,
      );
    }
  }

  async adjustFavoriteCount(id: string, delta: number) {
    await this.auctionModel
      .findByIdAndUpdate(id, { $inc: { favorite_count: delta } })
      .exec();
  }
}
