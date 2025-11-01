import axiosClient from './axiosClient';
import { CreatePriceSuggestionDto, UpdatePriceSuggestionDto } from '../types/api';

const priceSuggestionApi = {
  createPriceSuggestion: (data: CreatePriceSuggestionDto) => {
    return axiosClient.post('/pricesuggestions', data);
  },

  getPriceSuggestions: () => {
    return axiosClient.get('/pricesuggestions');
  },

  getPriceSuggestionById: (id: string) => {
    return axiosClient.get(`/pricesuggestions/${id}`);
  },

  getLatestPriceSuggestionByListingId: (listingId: string) => {
    return axiosClient.get(`/pricesuggestions/listing/${listingId}/latest`);
  },

  updatePriceSuggestion: (id: string, data: UpdatePriceSuggestionDto) => {
    return axiosClient.put(`/pricesuggestions/${id}`, data);
  },

  deletePriceSuggestion: (id: string) => {
    return axiosClient.delete(`/pricesuggestions/${id}`);
  },
};

export default priceSuggestionApi;
