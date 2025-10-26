import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Review, ReviewDocument } from '../model/reviews.schema';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { FilterReviewsDto } from './dto/filter-reviews.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,
  ) {}

  async create(createReviewDto: CreateReviewDto) {
    const review = new this.reviewModel(createReviewDto);
    return review.save();
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

    if (reviewer_id) query.reviewer_id = reviewer_id;
    if (reviewee_id) query.reviewee_id = reviewee_id;
    if (transaction_id) query.transaction_id = transaction_id;
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

    return review;
  }

  async toggleVisibility(id: string, isVisible: boolean) {
    const review = await this.reviewModel
      .findByIdAndUpdate(id, { is_visible: isVisible }, { new: true })
      .lean();

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }

  async remove(id: string) {
    const review = await this.reviewModel.findByIdAndDelete(id).lean();
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    return review;
  }
}
