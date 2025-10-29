import { Test, TestingModule } from '@nestjs/testing';
import {
  getConnectionToken,
  getModelToken,
  MongooseModule,
} from '@nestjs/mongoose';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, Model, Types } from 'mongoose';
import { ReviewsModule } from '../src/reviews/reviews.module';
import { ReviewsService } from '../src/reviews/reviews.service';
import { Review, ReviewDocument } from '../src/model/reviews.schema';
import {
  Transaction,
  TransactionDocument,
  TransactionStatus,
} from '../src/model/transactions';
import { User, UserDocument } from '../src/model/users.schema';
import { CreateReviewDto } from '../src/reviews/dto/create-review.dto';
import { BadRequestException } from '@nestjs/common';
import {
  Notification,
  NotificationDocument,
  NotificationType,
} from '../src/model/notifications';

const uniqueEmail = (prefix: string) =>
  `${prefix}-${new Types.ObjectId().toString()}@example.com`;

describe('ReviewsService (integration)', () => {
  let mongoServer: MongoMemoryServer;
  let moduleRef: TestingModule;
  let connection: Connection;
  let reviewsService: ReviewsService;
  let reviewModel: Model<ReviewDocument>;
  let userModel: Model<UserDocument>;
  let transactionModel: Model<TransactionDocument>;
  let notificationModel: Model<NotificationDocument>;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    moduleRef = await Test.createTestingModule({
      imports: [
        EventEmitterModule.forRoot(),
        MongooseModule.forRoot(uri),
        ReviewsModule,
      ],
    }).compile();

    connection = moduleRef.get<Connection>(getConnectionToken());
    reviewsService = moduleRef.get<ReviewsService>(ReviewsService);
    reviewModel = moduleRef.get(getModelToken(Review.name));
    userModel = moduleRef.get(getModelToken(User.name));
    transactionModel = moduleRef.get(getModelToken(Transaction.name));
    notificationModel = moduleRef.get(getModelToken(Notification.name));
  });

  afterAll(async () => {
    await moduleRef.close();
    await connection.close();
    await mongoServer.stop();
  });

  afterEach(async () => {
    const collections = connection.collections;
    await Promise.all(
      Object.values(collections).map((collection) => collection.deleteMany({})),
    );
  });

  const seedCompletedTransaction = async () => {
    const buyer = (await userModel.create({
      email: uniqueEmail('buyer'),
      password: 'Password1!',
    })) as UserDocument;

    const seller = (await userModel.create({
      email: uniqueEmail('seller'),
      password: 'Password1!',
    })) as UserDocument;

    const transaction = (await transactionModel.create({
      buyer_id: buyer._id,
      seller_id: seller._id,
      price: 15000,
      status: TransactionStatus.COMPLETED,
    })) as TransactionDocument;

    return { buyer, seller, transaction };
  };

  const normalizeId = (id: Types.ObjectId | string) =>
    id instanceof Types.ObjectId ? id.toHexString() : id;

  const buildReviewDto = (
    reviewer: Types.ObjectId | string,
    reviewee: Types.ObjectId | string,
    transaction: Types.ObjectId | string,
    overrides: Partial<CreateReviewDto> = {},
  ): CreateReviewDto => ({
    reviewer_id: normalizeId(reviewer),
    reviewee_id: normalizeId(reviewee),
    transaction_id: normalizeId(transaction),
    rating: 4,
    comment: 'Great experience working together',
    ...overrides,
  });

  it('creates review for completed transaction and updates user stats', async () => {
    const { buyer, seller, transaction } = await seedCompletedTransaction();

    const review = await reviewsService.create(
      buildReviewDto(
        buyer._id as Types.ObjectId,
        seller._id as Types.ObjectId,
        transaction._id as Types.ObjectId,
      ),
    );

    expect(review.rating).toBe(4);
    const stored = await reviewModel.findById(review._id).lean();
    expect(stored).toBeTruthy();
    expect(stored?.is_visible).toBe(true);
    expect(String(stored?.reviewee_id)).toBe(seller._id.toHexString());
    expect(stored?.reviewee_id instanceof Types.ObjectId).toBe(true);

    const stats = await reviewModel.aggregate([
      {
        $match: {
          reviewee_id: new Types.ObjectId(seller._id.toHexString()),
          is_visible: true,
        },
      },
      {
        $group: {
          _id: '$reviewee_id',
          total: { $sum: 1 },
        },
      },
    ]);
    expect(stats[0]?.total).toBe(1);

    const sellerAfter = await userModel.findById(seller._id).lean();
    expect(sellerAfter?.review_count).toBe(1);
    expect(sellerAfter?.review_average).toBeCloseTo(4);

    const notifications = await notificationModel
      .find({ user_id: seller._id })
      .lean();
    expect(notifications).toHaveLength(1);
    expect(notifications[0].type).toBe(NotificationType.REVIEW_RECEIVED);
    expect(notifications[0].related_id).toBe(review._id.toString());
    expect(notifications[0].message).toBe(
      'You received a new review with rating 4/5.',
    );
  });

  it('prevents duplicate reviews for the same transaction and reviewer', async () => {
    const { buyer, seller, transaction } = await seedCompletedTransaction();
    const dto = buildReviewDto(
      buyer._id as Types.ObjectId,
      seller._id as Types.ObjectId,
      transaction._id as Types.ObjectId,
    );

    await reviewsService.create(dto);

    await expect(reviewsService.create(dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects reviews from non-participants', async () => {
    const { seller, transaction } = await seedCompletedTransaction();
    const outsider = (await userModel.create({
      email: uniqueEmail('outsider'),
      password: 'Password1!',
    })) as UserDocument;

    const dto = buildReviewDto(
      outsider._id as Types.ObjectId,
      seller._id as Types.ObjectId,
      transaction._id as Types.ObjectId,
    );

    await expect(reviewsService.create(dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('filters reviews by reviewee id', async () => {
    const { buyer, seller, transaction } = await seedCompletedTransaction();
    const secondary = await seedCompletedTransaction();

    await reviewsService.create(
      buildReviewDto(
        buyer._id as Types.ObjectId,
        seller._id as Types.ObjectId,
        transaction._id as Types.ObjectId,
        {
          rating: 5,
        },
      ),
    );

    await reviewsService.create(
      buildReviewDto(
        secondary.buyer._id as Types.ObjectId,
        secondary.seller._id as Types.ObjectId,
        secondary.transaction._id as Types.ObjectId,
        {
          rating: 3,
        },
      ),
    );

    const result = await reviewsService.findAll({
      reviewee_id: seller._id.toHexString(),
    });

    expect(result.meta.total).toBe(1);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].reviewee_id.toString()).toBe(
      seller._id.toHexString(),
    );
  });

  it('updates aggregates when visibility toggles off', async () => {
    const { buyer, seller, transaction } = await seedCompletedTransaction();
    const created = await reviewsService.create(
      buildReviewDto(
        buyer._id as Types.ObjectId,
        seller._id as Types.ObjectId,
        transaction._id as Types.ObjectId,
        {
          rating: 5,
        },
      ),
    );

    const sellerBefore = await userModel.findById(seller._id).lean();
    expect(sellerBefore?.review_count).toBe(1);

    await reviewsService.toggleVisibility(created._id.toString(), false);

    const sellerAfter = await userModel.findById(seller._id).lean();
    expect(sellerAfter?.review_count).toBe(0);
    expect(sellerAfter?.review_average).toBe(0);
  });
});
