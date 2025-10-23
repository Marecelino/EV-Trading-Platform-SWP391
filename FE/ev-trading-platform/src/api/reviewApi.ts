import axiosClient from './axiosClient';

const reviewApi = {
  getReviews: () => {
    return axiosClient.get('/reviews');
  },

  getReviewById: (id: string) => {
    return axiosClient.get(`/reviews/${id}`);
  },

  createReview: (data: any) => {
    return axiosClient.post('/reviews', data);
  },

  updateReview: (id: string, data: any) => {
    return axiosClient.patch(`/reviews/${id}`, data);
  },

  deleteReview: (id: string) => {
    return axiosClient.delete(`/reviews/${id}`);
  },

  updateReviewVisibility: (id: string, isVisible: boolean) => {
    return axiosClient.patch(`/reviews/${id}/visibility`, { isVisible });
  },
};

export default reviewApi;
