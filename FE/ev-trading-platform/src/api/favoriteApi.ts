import axiosClient from './axiosClient';

const favoriteApi = {
  createFavorite: (data: { listing_id: string; user_id: string }) => {
    return axiosClient.post('/favorites', data);
  },

  getFavorites: (userId: string, page: number, limit: number) => {
    return axiosClient.get(`/favorites?user_id=${userId}&page=${page}&limit=${limit}`);
  },

  checkFavorite: (userId: string, listingId: string) => {
    return axiosClient.get(`/favorites/check?user_id=${userId}&listing_id=${listingId}`);
  },

  deleteFavorite: (listingId: string) => {
    return axiosClient.delete(`/favorites/${listingId}`);
  },
};

export default favoriteApi;
