import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import {
  Transaction,
  TransactionDocument,
  TransactionStatus,
} from '../model/transactions';
import { ReportsSummaryQueryDto } from './dto/reports-summary-query.dto';
import { ReportsTrendQueryDto } from './dto/reports-trend-query.dto';

type SummaryPipelineResult = {
  totalTransactions?: number;
  completedTransactions?: number;
  totalRevenue?: number;
  totalVolume?: number;
  averageTicket?: number;
  earliest?: Date;
  latest?: Date;
};

type StatusBreakdownRow = {
  _id: TransactionStatus;
  totalTransactions: number;
  revenue: number;
};

type CategoryBreakdownRow = {
  _id: string | null;
  totalTransactions: number;
  revenue: number;
};

type TrendRow = {
  period: Date;
  totalTransactions: number;
  completedTransactions: number;
  totalRevenue: number;
};

type QueryWithFilters = {
  from?: string;
  to?: string;
  status?: TransactionStatus;
  buyerId?: string;
  sellerId?: string;
};

const COMPLETED_STATUS = TransactionStatus.COMPLETED;

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
  ) {}

  private parseDate(value?: string, endOfDay = false): Date | undefined {
    if (!value) {
      return undefined;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return undefined;
    }
    if (endOfDay && !value.includes('T')) {
      parsed.setUTCHours(23, 59, 59, 999);
    }
    return parsed;
  }

  private buildMatchFilters(
    filters: QueryWithFilters,
  ): FilterQuery<TransactionDocument> {
    const match: FilterQuery<TransactionDocument> = {};

    const fromDate = this.parseDate(filters.from);
    const toDate = this.parseDate(filters.to, true);

    if (fromDate || toDate) {
      match.createdAt = {} as Record<string, Date>;
      if (fromDate) {
        (match.createdAt as Record<string, Date>).$gte = fromDate;
      }
      if (toDate) {
        (match.createdAt as Record<string, Date>).$lte = toDate;
      }
    }

    if (filters.status) {
      match.status = filters.status;
    }

    if (filters.buyerId) {
      match.buyer_id = filters.buyerId;
    }

    if (filters.sellerId) {
      match.seller_id = filters.sellerId;
    }

    return match;
  }

  async getSummary(query: ReportsSummaryQueryDto) {
    const match = this.buildMatchFilters(query);

    const [summary] = (await this.transactionModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          completedTransactions: {
            $sum: {
              $cond: [{ $eq: ['$status', COMPLETED_STATUS] }, 1, 0],
            },
          },
          totalRevenue: {
            $sum: {
              $cond: [{ $eq: ['$status', COMPLETED_STATUS] }, '$price', 0],
            },
          },
          totalVolume: { $sum: '$price' },
          averageTicket: { $avg: '$price' },
          earliest: { $min: '$createdAt' },
          latest: { $max: '$createdAt' },
        },
      },
    ])) as SummaryPipelineResult[];

    const statusBreakdown = (await this.transactionModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          totalTransactions: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [{ $eq: ['$status', COMPLETED_STATUS] }, '$price', 0],
            },
          },
        },
      },
      { $sort: { totalTransactions: -1 } },
    ])) as StatusBreakdownRow[];

    const categoryBreakdown = (await this.transactionModel.aggregate([
      { $match: { ...match, listing_id: { $exists: true, $ne: null } } },
      {
        $lookup: {
          from: 'listings',
          localField: 'listing_id',
          foreignField: '_id',
          as: 'listing',
        },
      },
      { $unwind: '$listing' },
      {
        $group: {
          _id: '$listing.category',
          totalTransactions: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [{ $eq: ['$status', COMPLETED_STATUS] }, '$price', 0],
            },
          },
        },
      },
      { $sort: { revenue: -1, totalTransactions: -1 } },
    ])) as CategoryBreakdownRow[];

    const totalTransactions = summary?.totalTransactions ?? 0;
    const completedTransactions = summary?.completedTransactions ?? 0;
    const totalRevenue = summary?.totalRevenue ?? 0;
    const totalVolume = summary?.totalVolume ?? 0;
    const averageTicket = summary?.averageTicket ?? 0;

    const completionRate = totalTransactions
      ? completedTransactions / totalTransactions
      : 0;

    const averageRevenuePerCompleted = completedTransactions
      ? totalRevenue / completedTransactions
      : 0;

    return {
      period: {
        from: summary?.earliest ?? null,
        to: summary?.latest ?? null,
        appliedFrom: this.parseDate(query.from) ?? null,
        appliedTo: this.parseDate(query.to, true) ?? null,
      },
      totals: {
        transactions: totalTransactions,
        completed: completedTransactions,
        completionRate,
        revenue: totalRevenue,
        averageRevenuePerCompleted,
        averageTicket,
        volume: totalVolume,
      },
      statusBreakdown: statusBreakdown.map((row) => ({
        status: row._id,
        transactions: row.totalTransactions,
        revenue: row.revenue,
      })),
      categoryBreakdown: categoryBreakdown.map((row) => ({
        category: row._id ?? 'unknown',
        transactions: row.totalTransactions,
        revenue: row.revenue,
      })),
    };
  }

  async getTrend(query: ReportsTrendQueryDto) {
    const match = this.buildMatchFilters(query);
    const granularity = query.granularity ?? 'month';
    const limit = query.limit ?? 12;

    const rows = (await this.transactionModel.aggregate([
      { $match: match },
      {
        $addFields: {
          period: {
            $dateTrunc: {
              date: '$createdAt',
              unit: granularity,
            },
          },
        },
      },
      {
        $group: {
          _id: '$period',
          totalTransactions: { $sum: 1 },
          completedTransactions: {
            $sum: {
              $cond: [{ $eq: ['$status', COMPLETED_STATUS] }, 1, 0],
            },
          },
          totalRevenue: {
            $sum: {
              $cond: [{ $eq: ['$status', COMPLETED_STATUS] }, '$price', 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          period: '$_id',
          totalTransactions: 1,
          completedTransactions: 1,
          totalRevenue: 1,
        },
      },
      { $sort: { period: -1 } },
      { $limit: limit },
      { $sort: { period: 1 } },
    ])) as TrendRow[];

    const data = rows.map((row) => {
      const completionRate = row.totalTransactions
        ? row.completedTransactions / row.totalTransactions
        : 0;
      const averageRevenuePerCompleted = row.completedTransactions
        ? row.totalRevenue / row.completedTransactions
        : 0;

      return {
        period: row.period,
        transactions: row.totalTransactions,
        completed: row.completedTransactions,
        completionRate,
        revenue: row.totalRevenue,
        averageRevenuePerCompleted,
      };
    });

    return {
      meta: {
        granularity,
        limit,
        appliedFrom: this.parseDate(query.from) ?? null,
        appliedTo: this.parseDate(query.to, true) ?? null,
      },
      data,
    };
  }
}
