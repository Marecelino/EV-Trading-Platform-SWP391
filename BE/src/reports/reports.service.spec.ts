import { Connection, createConnection, Model, Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ReportsService } from './reports.service';
import {
  Transaction,
  TransactionDocument,
  TransactionSchema,
  TransactionStatus,
} from '../model/transactions';
import {
  CategoryEnum,
  Listing,
  ListingDocument,
  ListingSchema,
  ListingStatus,
  VehicleCondition,
} from '../model/listings';

describe('ReportsService', () => {
  let mongod: MongoMemoryServer;
  let connection: Connection;
  let transactionModel: Model<TransactionDocument>;
  let listingModel: Model<ListingDocument>;
  let service: ReportsService;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    connection = await createConnection(mongod.getUri());
    transactionModel = connection.model(
      Transaction.name,
      TransactionSchema,
    ) as unknown as Model<TransactionDocument>;
    listingModel = connection.model(
      Listing.name,
      ListingSchema,
    ) as unknown as Model<ListingDocument>;
    service = new ReportsService(transactionModel);
  });

  afterAll(async () => {
    await connection?.close();
    await mongod?.stop();
  });

  afterEach(async () => {
    await Promise.all([
      transactionModel.deleteMany({}),
      listingModel.deleteMany({}),
    ]);
  });

  const seedListings = async () => {
    const sellerId = new Types.ObjectId();
    const buyerId = new Types.ObjectId();
    const brandId = new Types.ObjectId();

    const evListing = await listingModel.create({
      seller_id: sellerId,
      brand_id: brandId,
      title: 'EV Model X',
      description: 'High performance EV car',
      price: 120000,
      status: ListingStatus.ACTIVE,
      condition: VehicleCondition.EXCELLENT,
      category: CategoryEnum.EV,
      images: ['ev-x.jpg'],
    });

    const batteryListing = await listingModel.create({
      seller_id: sellerId,
      brand_id: brandId,
      title: 'Battery Pack Alpha',
      description: 'Reliable battery pack unit',
      price: 8000,
      status: ListingStatus.ACTIVE,
      condition: VehicleCondition.GOOD,
      category: CategoryEnum.BATTERY,
      images: ['battery-alpha.jpg'],
    });

    return {
      sellerId,
      buyerId,
      evListing,
      batteryListing,
    };
  };

  it('computes summary metrics with category and status breakdowns', async () => {
    const { sellerId, buyerId, evListing, batteryListing } =
      await seedListings();

    await transactionModel.create([
      {
        listing_id: evListing._id,
        buyer_id: buyerId,
        seller_id: sellerId,
        price: 150000,
        status: TransactionStatus.COMPLETED,
        createdAt: new Date('2025-01-05T00:00:00.000Z'),
        updatedAt: new Date('2025-01-05T00:00:00.000Z'),
      },
      {
        listing_id: evListing._id,
        buyer_id: buyerId,
        seller_id: sellerId,
        price: 120000,
        status: TransactionStatus.COMPLETED,
        createdAt: new Date('2025-01-15T00:00:00.000Z'),
        updatedAt: new Date('2025-01-15T00:00:00.000Z'),
      },
      {
        listing_id: batteryListing._id,
        buyer_id: buyerId,
        seller_id: sellerId,
        price: 10000,
        status: TransactionStatus.PENDING,
        createdAt: new Date('2025-02-10T00:00:00.000Z'),
        updatedAt: new Date('2025-02-10T00:00:00.000Z'),
      },
    ]);

    const summary = await service.getSummary({});

    expect(summary.totals.transactions).toBe(3);
    expect(summary.totals.completed).toBe(2);
    expect(summary.totals.revenue).toBe(270000);
    expect(summary.totals.completionRate).toBeCloseTo(2 / 3);

    const statusMap = Object.fromEntries(
      summary.statusBreakdown.map((item) => [item.status, item]),
    );

    expect(statusMap[TransactionStatus.COMPLETED].transactions).toBe(2);
    expect(statusMap[TransactionStatus.COMPLETED].revenue).toBe(270000);
    expect(statusMap[TransactionStatus.PENDING].transactions).toBe(1);

    const categoryMap = Object.fromEntries(
      summary.categoryBreakdown.map((item) => [item.category, item]),
    );

    expect(categoryMap[CategoryEnum.EV].transactions).toBe(2);
    expect(categoryMap[CategoryEnum.EV].revenue).toBe(270000);
    expect(categoryMap[CategoryEnum.BATTERY].transactions).toBe(1);
    expect(categoryMap[CategoryEnum.BATTERY].revenue).toBe(0);

    expect(summary.period.from?.toISOString()).toBe('2025-01-05T00:00:00.000Z');
    expect(summary.period.to?.toISOString()).toBe('2025-02-10T00:00:00.000Z');
  });

  it('returns monthly trend data with completion metrics', async () => {
    const { sellerId, buyerId, evListing, batteryListing } =
      await seedListings();

    await transactionModel.create([
      {
        listing_id: evListing._id,
        buyer_id: buyerId,
        seller_id: sellerId,
        price: 150000,
        status: TransactionStatus.COMPLETED,
        createdAt: new Date('2025-01-05T00:00:00.000Z'),
        updatedAt: new Date('2025-01-05T00:00:00.000Z'),
      },
      {
        listing_id: evListing._id,
        buyer_id: buyerId,
        seller_id: sellerId,
        price: 120000,
        status: TransactionStatus.COMPLETED,
        createdAt: new Date('2025-01-20T00:00:00.000Z'),
        updatedAt: new Date('2025-01-20T00:00:00.000Z'),
      },
      {
        listing_id: batteryListing._id,
        buyer_id: buyerId,
        seller_id: sellerId,
        price: 10000,
        status: TransactionStatus.CANCELLED,
        createdAt: new Date('2025-02-10T00:00:00.000Z'),
        updatedAt: new Date('2025-02-10T00:00:00.000Z'),
      },
    ]);

    const trend = await service.getTrend({ granularity: 'month' });

    expect(trend.data).toHaveLength(2);
    expect(trend.data[0].period.toISOString()).toBe('2025-01-01T00:00:00.000Z');
    expect(trend.data[0].transactions).toBe(2);
    expect(trend.data[0].completed).toBe(2);
    expect(trend.data[0].revenue).toBe(270000);
    expect(trend.data[1].period.toISOString()).toBe('2025-02-01T00:00:00.000Z');
    expect(trend.data[1].completed).toBe(0);
    expect(trend.meta.granularity).toBe('month');
  });
});
