import {
  CategoryEnum,
  ListingStatus,
  VehicleCondition,
} from '../model/listings';

export type ListingWithDetails = {
  _id: string | { toString(): string };
  title: string;
  price: number;
  status: ListingStatus;
  condition: VehicleCondition;
  category: CategoryEnum;
  images?: string[] | null;
  location?: string | null;
  brand_id?: unknown;
  evDetail?: {
    year?: number | null;
    mileage_km?: number | null;
    battery_capacity_kwh?: number | null;
    range_km?: number | null;
  } | null;
  batteryDetail?: {
    capacity_kwh?: number | null;
    soh_percent?: number | null;
    battery_type?: string | null;
    manufacture_year?: number | null;
  } | null;
};

export type ComparisonItemBase = {
  listingId: string;
  title: string;
  price: number;
  status: ListingStatus;
  condition: VehicleCondition;
  brandName: string | null;
  images: string[];
  location: string | null;
  category: CategoryEnum;
};

export type EVSpecs = {
  year: number | null;
  mileageKm: number | null;
  batteryCapacityKwh: number | null;
  rangeKm: number | null;
};

export type BatterySpecs = {
  capacityKwh: number | null;
  sohPercent: number | null;
  batteryType: string | null;
  manufactureYear: number | null;
};

export type EVComparisonItem = ComparisonItemBase & {
  specs: EVSpecs;
};

export type BatteryComparisonItem = ComparisonItemBase & {
  specs: BatterySpecs;
};

export type ComparisonItem = EVComparisonItem | BatteryComparisonItem;

export type EVHighlights = {
  lowestPriceId: string | null;
  highestRangeId: string | null;
  largestBatteryCapacityId: string | null;
  lowestMileageId: string | null;
  newestModelYearId: string | null;
};

export type BatteryHighlights = {
  lowestPriceId: string | null;
  largestCapacityId: string | null;
  highestSohId: string | null;
  newestManufactureYearId: string | null;
};

export type ComparisonHighlights =
  | (EVHighlights & { category: CategoryEnum.EV })
  | (BatteryHighlights & { category: CategoryEnum.BATTERY });

export type BuildComparisonInput = {
  category: CategoryEnum;
  listings: ListingWithDetails[];
  missingIds: string[];
  requestedOrder: string[];
};

export type ComparisonResponse = {
  data: ComparisonItem[];
  meta: {
    category: CategoryEnum;
    total: number;
    requested: number;
    missingIds: string[];
  };
  highlights: ComparisonHighlights;
};

const isMongoLike = (value: unknown): value is { toString(): string } => {
  return !!value && typeof value === 'object' && 'toString' in value;
};

const normalizeId = (value: ListingWithDetails['_id']): string => {
  if (typeof value === 'string') {
    return value;
  }
  if (isMongoLike(value)) {
    return value.toString();
  }
  return String(value);
};

const normalizeBrandName = (
  brand: ListingWithDetails['brand_id'],
): string | null => {
  if (!brand) {
    return null;
  }

  if (typeof brand === 'string') {
    return null;
  }

  if (isMongoLike(brand)) {
    return null;
  }

  if (typeof brand === 'object' && 'name' in brand) {
    const candidate = (brand as { name?: unknown }).name;
    return typeof candidate === 'string' ? candidate : null;
  }

  return null;
};

const toNumberOrNull = (value: unknown): number | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string' && value.trim().length) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const ensureArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item) => typeof item === 'string');
};

const buildEVItem = (listing: ListingWithDetails): EVComparisonItem => {
  const specsRaw = listing.evDetail ?? undefined;
  return {
    listingId: normalizeId(listing._id),
    title: listing.title,
    price: listing.price,
    status: listing.status,
    condition: listing.condition,
    brandName: normalizeBrandName(listing.brand_id),
    images: ensureArray(listing.images),
    location: listing.location ?? null,
    category: CategoryEnum.EV,
    specs: {
      year: toNumberOrNull(specsRaw?.year),
      mileageKm: toNumberOrNull(specsRaw?.mileage_km),
      batteryCapacityKwh: toNumberOrNull(specsRaw?.battery_capacity_kwh),
      rangeKm: toNumberOrNull(specsRaw?.range_km),
    },
  };
};

const buildBatteryItem = (
  listing: ListingWithDetails,
): BatteryComparisonItem => {
  const specsRaw = listing.batteryDetail ?? undefined;
  return {
    listingId: normalizeId(listing._id),
    title: listing.title,
    price: listing.price,
    status: listing.status,
    condition: listing.condition,
    brandName: normalizeBrandName(listing.brand_id),
    images: ensureArray(listing.images),
    location: listing.location ?? null,
    category: CategoryEnum.BATTERY,
    specs: {
      capacityKwh: toNumberOrNull(specsRaw?.capacity_kwh),
      sohPercent: toNumberOrNull(specsRaw?.soh_percent),
      batteryType:
        typeof specsRaw?.battery_type === 'string'
          ? specsRaw?.battery_type
          : null,
      manufactureYear: toNumberOrNull(specsRaw?.manufacture_year),
    },
  };
};

const findExtremaId = <T extends ComparisonItem>(
  items: T[],
  selector: (item: T) => number | null,
  mode: 'min' | 'max',
): string | null => {
  let bestId: string | null = null;
  let bestValue: number | null = null;

  for (const item of items) {
    const value = selector(item);
    if (value === null || Number.isNaN(value)) {
      continue;
    }

    if (bestValue === null) {
      bestValue = value;
      bestId = item.listingId;
      continue;
    }

    if (mode === 'min' ? value < bestValue : value > bestValue) {
      bestValue = value;
      bestId = item.listingId;
    }
  }

  return bestId;
};

const buildEVHighlights = (
  items: EVComparisonItem[],
): ComparisonHighlights => ({
  category: CategoryEnum.EV,
  lowestPriceId: findExtremaId(items, (item) => item.price, 'min'),
  highestRangeId: findExtremaId(items, (item) => item.specs.rangeKm, 'max'),
  largestBatteryCapacityId: findExtremaId(
    items,
    (item) => item.specs.batteryCapacityKwh,
    'max',
  ),
  lowestMileageId: findExtremaId(items, (item) => item.specs.mileageKm, 'min'),
  newestModelYearId: findExtremaId(items, (item) => item.specs.year, 'max'),
});

const buildBatteryHighlights = (
  items: BatteryComparisonItem[],
): ComparisonHighlights => ({
  category: CategoryEnum.BATTERY,
  lowestPriceId: findExtremaId(items, (item) => item.price, 'min'),
  largestCapacityId: findExtremaId(
    items,
    (item) => item.specs.capacityKwh,
    'max',
  ),
  highestSohId: findExtremaId(items, (item) => item.specs.sohPercent, 'max'),
  newestManufactureYearId: findExtremaId(
    items,
    (item) => item.specs.manufactureYear,
    'max',
  ),
});

export const buildComparisonResponse = ({
  category,
  listings,
  missingIds,
  requestedOrder,
}: BuildComparisonInput): ComparisonResponse => {
  const listingMap = new Map<string, ListingWithDetails>();
  for (const item of listings) {
    listingMap.set(normalizeId(item._id), item);
  }

  const orderedListings = requestedOrder
    .map((id) => listingMap.get(id))
    .filter((value): value is ListingWithDetails => Boolean(value));

  const finalItems =
    category === CategoryEnum.EV
      ? orderedListings.map((listing) => buildEVItem(listing))
      : orderedListings.map((listing) => buildBatteryItem(listing));

  const highlights =
    category === CategoryEnum.EV
      ? buildEVHighlights(finalItems as EVComparisonItem[])
      : buildBatteryHighlights(finalItems as BatteryComparisonItem[]);

  return {
    data: finalItems,
    meta: {
      category,
      total: finalItems.length,
      requested: requestedOrder.length,
      missingIds,
    },
    highlights,
  };
};
