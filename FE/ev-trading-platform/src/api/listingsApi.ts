// src/api/listingsApi.ts
import axiosClient from './axiosClient';
import type { Product } from '../types/index'; 
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const listingsApi = {
  // GET /api/listings
  getAll: (): Promise<ApiResponse<Product[]>> => {
    return axiosClient.get('/listings');
  },
  getById: (id: string): Promise<ApiResponse<Product>> => {
    return axiosClient.get(`/listings/${id}`);
  },
 
};

export default listingsApi;