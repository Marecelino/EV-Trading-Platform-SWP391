import axiosClient from './axiosClient';

const priceSuggestionApi = {
  createPriceSuggestion: (data: any) => {
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

  updatePriceSuggestion: (id: string, data: any) => {
    return axiosClient.put(`/pricesuggestions/${id}`, data);
  },

  deletePriceSuggestion: (id: string) => {
    return axiosClient.delete(`/pricesuggestions/${id}`);
  },
};

export default priceSuggestionApi;
