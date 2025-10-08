// src/types/index.ts
export interface IEVDetails {
mileage: number;
  year_of_manufacture: number;
  battery_capacity: number;
  range: number;
  color?: string;
  seats?: number;
  features?: string[];
}

export interface IBatteryDetails {
  capacity: number;
  state_of_health: number;
  cycle_count: number;
}

export interface Product {
  _id: string;
  seller_id: User | string; 
  brand_id: string;  
  model_id: string;  
  title: string;
  description: string;
  price: number;
  condition: 'new' | 'like_new' | 'good' | 'fair';
  status: 'pending' | 'active' | 'sold' | 'rejected';
  location: ILocation;
  images: string[]; 
  views: number;
  is_verified: boolean;
  is_featured: boolean;
  created_at: string; 

  
  ev_details?: IEVDetails;
  battery_details?: IBatteryDetails;
}

export interface User {
  _id: string;
  email: string;
  full_name: string;
  role: 'member' | 'admin';
  avatar_url?: string;
  phone?: string;
  status: 'active' | 'suspended';
  rating?: {
    average: number;
    count: number;
  };
}
export interface Review {
    _id: string;
    reviewer_id: string; 
    reviewee_id: string;
    rating: number; 
    comment?: string;
    created_at: string;
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
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
export interface ITransaction {
  _id: string;
  listing_id: Product; 
  buyer_id: User;    
  seller_id: User;   
  amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  transaction_date?: string; 
}
export interface PaginatedTransactionsResponse {
    success: boolean;
    data: ITransaction[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}
export interface PaginatedUsersResponse {
  success: boolean;
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
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
export interface Review {
  _id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string | undefined;
  created_at: string;
}
