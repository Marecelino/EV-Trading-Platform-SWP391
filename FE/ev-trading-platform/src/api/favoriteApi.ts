import axiosClient from './axiosClient';
import { CreateFavoriteDto } from '../types/api';
import { Favorite } from '../types';

const favoriteApi = {
  createFavorite: (data: CreateFavoriteDto) => {
    return axiosClient.post<Favorite>('/favorites', data);
  },

  getFavorites: (params?: { user_id?: string; listing_id?: string; auction_id?: string; page?: number; limit?: number }) => {
    return axiosClient.get<Favorite[]>('/favorites', { params });
  },

  checkFavorite: (params: { user_id: string; listing_id?: string; auction_id?: string }) => {
    return axiosClient.get<{ isFavorite: boolean }>('/favorites/check', { params });
  },

  deleteFavorite: (id: string, params?: { user_id?: string }) => {
    return axiosClient.delete(`/favorites/${id}`, { params });
  },
};

export default favoriteApi;
