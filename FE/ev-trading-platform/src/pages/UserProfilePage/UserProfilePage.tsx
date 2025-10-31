import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import transactionApi from '../../api/transactionApi';
import reviewApi from '../../api/reviewApi';
import authApi from '../../api/authApi';
import type { ITransaction, UpdateUserDto, Review, User } from '../../types';
import { Edit } from 'lucide-react';
import './UserProfilePage.scss';
import EditProfileModal from '../../components/modals/EditProfileModal/EditProfileModal';

const UserProfilePage: React.FC = () => {
  const { user, loading, login } = useAuth(); // Use login to update context after profile update
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // CRITICAL FIX: Update API calls with proper params
        const [transRes, reviewsRes] = await Promise.all([
          transactionApi.getMyTransactions({ as: 'buyer' }), // Get as buyer, can also pass { as: 'seller' }
          reviewApi.getReviews({ reviewee_id: user?._id }), // Filter reviews for current user
        ]);
        
        // Handle transactions response
        if(transRes.data?.data) {
            setTransactions(transRes.data.data);
        } else if(Array.isArray(transRes.data)) {
            setTransactions(transRes.data);
        }
        
        // Handle reviews response - already filtered by backend with reviewee_id param
        if (reviewsRes.data?.data) {
          setReviews(reviewsRes.data.data);
        } else if (Array.isArray(reviewsRes.data)) {
          setReviews(reviewsRes.data);
        }
      } catch (error) {
        console.error("Failed to fetch user data", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (user) {
      fetchData();
    }
  }, [user]);

  const handleUpdateProfile = async (updatedData: Partial<UpdateUserDto>) => {
    try {
      const response = await authApi.updateProfile(updatedData);
      const updatedUser = response.data.data;
      const token = localStorage.getItem('token');
      if (token) {
        login(token, updatedUser); // Update context
      }
      setIsEditModalOpen(false);
      alert('Cập nhật thành công!');
    } catch (error) {
      console.error("Lỗi khi cập nhật profile:", error);
      alert('Cập nhật thất bại, vui lòng thử lại.');
    }
  };

  if (loading || !user) return <div>Đang tải thông tin...</div>;

  return (
    <>
      {isEditModalOpen && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          user={user}
          onSave={handleUpdateProfile}
        />
      )}
      <div className="user-profile-page">
        <div className="profile-header content-card">
          <div className="avatar-section">
            <img src={user.avatar_url} alt={user.full_name} />
            <button className="edit-avatar-btn"><Edit size={16} /></button>
          </div>
          <div className="info-section">
            <h1>{user.full_name}</h1>
            <p>{user.email}</p>
            {user.phone && <p>SĐT: {user.phone}</p>}
            <button className="edit-profile-btn" onClick={() => setIsEditModalOpen(true)}>
              Chỉnh sửa thông tin
            </button>
          </div>
        </div>

        <div className="transaction-history content-card">
          <h2>Lịch sử giao dịch</h2>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Vai trò</th>
                  <th>Số tiền</th>
                  <th>Ngày</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx._id}>
                    <td>{tx.listing_id.title}</td>
                    <td>{tx.buyer_id._id === user._id ? 'Người mua' : 'Người bán'}</td>
                    <td>{tx.amount.toLocaleString('vi-VN')} ₫</td>
                    <td>{new Date(tx.created_at).toLocaleDateString('vi-VN')}</td>
                    <td><span className={`status-badge status--${tx.status}`}>{tx.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="reviews-section content-card">
          <h2>Đánh giá nhận được</h2>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Người đánh giá</th>
                  <th>Đánh giá</th>
                  <th>Bình luận</th>
                  <th>Ngày</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map(review => (
                  <tr key={review._id}>
                    <td>{(review.reviewer_id as User).full_name}</td>
                    <td>{review.rating}</td>
                    <td>{review.comment}</td>
                    <td>{new Date(review.created_at).toLocaleDateString('vi-VN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};
export default UserProfilePage;