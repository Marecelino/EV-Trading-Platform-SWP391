import {
  CategoryEnum,
  ListingStatus,
  VehicleCondition,
} from '../model/listings';
import { ListingsService } from './listings.service';

describe('ListingsService.compareListings', () => {
  let service: ListingsService;

  beforeEach(() => {
    service = new ListingsService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
  });

  it('returns a normalized snapshot for three EV listings', async () => {
    const mockListings = [
      {
        _id: 'one',
        title: 'EV One',
        price: 120_000,
        status: ListingStatus.ACTIVE,
        condition: VehicleCondition.GOOD,
        category: CategoryEnum.EV,
        brand_id: { name: 'Alpha' },
        images: ['one.jpg'],
        location: 'City A',
        evDetail: {
          year: 2022,
          mileage_km: 12_000,
          battery_capacity_kwh: 80,
          range_km: 420,
        },
      },
      {
        _id: 'two',
        title: 'EV Two',
        price: 100_000,
        status: ListingStatus.ACTIVE,
        condition: VehicleCondition.EXCELLENT,
        category: CategoryEnum.EV,
        brand_id: { name: 'Beta' },
        images: ['two.jpg'],
        location: 'City B',
        evDetail: {
          year: 2023,
          mileage_km: 9_000,
          battery_capacity_kwh: 85,
          range_km: 440,
        },
      },
      {
        _id: 'three',
        title: 'EV Three',
        price: 110_000,
        status: ListingStatus.ACTIVE,
        condition: VehicleCondition.LIKE_NEW,
        category: CategoryEnum.EV,
        brand_id: { name: 'Gamma' },
        images: ['three.jpg'],
        location: 'City C',
        evDetail: {
          year: 2024,
          mileage_km: 6_000,
          battery_capacity_kwh: 90,
          range_km: 460,
        },
      },
    ];

    jest
      .spyOn(service, 'findManyByIds')
      .mockResolvedValueOnce(mockListings as any);

    const result = await service.compareListings(['one', 'two', 'three']);

    expect(result.meta).toEqual({
      category: CategoryEnum.EV,
      total: 3,
      requested: 3,
      missingIds: [],
    });
    expect(result.data.map((item) => item.listingId)).toEqual([
      'one',
      'two',
      'three',
    ]);

    if (result.highlights.category === CategoryEnum.EV) {
      expect(result.highlights.lowestPriceId).toBe('two');
      expect(result.highlights.highestRangeId).toBe('three');
      expect(result.highlights.largestBatteryCapacityId).toBe('three');
      expect(result.highlights.lowestMileageId).toBe('three');
      expect(result.highlights.newestModelYearId).toBe('three');
    } else {
      throw new Error('Expected EV highlight payload');
    }
  });
});
