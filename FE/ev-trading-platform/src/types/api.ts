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
  token: string; // Backend returns 'token' not 'access_token'
  user: {
    _id: string;
    email: string;
    name?: string;
    role: 'user' | 'admin';
    status: string;
    profileCompleted?: boolean;
    isEmailVerified?: boolean;
    review_average?: number;
    review_count?: number;
    lastLogin?: string;
    oauthProviders?: unknown[];
    createdAt?: string;
    updatedAt?: string;
    id?: string;
    full_name?: string;
  };
  // Optional fields that might be in response
  token_type?: 'Bearer';
  expires_in?: number;
  access_token?: string; // Keep for backward compatibility
}

export interface LoginApiResponse {
  success: boolean;
  message: string;
  data: LoginResponse;
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
  // EV-specific fields (optional)
  year?: number; // 1990 - currentYear+2
  mileage?: number; // >= 0 (km)
  battery_capacity?: number; // >= 0 (kWh)
  range?: number; // >= 0 (km)
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
  // Battery-specific fields (optional)
  capacity_kwh?: number; // >= 0 (kWh)
  soh_percent?: number; // 0-100 (%)
  manufacture_year?: number; // 1900 - currentYear+5
}

export interface UpdateListingStatusDto {
  status: 'draft' | 'pending' | 'active' | 'rejected' | 'sold' | 'expired';
}

export interface SearchListingsParams {
  keyword?: string;
  brandName?: string;
  status?: 'draft' | 'pending' | 'active' | 'rejected' | 'sold' | 'expired';
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

// EV Auction DTO - POST /api/auctions/ev
export interface CreateEVAuctionDto {
  seller_id: string;
  brand_name: string; // 1-100 chars
  start_time: string; // ISO 8601 date-time, required
  end_time: string; // ISO 8601 date-time, required
  starting_price: number; // >= 0, required
  min_increment: number; // >= 0, required
  title: string; // 5-100 chars, required
  description: string; // 20-2000 chars, required
  condition: 'new' | 'like_new' | 'excellent' | 'good' | 'fair' | 'poor';
  images: string[]; // 1-10 items, required
  // Optional fields
  buy_now_price?: number; // >= 0
  year?: number; // 1990 - currentYear+2
  mileage?: number; // >= 0 (km)
  battery_capacity?: number; // >= 0 (kWh)
  range?: number; // >= 0 (km)
  manufacture_year?: number; // 1900 - currentYear+5
  location?: string;
}

// Battery Auction DTO - POST /api/auctions/battery
export interface CreateBatteryAuctionDto {
  seller_id: string;
  brand_name: string; // 1-100 chars
  start_time: string; // ISO 8601 date-time, required
  end_time: string; // ISO 8601 date-time, required
  starting_price: number; // >= 0, required
  min_increment: number; // >= 0, required
  title: string; // 5-100 chars, required
  description: string; // 20-2000 chars, required
  condition: 'new' | 'like_new' | 'excellent' | 'good' | 'fair' | 'poor';
  images: string[]; // 1-10 items, required
  // Optional fields
  buy_now_price?: number; // >= 0
  capacity_kwh?: number; // >= 0 (kWh)
  soh_percent?: number; // 0-100 (%)
  manufacture_year?: number; // 1900 - currentYear+5
  location?: string;
}

// Legacy - deprecated, use CreateEVAuctionDto or CreateBatteryAuctionDto instead
/** @deprecated Use CreateEVAuctionDto or CreateBatteryAuctionDto instead */
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
  user_id: string; // Required - MongoDB ObjectId
  amount: number; // Required (>= 0) - VND
}

export interface UpdateAuctionStatusDto {
  status: 'draft' | 'pending' | 'scheduled' | 'live' | 'ended' | 'cancelled';
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

export interface UpdateTransactionStatusDto {
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED" | "FAILED";
  notes?: string; // Optional notes (max 500 chars)
  contract_id?: string; // Optional: link contract to transaction
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
// CONTACT DTOs
// ============================================================================

export interface CreateContactDto {
  transaction_id: string;
  contract_content: string;
  buyer_signature?: string;
  seller_signature?: string;
  buyer_signed_at?: string; // ISO date string
  seller_signed_at?: string; // ISO date string
  contract_url?: string;
  status?: 'completed' | 'pending' | 'cancelled';
}

export interface UpdateContactDto {
  contract_content?: string;
  buyer_signature?: string;
  seller_signature?: string;
  buyer_signed_at?: string; // ISO date string
  seller_signed_at?: string; // ISO date string
  contract_url?: string;
  status?: 'completed' | 'pending' | 'cancelled';
}

// ============================================================================
// PRICE SUGGESTION DTOs
// ============================================================================

export interface CreatePriceSuggestionDto {
  listing_id: string;
  suggested_price: number; // min: 0
  model_confidence: number; // min: 0, max: 1
  model_name?: string;
  notes?: string;
}

export interface UpdatePriceSuggestionDto {
  suggested_price?: number; // min: 0
  model_confidence?: number; // min: 0, max: 1
  model_name?: string;
  notes?: string;
}

// ============================================================================
// COMMISSION CONFIG DTOs
// ============================================================================

export interface CalculateCommissionDto {
  transaction_amount: number; // min: 0
  category_id?: string;
  effective_date?: string; // ISO date string
}

// ============================================================================
// COMMISSION DTOs
// ============================================================================

export interface CreateCommissionDto {
  transaction_id: string;
  config_id?: string;
  percentage: number; // min: 0, max: 100
  amount: number; // min: 0
  status?: 'pending' | 'paid' | 'cancelled';
  paid_at?: string; // ISO date string
  payment_reference?: string;
  notes?: string;
}

// ============================================================================
// PAYMENT TYPES
// ============================================================================

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface Payment {
  _id: string;
  buyer_id: string;
  seller_id: string;
  listing_id?: string;
  auction_id?: string;
  amount: number;
  payment_method: string;
  status: PaymentStatus | string;
  vnp_TransactionNo?: string;
  vnp_PayDate?: string;
  vnp_ResponseCode?: string;
  payment_response?: unknown;
  transaction_id?: string;
  commission_id?: string;
  created_at?: string;
  updated_at?: string;
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
  success?: boolean;
  data: T[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages?: number;
    pages?: number;
  };
  pagination?: { // Legacy support
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Response from creating a listing (EV or Battery)
export interface CreateListingResponse {
  listing: unknown; // Product object
  payment: Payment;
  paymentUrl: string;
}

// Response from creating an auction (EV or Battery)
export interface CreateAuctionResponse {
  auction: unknown; // Auction object
  payment: Payment;
  paymentUrl: string;
}

// ============================================================================
// BUY NOW PAYMENT DTOs
// ============================================================================

export interface CreateListingPaymentDto {
  listing_id: string; // Required - MongoDB ObjectId
  amount?: number; // Optional - Backend validates against listing.price
  payment_method?: string; // Default: "VNPAY"
  bank_code?: string; // Optional - Bank code for VNPay
}

export interface CreateListingPaymentResponse {
  payment: Payment;
  paymentUrl: string;
}

// ============================================================================
// AUCTION PAYMENT DTOs
// ============================================================================

export interface CreateAuctionPaymentDto {
  auction_id: string; // Required - MongoDB ObjectId
  amount?: number; // Optional - Must match auction.current_price if provided
  payment_method?: string; // Default: "VNPAY"
  bank_code?: string; // Optional - Bank code for VNPay
  user_id?: string; // Optional - Backend can extract from JWT token
}

export interface CreateAuctionPaymentResponse {
  payment: Payment;
  paymentUrl: string;
}

// ============================================================================
// CONTRACT DTOs
// ============================================================================

export interface AcceptContractDto {
  name: string; // Required - Signer's name
  email: string; // Required - Signer's email (validated)
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export enum NotificationType {
  LISTING_APPROVED = 'listing_approved',
  LISTING_REJECTED = 'listing_rejected',
  NEW_MESSAGE = 'new_message',
  TRANSACTION_COMPLETED = 'transaction_completed',
  PRICE_SUGGESTION = 'price_suggestion',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
  REVIEW_RECEIVED = 'review_received',
  COMPLAINT_SUBMITTED = 'complaint_submitted',
  COMPLAINT_UPDATED = 'complaint_updated',
  FAVORITE_AUCTION_BID = 'favorite_auction_bid',
  FAVORITE_AUCTION_SOLD = 'favorite_auction_sold',
  FAVORITE_LISTING_SOLD = 'favorite_listing_sold',
  WIN_AUCTION = 'win_auction',
}

export interface Notification {
  _id: string;
  user_id: string;
  message: string; // max 500 chars
  type: NotificationType;
  is_read: boolean;
  related_id?: string;
  action_url?: string; // URL to redirect on click
  read_at?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedNotificationsResponse {
  data: Notification[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface MarkAllNotificationsReadDto {
  user_id: string;
}

