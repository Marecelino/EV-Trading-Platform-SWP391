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

  it('searches listings by keyword across title, location, and brand', async () => {
    const tesla = await brandModel.create({ name: 'Tesla' });
    const catl = await brandModel.create({ name: 'CATL' });

    const evListing = await listingModel.create({
      ...baseListingPayload(),
      title: 'Model S Plaid',
      description: 'Flagship Tesla EV with extended range',
      brand_id: tesla._id,
      category: CategoryEnum.EV,
      location: 'Ho Chi Minh City',
    });

    await evDetailModel.create({
      listing_id: evListing._id,
      year: 2023,
      mileage_km: 12000,
      battery_capacity_kwh: 100,
      range_km: 650,
    });

    const batteryListing = await listingModel.create({
      ...baseListingPayload(),
      title: 'Energy Storage Pack',
      description: 'CATL pack suitable for commercial energy storage',
      brand_id: catl._id,
      category: CategoryEnum.BATTERY,
      location: 'Da Nang Harbor',
    });

    await batteryDetailModel.create({
      listing_id: batteryListing._id,
      capacity_kwh: 90,
      soh_percent: 94,
    });

    const byBrand = await listingsService.searchVehicles({ keyword: 'Tesla' });
    expect(byBrand.meta.total).toBe(1);
    expect(byBrand.data[0].title).toBe('Model S Plaid');

    const byLocation = await listingsService.searchVehicles({
      keyword: 'Da Nang',
    });
    expect(byLocation.meta.total).toBe(1);
    expect(byLocation.data[0].title).toBe('Energy Storage Pack');

    const byTitle = await listingsService.searchVehicles({
      keyword: 'Energy Storage',
    });
    expect(byTitle.meta.total).toBe(1);
    expect(byTitle.data[0].category).toBe(CategoryEnum.BATTERY);
  });

  it('applies detail filters and default active status when searching', async () => {
    const detailBrand = await brandModel.create({ name: 'DetailBrand' });

    const activeListing = await listingModel.create({
      ...baseListingPayload(),
      title: 'Detail EV Active',
      brand_id: detailBrand._id,
      category: CategoryEnum.EV,
      status: ListingStatus.ACTIVE,
    });

    await evDetailModel.create({
      listing_id: activeListing._id,
      year: 2022,
      mileage_km: 18000,
      battery_capacity_kwh: 80,
      range_km: 500,
    });

    const draftListing = await listingModel.create({
      ...baseListingPayload(),
      title: 'Detail EV Draft',
      brand_id: detailBrand._id,
      category: CategoryEnum.EV,
      status: ListingStatus.DRAFT,
    });

    await evDetailModel.create({
      listing_id: draftListing._id,
      year: 2024,
      mileage_km: 1000,
      battery_capacity_kwh: 90,
      range_km: 550,
    });

    const defaultResult = await listingsService.searchVehicles({
      keyword: 'Detail EV',
      category: CategoryEnum.EV,
      minYear: 2023,
    });

    expect(defaultResult.meta.total).toBe(0);

    const draftResult = await listingsService.searchVehicles({
      keyword: 'Detail EV',
      category: CategoryEnum.EV,
      minYear: 2023,
      status: ListingStatus.DRAFT,
    });

    expect(draftResult.meta.total).toBe(1);
    expect(draftResult.data[0].title).toBe('Detail EV Draft');
  });
});
