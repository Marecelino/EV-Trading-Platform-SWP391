import { Test, TestingModule } from '@nestjs/testing';
import {
  MongooseModule,
  getConnectionToken,
  getModelToken,
} from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, Model, Types } from 'mongoose';

import { ListingsModule } from '../src/listings/listings.module';
import { ListingsService } from '../src/listings/listings.service';
import {
  Listing,
  ListingDocument,
  CategoryEnum,
  VehicleCondition,
  ListingStatus,
} from '../src/model/listings';
import { Brand, BrandDocument } from '../src/model/brands';
import { EVDetail, EVDetailDocument } from '../src/model/evdetails';
import {
  BatteryDetail,
  BatteryDetailDocument,
} from '../src/model/batterydetails';
import { User, UserSchema } from '../src/model/users.schema';

describe('ListingsService filters (integration)', () => {
  let mongoServer: MongoMemoryServer;
  let moduleRef: TestingModule;
  let connection: Connection;

  let listingsService: ListingsService;
  let listingModel: Model<ListingDocument>;
  let brandModel: Model<BrandDocument>;
  let evDetailModel: Model<EVDetailDocument>;
  let batteryDetailModel: Model<BatteryDetailDocument>;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    moduleRef = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(uri),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        ListingsModule,
      ],
    }).compile();

    connection = moduleRef.get<Connection>(getConnectionToken());
    listingsService = moduleRef.get<ListingsService>(ListingsService);
    listingModel = moduleRef.get(getModelToken(Listing.name));
    brandModel = moduleRef.get(getModelToken(Brand.name));
    evDetailModel = moduleRef.get(getModelToken(EVDetail.name));
    batteryDetailModel = moduleRef.get(getModelToken(BatteryDetail.name));
  });

  afterAll(async () => {
    await moduleRef?.close();
    await connection?.close();
    await mongoServer?.stop();
  });

  afterEach(async () => {
    const collections = connection.collections;
    await Promise.all(
      Object.values(collections).map((collection) => collection.deleteMany({})),
    );
  });

  const baseListingPayload = () => ({
    seller_id: new Types.ObjectId(),
    title: 'Sample Listing',
    description: 'Sample description for testing filters',
    price: 50000,
    condition: VehicleCondition.EXCELLENT,
    status: ListingStatus.ACTIVE,
    images: ['image.jpg'],
    location: 'Hanoi',
  });

  it('filters EV listings by brand name and EV detail ranges', async () => {
    const tesla = await brandModel.create({ name: 'Tesla' });
    const byd = await brandModel.create({ name: 'BYD' });

    const evListing = await listingModel.create({
      ...baseListingPayload(),
      title: 'Tesla Model S',
      brand_id: tesla._id,
      category: CategoryEnum.EV,
      location: 'Hanoi',
    });

    await evDetailModel.create({
      listing_id: evListing._id,
      year: 2022,
      mileage_km: 25000,
      battery_capacity_kwh: 95,
      range_km: 590,
    });

    const otherEv = await listingModel.create({
      ...baseListingPayload(),
      title: 'BYD Qin',
      brand_id: byd._id,
      category: CategoryEnum.EV,
      location: 'Ho Chi Minh',
    });

    await evDetailModel.create({
      listing_id: otherEv._id,
      year: 2018,
      mileage_km: 90000,
      battery_capacity_kwh: 60,
      range_km: 350,
    });

    const result = await listingsService.findAll({
      brandName: 'tesla',
      category: CategoryEnum.EV,
      minYear: 2020,
      maxMileage: 30000,
      minRange: 500,
      minCapacity: 80,
    });

    expect(result.meta.total).toBe(1);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].title).toBe('Tesla Model S');
    expect(result.data[0].evDetail).toBeDefined();
    expect(result.data[0].evDetail.year).toBe(2022);
  });

  it('filters battery listings by capacity and SOH ranges', async () => {
    const catl = await brandModel.create({ name: 'CATL' });

    const batteryListing = await listingModel.create({
      ...baseListingPayload(),
      title: 'CATL Pack 100kWh',
      brand_id: catl._id,
      category: CategoryEnum.BATTERY,
      location: 'Da Nang',
    });

    await batteryDetailModel.create({
      listing_id: batteryListing._id,
      capacity_kwh: 100,
      soh_percent: 92,
    });

    const otherBattery = await listingModel.create({
      ...baseListingPayload(),
      title: 'Old Pack 50kWh',
      brand_id: catl._id,
      category: CategoryEnum.BATTERY,
      location: 'Hue',
    });

    await batteryDetailModel.create({
      listing_id: otherBattery._id,
      capacity_kwh: 50,
      soh_percent: 70,
    });

    const result = await listingsService.findAll({
      category: CategoryEnum.BATTERY,
      minCapacity: 80,
      maxCapacity: 120,
      minSoh: 90,
    });

    expect(result.meta.total).toBe(1);
    expect(result.data[0].title).toBe('CATL Pack 100kWh');
    expect(result.data[0].batteryDetail.soh_percent).toBe(92);
  });

  it('combines price and location filters across categories', async () => {
    const vinfast = await brandModel.create({ name: 'VinFast' });

    await listingModel.create({
      ...baseListingPayload(),
      title: 'VinFast VF8',
      brand_id: vinfast._id,
      category: CategoryEnum.EV,
      price: 65000,
      location: 'Ha Noi Old Quarter',
    });

    await listingModel.create({
      ...baseListingPayload(),
      title: 'VinFast Old Model',
      brand_id: vinfast._id,
      category: CategoryEnum.EV,
      price: 30000,
      location: 'HCM City',
    });

    const result = await listingsService.findAll({
      minPrice: 40000,
      location: 'Ha Noi',
    });

    expect(result.meta.total).toBe(1);
    expect(result.data[0].title).toBe('VinFast VF8');
  });
});
