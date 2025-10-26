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
import { FilterTransactionsDto } from './dto/filter-transactions.dto';
import { ListingsService } from '../listings/listings.service';
import { ListingStatus } from '../model/listings';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
    private readonly listingsService: ListingsService,
  ) { }

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

  async findAll(filters: FilterTransactionsDto) {
    const {
      buyer_id,
      seller_id,
      status,
      payment_method,
      search,
      limit = 20,
      page = 1,
    } = filters;
    const query: FilterQuery<TransactionDocument> = {};

    if (buyer_id) query.buyer_id = buyer_id;
    if (seller_id) query.seller_id = seller_id;
    if (status) query.status = status;
    if (payment_method) query.payment_method = payment_method;

    if (search) {
      query.$or = [
        { payment_reference: { $regex: new RegExp(search, 'i') } },
        { notes: { $regex: new RegExp(search, 'i') } },
      ];
    }

    const skip = (page - 1) * limit;

    const [data, total, stats] = await Promise.all([
      this.transactionModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('listing_id', 'title price')
        .populate('buyer_id', 'name email')
        .populate('seller_id', 'name email')
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
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
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
      // if (listingId) {
      //   await this.listingsService.updateStatus(listingId, ListingStatus.SOLD);
      // }
    }

    if (
      updateDto.status === TransactionStatus.CANCELLED &&
      transaction.listing_id
    ) {
      const listingId =
        transaction.listing_id instanceof Types.ObjectId
          ? transaction.listing_id.toString()
          : (transaction.listing_id as any)?._id?.toString();
      // if (listingId) {
      //   await this.listingsService.updateStatus(
      //     listingId,
      //     ListingStatus.ACTIVE,
      //   );
      // }
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
