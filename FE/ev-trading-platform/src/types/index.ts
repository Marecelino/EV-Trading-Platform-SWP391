// src/types/index.ts
export interface IEVDetails {
  manufacturing_year?: number;
  mileage_km?: number;
  battery_capacity_kwh?: number;
  battery_health_percent?: number;
  // Thêm các trường khác khi cần
}

export interface IBatteryDetails {
  capacity_kwh?: number;
  health_percent?: number;
  cycle_count?: number;
}

export interface Product {
  _id: string;
  seller_id: string;
  category_id: string; // 'electric_vehicle' hoặc 'battery'
  title: string;
  description?: string;
  price: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  status: 'draft' | 'pending' | 'published' | 'sold' | 'rejected';
  city?: string;
  images: { url: string; is_primary?: boolean }[];
  is_verified: boolean;
  view_count: number;
  created_at: string; // Dùng string để dễ xử lý
  
  ev_details?: IEVDetails;
  battery_details?: IBatteryDetails;
}

export interface User {
  _id: string;
  email: string;
  full_name: string;
  role: 'member' | 'admin';
  phone?: string;
  status: 'active' | 'suspended';
}

