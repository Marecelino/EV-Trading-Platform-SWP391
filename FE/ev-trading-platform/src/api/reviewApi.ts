import axiosClient from './axiosClient';
import { CreateReviewDto } from '../types/api';
import { Review } from '../types';

const reviewApi = {
  getReviews: (params?: { reviewee_id?: string; reviewer_id?: string; page?: number; limit?: number }) => {
    return axiosClient.get<Review[]>('/reviews', { params });
  },

  getReviewById: (id: string) => {
    return axiosClient.get<Review>(`/reviews/${id}`);
  },

  createReview: (data: CreateReviewDto) => {
    return axiosClient.post<Review>('/reviews', data);
  },

  updateReview: (id: string, data: Partial<CreateReviewDto>) => {
    return axiosClient.patch<Review>(`/reviews/${id}`, data);
  },

  deleteReview: (id: string) => {
    return axiosClient.delete(`/reviews/${id}`);
  },

  updateReviewVisibility: (id: string, isVisible: boolean) => {
    return axiosClient.patch<Review>(`/reviews/${id}/visibility`, { is_visible: isVisible });
  },
};

export default reviewApi;
