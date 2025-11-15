// src/types/index.ts
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: PaginationMeta;
}

export interface Category {
  _id: string;
  name: string;
  description: string;
  slug: string;
  is_active: boolean;
  sort_order: number;
  listing_count: number;
  created_at: string;
  updated_at: string;
}

export interface EVDetail {
  _id: string;
  listing_id?: Product | string;
  auction_id?: string;
  // Backend fields (from API_DOCUMENTATION.json)
  year: number; // 1990 - currentYear+2
  mileage_km: number; // >= 0
  battery_capacity_kwh: number; // >= 0
  range_km: number; // >= 0
  // Optional fields that may be added later
  charging_time?: number;
  motor_power?: number;
  transmission?: string;
  color?: string;
  seats?: number;
  doors?: number;
  features?: string[];
  registration_status?: string;
  warranty_remaining?: string;
}

export interface BatteryDetail {
  _id: string;
  listing_id?: Product | string;
  auction_id?: string;
  // Backend fields (from API_DOCUMENTATION.json)
  capacity_kwh: number; // >= 0 (kWh)
  soh_percent: number; // 0-100 (%)
  battery_type?: string; // maxLength: 100
  manufacture_year?: number; // 1900 - currentYear+5
  // Optional fields that may be added later
  voltage?: number;
  chemistry_type?: string;
  cycle_count?: number;
  manufacturing_date?: string;
  warranty_remaining?: string;
  compatible_models?: string[];
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  weight?: number;
  certification?: string[];
}

export interface Brand {
  _id: string;
  name: string;
  description?: string;
  logo_url?: string;
  country?: string;
  is_active: boolean;
  listing_count: number;
  created_at: string;
  updated_at: string;
}

export interface Model {
  _id: string;
  brand_id: Brand | string;
  category_id: string;
  name: string;
  year: number;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Additional fields for EV models
  year_start?: number;
  year_end?: number;
  body_type?: string;
  drivetrain?: string;
  battery_capacity?: number;
  range?: number;
  charging_time?: number;
  motor_power?: number;
  top_speed?: number;
}

export interface Product {
  _id: string;
  seller_id: User | string;
  brand_id: Brand | string;
  model_id: Model | string;
  title: string;
  name?: string; // Added for battery listings
  description: string;
  price: number;
  condition: "new" | "like_new" | "good" | "fair";
  status: "pending_payment" | "pending" | "active" | "sold" | "rejected";
  category?: "ev" | "battery"; // Added from API response - required by backend
  location: ILocation | string; // Can be object or string
  images: string[];
  views: number;
  is_verified: boolean;
  is_featured: boolean;
  // Support both snake_case and camelCase for date fields
  created_at?: string;
  createdAt?: string; // Backend may return camelCase
  updated_at?: string;
  updatedAt?: string; // Backend may return camelCase
  listing_type: "direct_sale" | "auction";
  auction_id?: string;
  ev_details?: EVDetail; 
  evDetail?: EVDetail; 
  battery_details?: BatteryDetail; 
  batteryDetail?: BatteryDetail; 
  year?: number;
  mileage?: number; 
    battery_capacity?: number; // Backend may return this instead of battery_capacity_kwh
  range?: number; // Backend may return this instead of range_km
  // Battery flat fields
  capacity_kwh?: number;
  soh_percent?: number;
  battery_type?: string;
  manufacture_year?: number;
}

export interface PriceSuggestion {
  _id: string;
  listing_id: Product | string;
  suggested_price: number;
  min_price: number;
  max_price: number;
  confidence_score: number;
  based_on_transactions: number;
  factors: {
    brand_avg: number;
    model_avg: number;
    condition_factor: number;
    age_factor: number;
    location_factor: number;
  };
  created_at: string;
}

export interface Favorite {
  _id: string;
  user_id: User | string;
  listing_id?: Product | string; // Populated Product object when fetched from API
  auction_id?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  _id: string;
  email: string;
  full_name?: string; // May be missing in some responses
  name?: string; // Backend may return 'name' instead of 'full_name'
  role: "member" | "admin" | "user";
  avatar_url?: string;
  avatar?: string; // Backend may return 'avatar' instead of 'avatar_url'
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  profileCompleted?: boolean;
  isEmailVerified?: boolean; // Email verification status
  status: "active" | "suspended" | "inactive" | "banned";
  rating?: {
    average: number;
    count: number;
  };
  oauthProviders?: { provider: string; providerId: string }[];
}
export interface Review {
  _id: string;
  transaction_id: ITransaction | string;
  reviewer_id: User | string; // Backend returns populated object with _id, name, avatar
  reviewee_id: User | string; // Backend returns populated object with _id, name, avatar
  rating: number;
  comment: string;
  review_type: "buyer_to_seller" | "seller_to_buyer";
  is_visible?: boolean;
  created_at?: string; // snake_case (legacy support)
  createdAt?: string; // camelCase (backend default)
  updated_at?: string; // snake_case (legacy support)
  updatedAt?: string; // camelCase (backend default)
}

export interface Contact {
  _id: string;
  transaction_id: ITransaction | string;
  contract_no: string;  // NEW: UNIQUE contract number
  status: 'draft' | 'signed' | 'cancelled' | 'expired';  // UPDATED
  signed_at?: string;  // NEW
  expires_at?: string;  // NEW
  document_url?: string;  // NEW: original document
  signed_document_url?: string;  // NEW: signed version
  terms_and_conditions?: string;  // NEW
  signatures?: string[];  // NEW: array of signature hashes
  witness_signature?: string;  // NEW
  notes?: string;  // NEW
  audit_events?: Array<{  // NEW
    event: string;
    by: string;
    at: string;
    meta?: object;
  }>;
  createdAt: string;
  updatedAt: string;
  // DEPRECATED fields (keeping for backward compatibility during migration)
  contract_content?: string;
  buyer_signature?: string;
  seller_signature?: string;
  buyer_signed_at?: string;
  seller_signed_at?: string;
  contract_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Notification {
  _id: string;
  type: string; // Ví dụ: 'listing_approved', 'review_received'
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface ILocation {
  city: string;
  district?: string;
  address?: string;
}

export interface PaginatedListingsResponse {
  success: boolean;
  data: Product[];
  pagination: PaginationMeta;
}
export interface ITransaction {
  _id: string;
  buyer_id: User | string; // Backend returns populated User object with _id, name, email, phone
  seller_id: User | string; // Backend returns populated User object with _id, name, email, phone
  listing_id?: Product | string; // Backend returns populated object with _id, title, price, status, images
  auction_id?: string; // Optional - may be linked to listing instead
  price: number; // Primary field from backend
  amount?: number; // Keep for backward compatibility
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED" | "FAILED" | "pending" | "processing" | "completed" | "cancelled" | "failed"; // Support both cases
  payment_method?: string;
  payment_reference?: string; // Reference to payment record
  meeting_date?: string; // ISO date string
  notes?: string;
  // Commission fields
  commission_rate?: number;
  platform_fee?: number;
  seller_payout?: number;
  // Related entities
  contract_id?: string;
  commission_id?: string;
  // Date fields - backend uses camelCase (createdAt, updatedAt)
  created_at?: string; // snake_case (legacy support)
  createdAt?: string; // camelCase (backend default)
  updated_at?: string; // snake_case (legacy support)
  updatedAt?: string; // camelCase (backend default)
  transaction_date?: string; // Legacy field
}
export interface PaginatedTransactionsResponse {
  success?: boolean;
  data: ITransaction[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages?: number;
    pages?: number;
  };
  pagination?: PaginationMeta; // Legacy support
  stats?: {
    PENDING?: { count: number; totalAmount: number };
    PROCESSING?: { count: number; totalAmount: number };
    COMPLETED?: { count: number; totalAmount: number };
    CANCELLED?: { count: number; totalAmount: number };
    FAILED?: { count: number; totalAmount: number };
  };
}
export interface PaginatedUsersResponse {
  success: boolean;
  data: User[];
  pagination: PaginationMeta;
}

export interface CommissionConfig {
  _id: string;
  category_id: string;
  commission_rate: number;
  min_commission: number;
  max_commission: number;
  is_active: boolean;
  effective_from: string;
  created_at: string;
  updated_at: string;
}

export interface Commission {
  _id: string;
  transaction_id: ITransaction | string;
  amount: number;
  rate: number;
  status: "paid" | "pending" | "cancelled";
  paid_at: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Attribute {
  key: string;
  label: string;
  format?: (value: unknown) => string;
}
export interface AttributeGroup {
  title: string;
  attributes: Attribute[];
}
export interface Bid {
  _id: string;
  user_id: User | string;
  amount: number;
  created_at: string;
}

// AuctionStatus enum for reference (matches backend AuctionStatus enum)
// DRAFT = 'draft'           // Bản nháp (vừa tạo)
// PENDING = 'pending'       // Chờ admin duyệt (sau khi thanh toán phí)
// SCHEDULED = 'scheduled'   // Đã được lên lịch
// LIVE = 'live'             // Đang diễn ra (nhận bids)
// ENDED = 'ended'           // Đã kết thúc
// CANCELLED = 'cancelled'   // Bị hủy

export interface Auction {
  _id: string;
  listing_id?: string; // Optional - may not be present in flattened structure
  seller_id: string | null | User; // Can be null or populated User object
  start_time: string;
  end_time: string;
  starting_price: number;
  current_price: number;
  min_increment: number;
  buy_now_price?: number;
  status: "draft" | "pending" | "scheduled" | "live" | "ended" | "cancelled";
  payment_status?: "pending" | "completed"; // Payment status for listing fee (15,000 VND)
  winner_id?: string;
  bids: Bid[];
  // Listing fields (flattened from listing object in backend response)
  title?: string;
  description?: string;
  images?: string[];
  category?: "ev" | "battery";
  condition?: "new" | "like_new" | "excellent" | "good" | "fair" | "poor";
  location?: string;
  brand_id?: string | Brand;
  evDetail?: EVDetail | null;
  batteryDetail?: BatteryDetail | null;
  is_verified?: boolean;
  is_featured?: boolean;
  createdAt?: string;
  updatedAt?: string;
  auction_id?: string; // May be present in response
  // Backward compatibility: nested listing object (may be populated in some API responses)
  listing?: Product;
}
export interface ListingFee {
  _id: string;
  listing_id: string;
  fee_type: "ev_listing" | "battery_listing" | "auction_creation";
  amount: number;
  status: "pending" | "paid";
}

export interface FavoriteEntry {
  _id: string;
  listing_id: string;
}

export interface Payment {
  _id: string;
  purpose: "listing_fee" | "purchase";
  related_id: string; // ID của ListingFee hoặc Transaction
  status: "pending" | "success" | "failed";
}

// Re-export API types from api.ts
export type {
  RegisterDto,
  LoginDto,
  LoginResponse,
  LoginApiResponse,
  RegisterResponse,
  UpdateUserDto,
  ChangePasswordDto,
  CompleteRegistrationDto,
  CreateEVListingDto,
  CreateBatteryListingDto,
  UpdateListingStatusDto,
  SearchListingsParams,
  PriceSuggestionDto,
  CompareListingsParams,
  CreateEVAuctionDto,
  CreateBatteryAuctionDto,
  CreateAuctionDto, // Deprecated
  PlaceBidDto,
  CreateTransactionDto,
  CreateReviewDto,
  ReviewDirection,
  ReviewStats,
  GetReviewsParams,
  PaginatedReviewsResponse,
  CreateFavoriteDto,
  CreateContactDto,
  UpdateContactDto,
  CreatePriceSuggestionDto,
  UpdatePriceSuggestionDto,
  CalculateCommissionDto,
  CreateCommissionDto,
  ApiErrorResponse,
  PaginatedResponse,
} from './api';

export interface ListingBase {
  _id: string;
  seller_id: string; // Assuming User/Seller info might be fetched separately later
  brand_id: string;  // Assuming Brand info might be fetched separately
  model_id: string;  // Assuming Model info might be fetched separately
  title?: string; // Optional for Battery
  name?: string; // Optional for EV, used in Battery listing
  description: string;
  price: number;
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor' | string; // Allow string for flexibility
  status: 'active' | 'sold' | 'inactive' | string; // Allow string
  location?: {
    city?: string;
    district?: string;
    address?: string; // Added address
  };
  images: string[];
  views: number;
  is_verified?: boolean;
  is_featured?: boolean;
  created_at: string; // ISO Date string
  updated_at: string; // ISO Date string
  // Add view_count, favorite_count if needed from Battery listing_id
  view_count?: number;
  favorite_count?: number;
}

// EV Specific Details
export interface EVSpecifics {
  _id: string; // The specific detail record ID
  listing_id: ListingBase; // Nested common listing info
  mileage: number;
  year_of_manufacture: number;
  battery_capacity: number; // kWh
  range: number; // km
  charging_time: number; // minutes (Assumption)
  motor_power: number; // kW (Assumption)
  transmission: string;
  color: string;
  seats: number;
  doors: number;
  features: string[];
  registration_status: string;
  warranty_remaining: string;
}

// Battery Specific Details
export interface BatterySpecifics {
  _id: string; // The specific detail record ID
  listing_id: ListingBase; // Nested common listing info (name is used instead of title here)
  capacity: number; // kWh
  voltage: number; // V
  chemistry_type: string;
  state_of_health: number; // Percentage
  cycle_count: number;
  manufacturing_date: string; // ISO Date string
  warranty_remaining: string;
  compatible_models: string[];
  dimensions?: {
    length?: number; // mm (Assumption)
    width?: number; // mm (Assumption)
    height?: number; // mm (Assumption)
  };
  weight: number; // kg (Assumption)
  certification: string[];
}

export type ProductDetailData = EVSpecifics | BatterySpecifics;

export function isEV(product: ProductDetailData | null): product is EVSpecifics {
  return product !== null && (product as EVSpecifics).mileage !== undefined;
}

export function isBattery(product: ProductDetailData | null): product is BatterySpecifics {
  return product !== null && (product as BatterySpecifics).capacity !== undefined && (product as BatterySpecifics).voltage !== undefined;
}