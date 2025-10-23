import axiosClient from './axiosClient';
import { Product } from '../types';

const listingApi = {
  getListings: () => {
    return axiosClient.get('/listings');
  },

  getListingById: (id: string) => {
    return axiosClient.get(`/listings/${id}`);
  },

  createListing: (data: Partial<Product>) => {
    return axiosClient.post('/listings', data);
  },

  updateListing: (id: string, data: Partial<Product>) => {
    return axiosClient.patch(`/listings/${id}`, data);
  },

  deleteListing: (id: string) => {
    return axiosClient.delete(`/listings/${id}`);
  },

  updateListingStatus: (id: string, status: string) => {
    return axiosClient.patch(`/listings/${id}/status`, { status });
  },

  incrementView: (id: string) => {
    return axiosClient.post(`/listings/${id}/views`);
  },

  getPriceSuggestion: (data: any) => {
    return axiosClient.post('/listings/price-suggestion', data);
  },

  getRecommendations: (id: string, limit: number) => {
    return axiosClient.get(`/listings/${id}/recommendations?limit=${limit}`);
  },
  
  getMyListings: () => {
    return axiosClient.get('/listings/my');
  },

  updateListingVerification: (id: string, is_verified: boolean) => {
    return axiosClient.put(`/listings/${id}/verify`, { is_verified });
  }
};

export default listingApi;
