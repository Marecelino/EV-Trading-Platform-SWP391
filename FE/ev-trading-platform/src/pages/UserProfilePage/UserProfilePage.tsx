import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import transactionApi from '../../api/transactionApi';
import reviewApi from '../../api/reviewApi';
import authApi from '../../api/authApi';
import type { ITransaction, Review, User, Product } from '../../types';
import { UpdateUserDto, ChangePasswordDto } from '../../types/api';
import { Edit } from 'lucide-react';
import './UserProfilePage.scss';
import EditProfileModal from '../../components/modals/EditProfileModal/EditProfileModal';

// CRITICAL FIX: Type guard function to properly narrow the union type
function isChangePasswordDto(data: UpdateUserDto | ChangePasswordDto): data is ChangePasswordDto {
  return 'currentPassword' in data && 'newPassword' in data;
}

const UserProfilePage: React.FC = () => {
  const { user, loading, login } = useAuth(); // Use login to update context after profile update
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // CRITICAL FIX: Update API calls with proper params
        const [transRes, reviewsRes] = await Promise.all([
          transactionApi.getMyTransactions({ as: 'buyer' }), // Get as buyer, can also pass { as: 'seller' }
          reviewApi.getReviews({ reviewee_id: user?._id }), // Filter reviews for current user
        ]);
        
        // CRITICAL FIX: Handle transactions response properly
        // getMyTransactions returns AxiosResponse<ITransaction[]>, so response.data is ITransaction[]
        const transResponseData = transRes.data as ITransaction[] | { data?: ITransaction[] };
        let transData: ITransaction[] = [];
        if (Array.isArray(transResponseData)) {
          transData = transResponseData;
        } else if (transResponseData && typeof transResponseData === 'object' && 'data' in transResponseData && Array.isArray(transResponseData.data)) {
          transData = transResponseData.data;
        }
        setTransactions(transData);
        
        // CRITICAL FIX: Handle reviews response properly
        // getReviews returns AxiosResponse<Review[]>, so response.data is Review[]
        const reviewsResponseData = reviewsRes.data as Review[] | { data?: Review[] };
        let reviewsData: Review[] = [];
        if (Array.isArray(reviewsResponseData)) {
          reviewsData = reviewsResponseData;
        } else if (reviewsResponseData && typeof reviewsResponseData === 'object' && 'data' in reviewsResponseData && Array.isArray(reviewsResponseData.data)) {
          reviewsData = reviewsResponseData.data;
        }
        setReviews(reviewsData);
      } catch (error) {
        console.error("Failed to fetch user data", error);
      }
    };
    if (user) {
      fetchData();
    }
  }, [user]);

  // CRITICAL FIX: Update function signature to match EditProfileModal's onSave prop
  // Handle both UpdateUserDto and ChangePasswordDto
  const handleUpdateProfile = async (updatedData: UpdateUserDto | ChangePasswordDto) => {
    try {
      // CRITICAL FIX: Use type guard to properly narrow the union type
      if (isChangePasswordDto(updatedData)) {
        // Call changePassword API for password changes
        await authApi.changePassword(updatedData);
        setIsEditModalOpen(false);
        alert('Đổi mật khẩu thành công!');
      } else {
        // Call updateProfile API for profile updates
        const response = await authApi.updateProfile(updatedData);
        // CRITICAL FIX: updateProfile returns AxiosResponse<User>, so response.data is User
        const responseData = response.data as User | { data?: User };
        const updatedUser = ('data' in responseData && responseData.data) 
          ? responseData.data 
          : (responseData as User);
        
        const token = localStorage.getItem('token');
        if (token) {
          login(token, updatedUser); // Update context
        }
        setIsEditModalOpen(false);
        alert('Cập nhật thành công!');
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật profile:", error);
      const errorMessage = isChangePasswordDto(updatedData) 
        ? 'Đổi mật khẩu thất bại, vui lòng thử lại.' 
        : 'Cập nhật thất bại, vui lòng thử lại.';
      alert(errorMessage);
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
                {transactions.map(tx => {
                  // CRITICAL FIX: Add type guards for listing_id and buyer_id
                  const listingTitle = typeof tx.listing_id === 'object' && tx.listing_id 
                    ? (tx.listing_id as Product).title || (tx.listing_id as Product).name || 'N/A'
                    : 'N/A';
                  const buyerId = typeof tx.buyer_id === 'object' && tx.buyer_id 
                    ? (tx.buyer_id as User)._id 
                    : (tx.buyer_id as string);
                  
                  return (
                    <tr key={tx._id}>
                      <td>{listingTitle}</td>
                      <td>{buyerId === user._id ? 'Người mua' : 'Người bán'}</td>
                      <td>{tx.amount.toLocaleString('vi-VN')} ₫</td>
                      <td>{new Date(tx.created_at).toLocaleDateString('vi-VN')}</td>
                      <td><span className={`status-badge status--${tx.status}`}>{tx.status}</span></td>
                    </tr>
                  );
                })}
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