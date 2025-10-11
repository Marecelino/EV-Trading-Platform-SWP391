import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Listing, ListingDocument, ListingStatus } from '../model/listings';
import {
  Transaction,
  TransactionDocument,
  TransactionStatus,
} from '../model/transactions';
import { Favorite, FavoriteDocument } from '../model/favorites';

interface RevenueSummary {
  totalRevenue: number;
  count: number;
}

export interface RevenueByMonth {
  month: number;
  totalRevenue: number;
  transactions: number;
}

export interface BrandPopularity {
  _id: string;
  totalSales: number;
  averagePrice: number;
}

export interface FavoriteTrend {
  date: Date;
  count: number;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Listing.name)
    private readonly listingModel: Model<ListingDocument>,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
    @InjectModel(Favorite.name)
    private readonly favoriteModel: Model<FavoriteDocument>,
  ) {}

  async getOverview() {
    const [
      totalListings,
      soldListings,
      activeListings,
      totalFavorites,
      revenue,
    ] = await Promise.all([
      this.listingModel.countDocuments(),
      this.listingModel.countDocuments({ status: ListingStatus.SOLD }),
      this.listingModel.countDocuments({ status: ListingStatus.ACTIVE }),
      this.favoriteModel.countDocuments(),
      this.transactionModel.aggregate<RevenueSummary>([
        { $match: { status: TransactionStatus.COMPLETED } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$price' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const revenueData: RevenueSummary = revenue[0] ?? {
      totalRevenue: 0,
      count: 0,
    };

    return {
      listings: {
        total: totalListings,
        sold: soldListings,
        active: activeListings,
      },
      favorites: totalFavorites,
      transactions: {
        totalRevenue: revenueData.totalRevenue,
        completed: revenueData.count,
      },
    };
  }

  async getRevenueByMonth(year: number) {
    const start = new Date(`${year}-01-01`);
    const end = new Date(`${year}-12-31T23:59:59.999Z`);

    return this.transactionModel.aggregate<RevenueByMonth>([
      {
        $match: {
          status: TransactionStatus.COMPLETED,
          $or: [
            { completion_date: { $exists: true } },
            { createdAt: { $exists: true } },
          ],
        },
      },
      {
        $addFields: {
          targetDate: { $ifNull: ['$completion_date', '$createdAt'] },
        },
      },
      {
        $match: {
          targetDate: {
            $gte: start,
            $lte: end,
          },
        },
      },
      {
        $group: {
          _id: { month: { $month: '$targetDate' } },
          totalRevenue: { $sum: '$price' },
          transactions: { $sum: 1 },
        },
      },
      {
        $project: {
          month: '$_id.month',
          totalRevenue: 1,
          transactions: 1,
          _id: 0,
        },
      },
      { $sort: { month: 1 } },
    ]);
  }

  async getPopularBrands(limit = 5) {
    return this.listingModel.aggregate<BrandPopularity>([
      { $match: { status: ListingStatus.SOLD } },
      {
        $group: {
          _id: '$brand_id',
          totalSales: { $sum: 1 },
          averagePrice: { $avg: '$price' },
        },
      },
      { $sort: { totalSales: -1 } },
      { $limit: limit },
    ]);
  }

  async getFavoriteTrend(limit = 7) {
    return this.favoriteModel.aggregate<FavoriteTrend>([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
      { $limit: limit },
      {
        $project: {
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day',
            },
          },
          count: 1,
          _id: 0,
        },
      },
      { $sort: { date: 1 } },
    ]);
  }
}
