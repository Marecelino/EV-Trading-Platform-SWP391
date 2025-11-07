import axiosClient from './axiosClient';
import type {
  CreateReviewDto,
  GetReviewsParams,
  PaginatedReviewsResponse,
  ReviewDirection,
} from '../types/api';
import type { Review } from '../types';

type CreateReviewPayload = CreateReviewDto;
type UpdateReviewPayload = Partial<CreateReviewDto>;

const reviewApi = {
  getReviews: (params?: GetReviewsParams) => {
    // Convert boolean to string for query params (backend expects string)
    const queryParams: Record<string, string | number> = {};
    if (params) {
      Object.keys(params).forEach((key) => {
        const value = params[key as keyof GetReviewsParams];
        if (value !== undefined && value !== null) {
          if (typeof value === 'boolean') {
            queryParams[key] = value.toString();
          } else {
            queryParams[key] = value as string | number;
          }
        }
      });
    }
    return axiosClient.get<PaginatedReviewsResponse<Review>>('/reviews', { params: queryParams });
  },

  getReviewById: (id: string) => {
    return axiosClient.get<Review>(`/reviews/${id}`);
  },

  checkTransactionReview: (
    reviewerId: string,
    transactionId: string,
    review_type?: ReviewDirection,
  ) => {
    const params: GetReviewsParams = {
      reviewer_id: reviewerId,
      transaction_id: transactionId,
    };

    if (review_type) {
      params.review_type = review_type;
    }

    return reviewApi.getReviews(params);
  },

  createReview: (data: CreateReviewDto) => {
    // Backend auto-detects review_type from transaction, so we don't need to send it
    // CreateReviewDto no longer includes review_type, so we can send data directly
    return axiosClient.post<Review>('/reviews', data);
  },

  createBuyerReview: (payload: CreateReviewPayload) => {
    return reviewApi.createReview(payload);
  },

  createSellerReview: (payload: CreateReviewPayload) => {
    return reviewApi.createReview(payload);
  },

  updateReview: (id: string, data: UpdateReviewPayload) => {
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
