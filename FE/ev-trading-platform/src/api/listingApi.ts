import axiosClient from './axiosClient';
import { Product } from '../types';
import {
  CreateEVListingDto,
  CreateBatteryListingDto,
  UpdateListingStatusDto,
  SearchListingsParams,
  PriceSuggestionDto,
  CompareListingsParams,
  PaginatedResponse,
} from '../types/api';

const listingApi = {
  // === GET LISTINGS ===
  getListings: (params?: SearchListingsParams) => {
    return axiosClient.get<Product[] | PaginatedResponse<Product>>('/listings', { params });
  },

  searchListings: (params: SearchListingsParams) => {
    return axiosClient.get<Product[] | PaginatedResponse<Product>>('/listings/search', { params });
  },

  getListingById: (id: string) => {
    return axiosClient.get<Product>(`/listings/${id}`);
  },

  getMyListings: () => {
    return axiosClient.get<Product[]>('/listings/my');
  },

  getListingsBySeller: (sellerId: string) => {
    return axiosClient.get<Product[]>(`/listings/seller/${sellerId}`);
  },

  // === CREATE LISTINGS ===
  // CRITICAL: Backend requires separate endpoints for EV and Battery
  createEV: (data: CreateEVListingDto) => {
    return axiosClient.post<Product>('/listings/ev', data);
  },

  createBattery: (data: CreateBatteryListingDto) => {
    return axiosClient.post<Product>('/listings/battery', data);
  },

  // === UPDATE LISTINGS ===
  // CRITICAL: Backend requires category-specific update paths
  updateEV: (id: string, data: Partial<CreateEVListingDto>) => {
    return axiosClient.patch<Product>(`/listings/ev/${id}`, data);
  },

  updateBattery: (id: string, data: Partial<CreateBatteryListingDto>) => {
    return axiosClient.patch<Product>(`/listings/battery/${id}`, data);
  },

  updateListingStatus: (id: string, data: UpdateListingStatusDto) => {
    return axiosClient.patch<Product>(`/listings/${id}/status`, data);
  },

  updateListingVerification: (id: string, isVerified: boolean) => {
    return axiosClient.patch<Product>(`/listings/${id}/verification`, { is_verified: isVerified });
  },

  activateListing: (id: string) => {
    return axiosClient.patch<Product>(`/listings/${id}/activate`);
  },

  // === DELETE LISTINGS ===
  deleteListing: (id: string) => {
    return axiosClient.delete(`/listings/${id}`);
  },

  // === RECOMMENDATIONS & COMPARE ===
  getRecommendations: (id: string, limit: number = 6) => {
    return axiosClient.get<Product[]>(`/listings/${id}/recommendations`, {
      params: { limit },
    });
  },

  compareListings: (params: CompareListingsParams) => {
    return axiosClient.get<Product[]>(`/listings/compare`, { params });
  },

  // === PRICE SUGGESTION ===
  getPriceSuggestion: (data: PriceSuggestionDto) => {
    return axiosClient.post('/listings/price-suggestion', data);
  },

  // === DEPRECATED/LEGACY ===
  // Keep for backward compatibility but mark as deprecated
  /** @deprecated Use createEV or createBattery instead */
  createListing: (data: Partial<Product>) => {
    console.warn('createListing is deprecated. Use createEV or createBattery instead.');
    // Try to infer category from data, but this is not reliable
    // CRITICAL FIX: Use proper type instead of 'as any'
    const category = (data as Partial<Product> & { category?: string }).category || 'ev';
    if (category === 'battery') {
      return listingApi.createBattery(data as CreateBatteryListingDto);
    }
    return listingApi.createEV(data as CreateEVListingDto);
  },

  /** @deprecated Use updateEV or updateBattery instead */
  updateListing: (id: string, data: Partial<Product>) => {
    console.warn('updateListing is deprecated. Use updateEV or updateBattery instead.');
    // This requires knowing the listing category - caller should use specific methods
    return axiosClient.patch<Product>(`/listings/${id}`, data);
  },
};

export default listingApi;
