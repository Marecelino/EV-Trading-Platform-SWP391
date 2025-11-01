// src/pages/AdminReviewManagementPage/AdminReviewManagementPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import reviewApi from '../../api/reviewApi';
import type { Review, User } from '../../types';
import Pagination from '../../components/common/Pagination/Pagination';
import './AdminReviewManagementPage.scss';

const AdminReviewManagementPage: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });

  // CRITICAL FIX: Pass pagination params to getReviews
  const fetchReviews = useCallback((page: number) => {
    setIsLoading(true);
    const params = { page, limit: 10 }; // Pass page and limit to API
    
    reviewApi.getReviews(params).then((response) => {
      // CRITICAL FIX: Handle response structure properly
      // getReviews returns AxiosResponse<Review[]>, so response.data is Review[] or wrapped
      const responseData = response.data as Review[] | { 
        data?: Review[]; 
        meta?: { page?: number; totalPages?: number }; 
        pagination?: { page?: number; pages?: number } 
      };
      
      // Extract reviews data
      let reviewsData: Review[] = [];
      if (Array.isArray(responseData)) {
        reviewsData = responseData;
      } else if (responseData && typeof responseData === 'object' && 'data' in responseData && Array.isArray(responseData.data)) {
        reviewsData = responseData.data;
      }
      
      setReviews(reviewsData);
      
      // CRITICAL FIX: Handle pagination from response with proper type checking
      // Fix mixed ?? and || operators
      if (responseData && typeof responseData === 'object' && 'meta' in responseData && responseData.meta) {
        const totalPages = responseData.meta.totalPages ?? (Math.ceil(reviewsData.length / 10) || 1);
        setPagination({
          currentPage: responseData.meta.page ?? page,
          totalPages,
        });
      } else if (responseData && typeof responseData === 'object' && 'pagination' in responseData && responseData.pagination) {
        const totalPages = responseData.pagination.pages ?? (Math.ceil(reviewsData.length / 10) || 1);
        setPagination({
          currentPage: responseData.pagination.page ?? page,
          totalPages,
        });
      } else {
        // Fallback pagination
        setPagination({
          currentPage: page,
          totalPages: Math.ceil(reviewsData.length / 10) || 1,
        });
      }
    }).catch((error: unknown) => {
      console.error("Error fetching reviews:", error);
      setReviews([]);
    }).finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    fetchReviews(pagination.currentPage);
  }, [pagination.currentPage, fetchReviews]);

  return (
    <div className="admin-page">
      <h1>Quản lý đánh giá</h1>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Người đánh giá</th>
              <th>Người bị đánh giá</th>
              <th>Đánh giá</th>
              <th>Bình luận</th>
              <th>Loại</th>
              <th>Ngày tạo</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center' }}>Đang tải...</td></tr>
            ) : (
              reviews.map(review => {
                // CRITICAL FIX: Add type guards for reviewer_id and reviewee_id
                const reviewer = typeof review.reviewer_id === 'object' && review.reviewer_id
                  ? review.reviewer_id as User
                  : null;
                const reviewee = typeof review.reviewee_id === 'object' && review.reviewee_id
                  ? review.reviewee_id as User
                  : null;
                
                return (
                  <tr key={review._id}>
                    <td>{reviewer?.full_name || 'N/A'}</td>
                    <td>{reviewee?.full_name || 'N/A'}</td>
                    <td>{review.rating}</td>
                    <td>{review.comment}</td>
                    <td>{review.review_type}</td>
                    <td>{new Date(review.created_at).toLocaleDateString('vi-VN')}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <Pagination 
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onPageChange={(page) => setPagination(p => ({...p, currentPage: page}))}
      />
    </div>
  );
};

export default AdminReviewManagementPage;
