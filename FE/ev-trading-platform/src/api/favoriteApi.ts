import axiosClient from './axiosClient';

const favoriteApi = {
  createFavorite: (data: { listing_id: string; user_id: string }) => {
    return axiosClient.post('/favorites', data);
  },

  getFavorites: (userId: string, page: number = 1, limit: number = 10) => {
    return axiosClient.get(`/favorites?user_id=${userId}&page=${page}&limit=${limit}`);
  },

  checkFavorite: (userId: string, listingId: string) => {
    return axiosClient.get(`/favorites/check?user_id=${userId}&listing_id=${listingId}`);
  },

  deleteFavorite: (listingId: string, userId: string) => {
    return axiosClient.delete(`/favorites/${listingId}?user_id=${userId}`);
  },
};

export default favoriteApi;
