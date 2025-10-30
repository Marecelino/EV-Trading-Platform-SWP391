import {
  CategoryEnum,
  ListingStatus,
  VehicleCondition,
} from '../model/listings';
import {
  buildComparisonResponse,
  type ListingWithDetails,
} from './comparison.util';

describe('buildComparisonResponse', () => {
  const baseEVListing = (
    overrides: Partial<ListingWithDetails & { title: string }>,
  ): ListingWithDetails & { title: string } => ({
    _id: overrides._id ?? 'ev-1',
    title: overrides.title ?? 'EV One',
    price: overrides.price ?? 100_000,
    status: overrides.status ?? ListingStatus.ACTIVE,
    condition: overrides.condition ?? VehicleCondition.GOOD,
    category: CategoryEnum.EV,
    brand_id: overrides.brand_id ?? { name: 'BrandOne' },
    images: overrides.images ?? ['ev-one.jpg'],
    location: overrides.location ?? 'City',
    evDetail: {
      year: 2022,
      mileage_km: 10_000,
      battery_capacity_kwh: 70,
      range_km: 400,
      ...(overrides.evDetail ?? {}),
    },
    batteryDetail: null,
  });

  const baseBatteryListing = (
    overrides: Partial<ListingWithDetails & { title: string }>,
  ): ListingWithDetails & { title: string } => ({
    _id: overrides._id ?? 'bat-1',
    title: overrides.title ?? 'Battery One',
    price: overrides.price ?? 5_000,
    status: overrides.status ?? ListingStatus.ACTIVE,
    condition: overrides.condition ?? VehicleCondition.GOOD,
    category: CategoryEnum.BATTERY,
    brand_id: overrides.brand_id ?? { name: 'BrandBatt' },
    images: overrides.images ?? ['battery-one.jpg'],
    location: overrides.location ?? 'Warehouse',
    evDetail: null,
    batteryDetail: {
      capacity_kwh: 60,
      soh_percent: 90,
      battery_type: 'Li-Ion',
      manufacture_year: 2023,
      ...(overrides.batteryDetail ?? {}),
    },
  });

  it('returns ordered EV comparison snapshot with highlights', () => {
    const listings: ListingWithDetails[] = [
      baseEVListing({
        _id: 'ev-a',
        title: 'EV Alpha',
        price: 120_000,
        evDetail: {
          year: 2023,
          mileage_km: 15_000,
          battery_capacity_kwh: 85,
          range_km: 450,
        },
      }),
      baseEVListing({
        _id: 'ev-b',
        title: 'EV Beta',
        price: 95_000,
        evDetail: {
          year: 2021,
          mileage_km: 8_000,
          battery_capacity_kwh: 75,
          range_km: 380,
        },
      }),
      baseEVListing({
        _id: 'ev-c',
        title: 'EV Gamma',
        price: 110_000,
        evDetail: {
          year: 2024,
          mileage_km: 6_000,
          battery_capacity_kwh: 90,
          range_km: 470,
        },
      }),
    ];

    const result = buildComparisonResponse({
      category: CategoryEnum.EV,
      listings,
      missingIds: ['missing-ev'],
      requestedOrder: ['ev-b', 'ev-c', 'ev-a'],
    });

    expect(result.meta).toEqual({
      category: CategoryEnum.EV,
      total: 3,
      requested: 3,
      missingIds: ['missing-ev'],
    });
    expect(result.data.map((item) => item.listingId)).toEqual([
      'ev-b',
      'ev-c',
      'ev-a',
    ]);
    expect(result.data[0].specs).toEqual({
      year: 2021,
      mileageKm: 8_000,
      batteryCapacityKwh: 75,
      rangeKm: 380,
    });
    expect(result.highlights.category).toBe(CategoryEnum.EV);
    expect(result.highlights.lowestPriceId).toBe('ev-b');
    if (result.highlights.category === CategoryEnum.EV) {
      expect(result.highlights.highestRangeId).toBe('ev-c');
      expect(result.highlights.largestBatteryCapacityId).toBe('ev-c');
      expect(result.highlights.lowestMileageId).toBe('ev-c');
      expect(result.highlights.newestModelYearId).toBe('ev-c');
    }
  });

  it('returns ordered battery comparison snapshot with highlights', () => {
    const listings: ListingWithDetails[] = [
      baseBatteryListing({
        _id: 'bat-a',
        title: 'Battery Alpha',
        price: 4_000,
        batteryDetail: {
          capacity_kwh: 55,
          soh_percent: 88,
          battery_type: 'Li-Ion',
          manufacture_year: 2021,
        },
      }),
      baseBatteryListing({
        _id: 'bat-b',
        title: 'Battery Beta',
        price: 6_500,
        batteryDetail: {
          capacity_kwh: 65,
          soh_percent: 92,
          battery_type: 'Li-Ion',
          manufacture_year: 2024,
        },
      }),
      baseBatteryListing({
        _id: 'bat-c',
        title: 'Battery Gamma',
        price: 5_500,
        batteryDetail: {
          capacity_kwh: 60,
          soh_percent: 85,
          battery_type: 'LFP',
          manufacture_year: 2022,
        },
      }),
    ];

    const result = buildComparisonResponse({
      category: CategoryEnum.BATTERY,
      listings,
      missingIds: [],
      requestedOrder: ['bat-c', 'bat-a', 'bat-b'],
    });

    expect(result.meta).toEqual({
      category: CategoryEnum.BATTERY,
      total: 3,
      requested: 3,
      missingIds: [],
    });
    expect(result.data.map((item) => item.listingId)).toEqual([
      'bat-c',
      'bat-a',
      'bat-b',
    ]);
    expect(result.data[2].specs).toEqual({
      capacityKwh: 65,
      sohPercent: 92,
      batteryType: 'Li-Ion',
      manufactureYear: 2024,
    });
    expect(result.highlights.category).toBe(CategoryEnum.BATTERY);
    expect(result.highlights.lowestPriceId).toBe('bat-a');
    if (result.highlights.category === CategoryEnum.BATTERY) {
      expect(result.highlights.largestCapacityId).toBe('bat-b');
      expect(result.highlights.highestSohId).toBe('bat-b');
      expect(result.highlights.newestManufactureYearId).toBe('bat-b');
    }
  });
});
