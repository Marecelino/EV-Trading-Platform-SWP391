// src/api/favoritesApi.ts
import axiosClient from './axiosClient';

const favoritesApi = {
  getFavorites: () => axiosClient.get('/favorites'),
  addFavorite: (listing_id: string) => axiosClient.post('/favorites', { listing_id }),
  removeFavorite: (listing_id: string) => axiosClient.delete(`/favorites/${listing_id}`),
};

export default favoritesApi;