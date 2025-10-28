import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import {
  Transaction,
  TransactionDocument,
  TransactionStatus,
} from '../model/transactions';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionStatusDto } from './dto/update-transaction-status.dto';
import { ListingsService } from '../listings/listings.service';
import { ListingStatus } from '../model/listings';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
    private readonly listingsService: ListingsService,
  ) {}

  async create(createTransactionDto: CreateTransactionDto) {
    const transaction = new this.transactionModel({
      ...createTransactionDto,
      meeting_date: createTransactionDto.meeting_date
        ? new Date(createTransactionDto.meeting_date)
        : undefined,
    });
    const saved = await transaction.save();
    // await this.listingsService.updateStatus(
    //   createTransactionDto.listing_id,
    //   ListingStatus.REMOVED,
    // );
    return saved;
  }

  async findAll() {
    // We intentionally ignore filters (buyer/seller/status/search) per request.
    // Only respect pagination parameters (limit, page).
    const { limit = 20, page = 1 } = {} as any;
    const query: FilterQuery<TransactionDocument> = {};

    // Normalize pagination values and apply sane defaults / caps
    const normalizedLimit = Math.max(1, Math.min(Number(limit) || 20, 1000));
    const normalizedPage = Math.max(1, Number(page) || 1);
    const skip = (normalizedPage - 1) * normalizedLimit;

    const [data, total, stats] = await Promise.all([
      this.transactionModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(normalizedLimit)
        .lean(),
      this.transactionModel.countDocuments(query),
      this.transactionModel.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$status',
            totalAmount: { $sum: '$price' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const aggregated = stats.reduce(
      (acc, item) => {
        acc[item._id as TransactionStatus] = {
          count: item.count,
          totalAmount: item.totalAmount,
        };
        return acc;
      },
      {} as Record<TransactionStatus, { count: number; totalAmount: number }>,
    );

    return {
      data,
      meta: {
        page: normalizedPage,
        limit: normalizedLimit,
        total,
        totalPages: Math.ceil(total / normalizedLimit),
      },
      stats: aggregated,
    };
  }

  async findOne(id: string) {
    const transaction = await this.transactionModel
      .findById(id)
      .populate('listing_id', 'title price status')
      .populate('buyer_id', 'name email phone')
      .populate('seller_id', 'name email phone')
      .lean();

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  async findForUser(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user id');
    }

    return this.transactionModel
      .find({
        $or: [{ buyer_id: userId }, { seller_id: userId }],
      })
      .sort({ createdAt: -1 })
      .populate('listing_id', 'title price status images')
      .populate('buyer_id', 'name email phone')
      .populate('seller_id', 'name email phone')
      .lean();
  }

  async updateStatus(id: string, updateDto: UpdateTransactionStatusDto) {
    const transaction = await this.transactionModel
      .findByIdAndUpdate(
        id,
        { status: updateDto.status, notes: updateDto.notes },
        { new: true },
      )
      .lean();

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (
      updateDto.status === TransactionStatus.COMPLETED &&
      transaction.listing_id
    ) {
      const listingId =
        transaction.listing_id instanceof Types.ObjectId
          ? transaction.listing_id.toString()
          : (transaction.listing_id as any)?._id?.toString();
      if (listingId) {
        await this.listingsService.updateStatus(listingId, ListingStatus.SOLD);
      }
    }

    if (
      updateDto.status === TransactionStatus.CANCELLED &&
      transaction.listing_id
    ) {
      const listingId =
        transaction.listing_id instanceof Types.ObjectId
          ? transaction.listing_id.toString()
          : (transaction.listing_id as any)?._id?.toString();
      if (listingId) {
        await this.listingsService.updateStatus(
          listingId,
          ListingStatus.ACTIVE,
        );
      }
    }

    return transaction;
  }

  async remove(id: string) {
    const transaction = await this.transactionModel
      .findByIdAndDelete(id)
      .lean();
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }
}
