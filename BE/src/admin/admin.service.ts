import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserStatus } from '../model/users.schema';
import { Listing, ListingDocument, ListingStatus } from '../model/listings';
import {
  Transaction,
  TransactionDocument,
  TransactionStatus,
} from '../model/transactions';
import { Review, ReviewDocument } from '../model/reviews.schema';
import { ListingsService } from '../listings/listings.service';
import { UsersService } from '../users/users.service';
import { ReviewsService } from '../reviews/reviews.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../model/notifications';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Listing.name)
    private readonly listingModel: Model<ListingDocument>,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,
    private readonly listingsService: ListingsService,
    private readonly usersService: UsersService,
    private readonly reviewsService: ReviewsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getDashboardMetrics() {
    type TransactionAggregate = {
      _id: TransactionStatus;
      total: number;
      count: number;
    };

    const [userCount, activeListings, pendingListings, transactions, reviews] =
      await Promise.all([
        this.userModel.countDocuments(),
        this.listingModel.countDocuments({ status: ListingStatus.ACTIVE }),
        this.listingModel.countDocuments({
          is_verified: false,
          status: ListingStatus.DRAFT,
        }),
        this.transactionModel.aggregate<TransactionAggregate>([
          {
            $group: {
              _id: '$status',
              total: { $sum: '$price' },
              count: { $sum: 1 },
            },
          },
        ]),
        this.reviewModel.countDocuments(),
      ]);

    const transactionStats = transactions.reduce<
      Record<TransactionStatus, { total: number; count: number }>
    >(
      (acc, item) => {
        acc[item._id] = {
          total: item.total,
          count: item.count,
        };
        return acc;
      },
      {} as Record<TransactionStatus, { total: number; count: number }>,
    );

    return {
      users: userCount,
      listings: {
        active: activeListings,
        pending: pendingListings,
      },
      transactions: transactionStats,
      reviews,
    };
  }

  async getPendingListings(limit = 20) {
    return this.listingModel
      .find({ is_verified: false, status: ListingStatus.DRAFT })
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean();
  }

  async verifyListing(listingId: string, approve: boolean, message?: string) {
    const listing = await this.listingModel
      .findByIdAndUpdate(
        listingId,
        {
          is_verified: approve,
          status: approve ? ListingStatus.ACTIVE : ListingStatus.REMOVED,
        },
        { new: true, runValidators: true },
      )
      .lean();

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    const seller = listing.seller_id as UserDocument | string | undefined;
    const sellerId =
      typeof seller === 'string' ? seller : seller?._id?.toString();

    if (sellerId) {
      await this.notificationsService.create({
        user_id: sellerId,
        type: approve
          ? NotificationType.LISTING_APPROVED
          : NotificationType.LISTING_REJECTED,
        message: approve
          ? 'Listing của bạn đã được phê duyệt và đang hoạt động.'
          : `Listing của bạn đã bị từ chối.${message ? ` Lý do: ${message}` : ''}`,
        related_id: listingId,
      });
    }

    return listing;
  }

  async changeUserStatus(userId: string, status: UserStatus) {
    return this.usersService.changeStatus(userId, { status });
  }

  async moderateReview(reviewId: string, isVisible: boolean) {
    return this.reviewsService.toggleVisibility(reviewId, isVisible);
  }
}
