// API Types generated from Swagger/OpenAPI documentation
// Auto-generated based on API_DOCUMENTATION.json

// ============================================================================
// AUTH DTOs
// ============================================================================

export interface RegisterDto {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  address?: string;
  role?: 'user' | 'admin';
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  user: {
    _id: string;
    email: string;
    name?: string;
    role: 'user' | 'admin';
    status: string;
  };
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    userId: string;
    email: string;
    requiresProfileCompletion: boolean;
  };
}

export interface CompleteRegistrationDto {
  userId: string;
  fullName: string;
  phone: string;
  address: string;
  dateOfBirth: string; // ISO 8601 date (YYYY-MM-DD)
}

export interface UpdateUserDto {
  name?: string;
  phone?: string;
  address?: string;
  avatar?: string;
  dateOfBirth?: string; // ISO 8601 date
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string; // minLength: 8
}

// ============================================================================
// LISTING DTOs
// ============================================================================

export interface CreateEVListingDto {
  seller_id: string;
  brand_name: string;
  title: string;
  description: string; // minLength: 20, maxLength: 2000
  price: number; // min: 0
  condition: 'new' | 'like_new' | 'excellent' | 'good' | 'fair' | 'poor';
  images: string[]; // minItems: 1, maxItems: 10
  location?: string; // maxLength: 255
  // EV-specific fields (if required by backend)
  year?: number;
  mileage_km?: number;
  battery_capacity_kwh?: number;
  range_km?: number;
}

export interface CreateBatteryListingDto {
  seller_id: string;
  brand_name: string;
  title: string;
  description: string; // minLength: 20, maxLength: 2000
  price: number; // min: 0
  condition: 'new' | 'like_new' | 'excellent' | 'good' | 'fair' | 'poor';
  images: string[]; // minItems: 1, maxItems: 10
  location?: string; // maxLength: 255
  // Battery-specific fields (if required by backend)
  capacity_kwh?: number;
  soh_percent?: number; // min: 0, max: 100
  battery_type?: string;
  manufacture_year?: number;
}

export interface UpdateListingStatusDto {
  status: 'draft' | 'active' | 'sold' | 'removed';
}

export interface SearchListingsParams {
  keyword?: string;
  brandName?: string;
  status?: 'draft' | 'active' | 'sold' | 'removed';
  condition?: 'new' | 'like_new' | 'excellent' | 'good' | 'fair' | 'poor';
  category?: 'ev' | 'battery';
  location?: string;
  page?: number; // default: 1
  limit?: number; // default: 10, max: 50
}

export interface PriceSuggestionDto {
  // Fields for price suggestion request
  brand_name?: string;
  condition?: string;
  category?: 'ev' | 'battery';
  // Add other fields as per backend schema
}

export interface CompareListingsParams {
  ids: string; // Comma-separated listing IDs
}

// ============================================================================
// AUCTION DTOs
// ============================================================================

export interface CreateAuctionDto {
  seller_id: string;
  brand_id: string;
  title: string;
  description: string;
  category: 'ev' | 'battery';
  condition: 'new' | 'like_new' | 'excellent' | 'good' | 'fair' | 'poor';
  images: string[]; // minItems: 1, maxItems: 10
  location?: string;
  start_time: string; // ISO date string
  end_time: string; // ISO date string
  starting_price: number; // min: 0
  min_increment: number; // min: 0
  buy_now_price?: number; // min: 0, optional
}

export interface PlaceBidDto {
  amount: number; // min: 0
}

// ============================================================================
// TRANSACTION DTOs
// ============================================================================

export interface CreateTransactionDto {
  listing_id?: string;
  auction_id?: string;
  buyer_id: string;
  seller_id: string;
  price: number;
  payment_method?: string;
  meeting_date?: string; // ISO date string
  notes?: string;
}

// ============================================================================
// REVIEW DTOs
// ============================================================================

export interface CreateReviewDto {
  reviewer_id: string;
  reviewee_id: string;
  rating: number; // min: 1, max: 5
  comment: string; // minLength: 10, maxLength: 500
  transaction_id?: string;
}

// ============================================================================
// FAVORITE DTOs
// ============================================================================

export interface CreateFavoriteDto {
  user_id: string;
  listing_id?: string;
  auction_id?: string;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface ApiErrorResponse {
  success?: boolean;
  message?: string;
  error?: string;
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

