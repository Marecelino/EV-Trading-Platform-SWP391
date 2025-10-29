import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { Review, ReviewDocument } from '../model/reviews.schema';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { FilterReviewsDto } from './dto/filter-reviews.dto';
import {
  Transaction,
  TransactionDocument,
  TransactionStatus,
} from '../model/transactions';
import { User, UserDocument } from '../model/users.schema';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async create(createReviewDto: CreateReviewDto) {
    await this.validateReviewContext(createReviewDto);

    const reviewerObjectId = new Types.ObjectId(createReviewDto.reviewer_id);
    const revieweeObjectId = new Types.ObjectId(createReviewDto.reviewee_id);
    const transactionObjectId = new Types.ObjectId(
      createReviewDto.transaction_id,
    );

    const review = await this.reviewModel.create({
      ...createReviewDto,
      reviewer_id: reviewerObjectId,
      reviewee_id: revieweeObjectId,
      transaction_id: transactionObjectId,
      is_visible:
        createReviewDto.is_visible === undefined
          ? true
          : createReviewDto.is_visible,
    });

    await this.updateUserReviewStats(revieweeObjectId.toHexString());

    return review.toObject();
  }

  async findAll(filters: FilterReviewsDto) {
    const {
      reviewer_id,
      reviewee_id,
      transaction_id,
      is_visible,
      minRating,
      maxRating,
      limit = 10,
      page = 1,
    } = filters;
    const query: FilterQuery<ReviewDocument> = {};

    if (reviewer_id) {
      if (!Types.ObjectId.isValid(reviewer_id)) {
        throw new BadRequestException('Invalid reviewer reference');
      }
      query.reviewer_id = new Types.ObjectId(reviewer_id);
    }

    if (reviewee_id) {
      if (!Types.ObjectId.isValid(reviewee_id)) {
        throw new BadRequestException('Invalid reviewee reference');
      }
      query.reviewee_id = new Types.ObjectId(reviewee_id);
    }

    if (transaction_id) {
      if (!Types.ObjectId.isValid(transaction_id)) {
        throw new BadRequestException('Invalid transaction reference');
      }
      query.transaction_id = new Types.ObjectId(transaction_id);
    }
    if (is_visible !== undefined) query.is_visible = is_visible;

    if (minRating !== undefined || maxRating !== undefined) {
      query.rating = {} as any;
      if (minRating !== undefined) query.rating.$gte = minRating;
      if (maxRating !== undefined) query.rating.$lte = maxRating;
    }

    const skip = (page - 1) * limit;

    const [data, total, stats] = await Promise.all([
      this.reviewModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('reviewer_id', 'name avatar')
        .lean(),
      this.reviewModel.countDocuments(query),
      this.reviewModel.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$reviewee_id',
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 },
          },
        },
      ]),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats,
    };
  }

  async findOne(id: string) {
    const review = await this.reviewModel
      .findById(id)
      .populate('reviewer_id', 'name avatar')
      .populate('reviewee_id', 'name avatar')
      .lean();

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }

  async update(id: string, updateReviewDto: UpdateReviewDto) {
    const review = await this.reviewModel
      .findByIdAndUpdate(id, updateReviewDto, {
        new: true,
        runValidators: true,
      })
      .lean();

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const revieweeId =
      review.reviewee_id instanceof Types.ObjectId
        ? review.reviewee_id.toHexString()
        : String(review.reviewee_id);

    await this.updateUserReviewStats(revieweeId);

    return review;
  }

  async toggleVisibility(id: string, isVisible: boolean) {
    const review = await this.reviewModel
      .findByIdAndUpdate(id, { is_visible: isVisible }, { new: true })
      .lean();

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const revieweeId =
      review.reviewee_id instanceof Types.ObjectId
        ? review.reviewee_id.toHexString()
        : String(review.reviewee_id);

    await this.updateUserReviewStats(revieweeId);

    return review;
  }

  async remove(id: string) {
    const review = await this.reviewModel.findByIdAndDelete(id).lean();
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    const revieweeId =
      review.reviewee_id instanceof Types.ObjectId
        ? review.reviewee_id.toHexString()
        : String(review.reviewee_id);
    await this.updateUserReviewStats(revieweeId);
    return review;
  }

  private async validateReviewContext(dto: CreateReviewDto) {
    const { reviewer_id, reviewee_id, transaction_id } = dto;

    if (reviewer_id === reviewee_id) {
      throw new BadRequestException('Reviewer and reviewee must be different');
    }

    if (!Types.ObjectId.isValid(transaction_id)) {
      throw new BadRequestException('Invalid transaction reference');
    }
    if (!Types.ObjectId.isValid(reviewer_id)) {
      throw new BadRequestException('Invalid reviewer reference');
    }
    if (!Types.ObjectId.isValid(reviewee_id)) {
      throw new BadRequestException('Invalid reviewee reference');
    }

    const transactionObjectId = new Types.ObjectId(transaction_id);
    const reviewerObjectId = new Types.ObjectId(reviewer_id);
    const revieweeObjectId = new Types.ObjectId(reviewee_id);

    const transaction = await this.transactionModel
      .findById(transactionObjectId)
      .lean();

    if (!transaction) {
      throw new BadRequestException('Transaction not found');
    }

    const serializeId = (value: any) =>
      value instanceof Types.ObjectId ? value.toHexString() : String(value);

    const isReviewerParticipant = [transaction.buyer_id, transaction.seller_id]
      .filter(Boolean)
      .some((id) => serializeId(id) === reviewerObjectId.toHexString());

    if (!isReviewerParticipant) {
      throw new BadRequestException(
        'Reviewer must be part of the referenced transaction',
      );
    }

    const isRevieweeParticipant = [transaction.buyer_id, transaction.seller_id]
      .filter(Boolean)
      .some((id) => serializeId(id) === revieweeObjectId.toHexString());

    if (!isRevieweeParticipant) {
      throw new BadRequestException(
        'Reviewee must be part of the referenced transaction',
      );
    }

    if (transaction.status !== TransactionStatus.COMPLETED) {
      throw new BadRequestException(
        'Only completed transactions can be reviewed',
      );
    }

    const existing = await this.reviewModel.findOne({
      reviewer_id: reviewerObjectId,
      reviewee_id: revieweeObjectId,
      transaction_id: transactionObjectId,
    });

    if (existing) {
      throw new BadRequestException(
        'Review already submitted for this transaction',
      );
    }
  }

  private async updateUserReviewStats(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      return;
    }

    const targetId = new Types.ObjectId(userId);

    const [stat] = await this.reviewModel.aggregate([
      {
        $match: {
          reviewee_id: targetId,
          is_visible: true,
        },
      },
      {
        $group: {
          _id: '$reviewee_id',
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    const averageRating = stat?.averageRating ?? 0;
    const totalReviews = stat?.totalReviews ?? 0;

    await this.userModel.findByIdAndUpdate(targetId, {
      $set: {
        review_average: averageRating,
        review_count: totalReviews,
      },
    });
  }
}
