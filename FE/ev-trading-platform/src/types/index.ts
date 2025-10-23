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
  listing_id: Product | string;
  mileage: number;
  year_of_manufacture: number;
  battery_capacity: number;
  range: number;
  charging_time: number;
  motor_power: number;
  transmission: string;
  color: string;
  seats: number;
  doors: number;
  features: string[];
  registration_status: string;
  warranty_remaining: string;
}

export interface BatteryDetail {
  _id: string;
  listing_id: Product | string;
  capacity: number;
  voltage: number;
  chemistry_type: string;
  state_of_health: number;
  cycle_count: number;
  manufacturing_date: string;
  warranty_remaining: string;
  compatible_models: string[];
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  weight: number;
  certification: string[];
}

export interface Brand {
  _id: string;
  name: string;
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
  location: ILocation;
  images: string[];
  views: number;
  is_verified: boolean;
  is_featured: boolean;
  created_at: string;
  listing_type: "direct_sale" | "auction";
  auction_id?: string;
  ev_details?: EVDetail;
  battery_details?: BatteryDetail;
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
  listing_id: Product | string;
  user_id: User | string;
}

export interface User {
  _id: string;
  email: string;
  full_name: string;
  role: "member" | "admin" | "user";
  avatar_url?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  profileCompleted?: boolean;
  status: "active" | "suspended" | "inactive" | "banned";
  rating?: {
    average: number;
    count: number;
  };
  oauthProviders?: { provider: string; providerId: string }[];
}
export interface Review {
  _id: string;
  transaction_id: string;
  reviewer_id: User | string;
  reviewee_id: User | string;
  rating: number;
  comment: string;
  review_type: "buyer_to_seller" | "seller_to_buyer";
  created_at: string;
  updated_at: string;
}

export interface Contact {
  _id: string;
  transaction_id: ITransaction | string;
  contract_content: string;
  buyer_signature: string;
  seller_signature: string;
  buyer_signed_at: string;
  seller_signed_at: string;
  contract_url: string;
  status: "completed" | "pending" | "cancelled";
  created_at: string;
  updated_at: string;
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
  buyer_id: User | string;
  seller_id: User | string;
  listing_id: Product | string;
  amount: number;
  status: "pending" | "completed" | "cancelled";
  payment_method: string;
  transaction_date: string;
  notes: string;
  created_at: string;
  updated_at: string;
}
export interface PaginatedTransactionsResponse {
  success: boolean;
  data: ITransaction[];
  pagination: PaginationMeta;
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

export interface Auction {
  _id: string;
  listing_id: string;
  seller_id: string;
  start_time: string;
  end_time: string;
  starting_price: number;
  current_price: number;
  min_increment: number;
  buy_now_price?: number;
  status: "scheduled" | "live" | "ended" | "cancelled";
  winner_id?: string;
  bids: Bid[];
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

// Auth DTOs from Swagger
export interface RegisterDto {
  name?: string;
  email: string;
  password?: string;
  phone?: string;
  address?: string;
  role?: 'user' | 'admin' | 'seller';
}

export interface LoginDto {
  email: string;
  password?: string;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  role?: 'user' | 'admin' | 'seller';
}

export interface ChangePasswordDto {
  currentPassword?: string;
  newPassword?: string;
}

export interface CompleteRegistrationDto {
  userId: string;
  fullName: string;
  phone: string;
  address: string;
  dateOfBirth: string;
}