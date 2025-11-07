import axiosClient from './axiosClient';
import { Favorite } from '../types';
import { PaginatedResponse } from '../types/api';

const favoriteApi = {
  // Favorite a listing
  favoriteListing: (data: { user_id: string; listing_id: string }) => {
    return axiosClient.post<Favorite>('/favorites/listing', data);
  },

  // Favorite an auction
  favoriteAuction: (data: { user_id: string; auction_id: string }) => {
    return axiosClient.post<Favorite>('/favorites/auction', data);
  },

  // Get favorites list with pagination
  getFavorites: (params?: { user_id?: string; page?: number; limit?: number }) => {
    return axiosClient.get<PaginatedResponse<Favorite>>('/favorites', { params });
  },

  // Check if a listing/auction is favorited
  checkFavorite: (params: { user_id: string; target_id: string }) => {
    return axiosClient.get<{ isFavorite: boolean }>('/favorites/check', { params });
  },

  // Unfavorite a listing
  unfavoriteListing: (listingId: string, params: { user_id: string }) => {
    return axiosClient.delete<Favorite>(`/favorites/listing/${listingId}`, { params });
  },

  // Unfavorite an auction
  unfavoriteAuction: (auctionId: string, params: { user_id: string }) => {
    return axiosClient.delete<Favorite>(`/favorites/auction/${auctionId}`, { params });
  },
};

export default favoriteApi;
