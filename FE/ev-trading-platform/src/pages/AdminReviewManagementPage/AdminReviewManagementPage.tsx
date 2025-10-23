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

  const fetchReviews = useCallback((page: number) => {
    setIsLoading(true);
    reviewApi.getReviews().then(response => {
      if (response.data.data) {
        setReviews(response.data.data);
        setPagination({
            currentPage: response.data.meta.page,
            totalPages: response.data.meta.totalPages,
        });
      }
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
              reviews.map(review => (
                <tr key={review._id}>
                  <td>{(review.reviewer_id as User).full_name}</td>
                  <td>{(review.reviewee_id as User).full_name}</td>
                  <td>{review.rating}</td>
                  <td>{review.comment}</td>
                  <td>{review.review_type}</td>
                  <td>{new Date(review.created_at).toLocaleDateString('vi-VN')}</td>
                </tr>
              ))
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
