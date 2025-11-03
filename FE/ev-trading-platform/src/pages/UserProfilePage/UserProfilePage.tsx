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

type TransactionFilter = 'all' | 'buyer' | 'seller';

const UserProfilePage: React.FC = () => {
  const { user, loading, login } = useAuth(); // Use login to update context after profile update
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<ITransaction[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState<TransactionFilter>('all');

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      setIsLoadingData(true);
      try {
        // Fetch all transactions (no filter to get both buyer and seller transactions)
        const [buyerRes, sellerRes, reviewsRes] = await Promise.all([
          transactionApi.getMyTransactions({ as: 'buyer' }),
          transactionApi.getMyTransactions({ as: 'seller' }),
          reviewApi.getReviews({ reviewee_id: user._id }),
        ]);
        
        // Combine buyer and seller transactions
        const buyerData = Array.isArray(buyerRes.data) 
          ? buyerRes.data 
          : (buyerRes.data as { data?: ITransaction[] })?.data || [];
        
        const sellerData = Array.isArray(sellerRes.data)
          ? sellerRes.data
          : (sellerRes.data as { data?: ITransaction[] })?.data || [];
        
        // Merge and remove duplicates (in case backend returns same transaction in both)
        const allTrans = [...buyerData, ...sellerData];
        const uniqueTrans = allTrans.filter((tx, index, self) => 
          index === self.findIndex(t => t._id === tx._id)
        );
        
        setAllTransactions(uniqueTrans);
        
        // Handle reviews response
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
      } finally {
        setIsLoadingData(false);
      }
    };
    
    fetchData();
  }, [user]);

  // Filter transactions based on selected filter
  useEffect(() => {
    if (!user) return;
    
    const filtered = allTransactions.filter(tx => {
      if (transactionFilter === 'all') return true;
      
      const buyerId = typeof tx.buyer_id === 'object' ? tx.buyer_id._id : tx.buyer_id;
      const sellerId = typeof tx.seller_id === 'object' ? tx.seller_id._id : tx.seller_id;
      
      if (transactionFilter === 'buyer') {
        return buyerId === user._id;
      }
      if (transactionFilter === 'seller') {
        return sellerId === user._id;
      }
      return true;
    });
    
    setTransactions(filtered);
  }, [allTransactions, transactionFilter, user]);

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

  // Helper function to get status label in Vietnamese
  const getStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
      'pending': 'Đang chờ',
      'PENDING': 'Đang chờ',
      'processing': 'Đang xử lý',
      'PROCESSING': 'Đang xử lý',
      'completed': 'Hoàn thành',
      'COMPLETED': 'Hoàn thành',
      'cancelled': 'Đã hủy',
      'CANCELLED': 'Đã hủy',
      'failed': 'Thất bại',
      'FAILED': 'Thất bại',
    };
    return statusMap[status] || status;
  };

  // Helper function to format date safely
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  if (loading || !user) {
    return (
      <div className="user-profile-page">
        <div className="loading-state">Đang tải thông tin...</div>
      </div>
    );
  }

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
          <div className="section-header">
            <h2>Lịch sử giao dịch</h2>
            <div className="filter-tabs">
              <button
                className={`filter-tab ${transactionFilter === 'all' ? 'active' : ''}`}
                onClick={() => setTransactionFilter('all')}
              >
                Tất cả
              </button>
              <button
                className={`filter-tab ${transactionFilter === 'buyer' ? 'active' : ''}`}
                onClick={() => setTransactionFilter('buyer')}
              >
                Người mua
              </button>
              <button
                className={`filter-tab ${transactionFilter === 'seller' ? 'active' : ''}`}
                onClick={() => setTransactionFilter('seller')}
              >
                Người bán
              </button>
            </div>
          </div>
          
          {isLoadingData ? (
            <div className="loading-state">Đang tải dữ liệu...</div>
          ) : transactions.length === 0 ? (
            <div className="empty-state">
              <p>Chưa có giao dịch nào</p>
            </div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Hình ảnh</th>
                    <th>Vai trò</th>
                    <th>Số tiền</th>
                    <th>Ngày</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => {
                    // Extract listing/product info
                    const listing = typeof tx.listing_id === 'object' && tx.listing_id 
                      ? (tx.listing_id as Product)
                      : null;
                    const listingTitle = listing?.title || listing?.name || (tx.listing_id ? 'Sản phẩm' : tx.auction_id ? 'Đấu giá' : 'N/A');
                    const listingImage = listing?.images?.[0] || null;
                    
                    // Extract buyer and seller IDs
                    const buyerId = typeof tx.buyer_id === 'object' && tx.buyer_id 
                      ? tx.buyer_id._id 
                      : (tx.buyer_id as string);
                    const sellerId = typeof tx.seller_id === 'object' && tx.seller_id 
                      ? tx.seller_id._id 
                      : (tx.seller_id as string);
                    
                    // Determine user role
                    const role = buyerId === user._id ? 'Người mua' : (sellerId === user._id ? 'Người bán' : 'N/A');
                    
                    // Use price (required) with fallback to amount
                    const amount = tx.price || tx.amount || 0;
                    
                    // Format date safely
                    const dateStr = tx.created_at || tx.createdAt || tx.transaction_date;
                    
                    return (
                      <tr key={tx._id}>
                        <td className="product-title">{listingTitle}</td>
                        <td className="product-image">
                          {listingImage ? (
                            <img src={listingImage} alt={listingTitle} />
                          ) : (
                            <div className="no-image">—</div>
                          )}
                        </td>
                        <td>{role}</td>
                        <td className="amount">{amount.toLocaleString('vi-VN')} ₫</td>
                        <td>{formatDate(dateStr)}</td>
                        <td>
                          <span className={`status-badge status--${tx.status.toLowerCase()}`}>
                            {getStatusLabel(tx.status)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="reviews-section content-card">
          <h2>Đánh giá nhận được</h2>
          
          {isLoadingData ? (
            <div className="loading-state">Đang tải dữ liệu...</div>
          ) : reviews.length === 0 ? (
            <div className="empty-state">
              <p>Chưa có đánh giá nào</p>
            </div>
          ) : (
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
                  {reviews.map(review => {
                    // Handle reviewer_id (could be User object or string)
                    const reviewer = typeof review.reviewer_id === 'object' && review.reviewer_id
                      ? review.reviewer_id
                      : null;
                    const reviewerName = reviewer?.full_name || reviewer?.name || 'Người dùng';
                    
                    return (
                      <tr key={review._id}>
                        <td>{reviewerName}</td>
                        <td className="rating-cell">
                          <span className="rating-stars">
                            {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                          </span>
                          <span className="rating-number">({review.rating}/5)</span>
                        </td>
                        <td className="comment-cell">{review.comment || 'Không có bình luận'}</td>
                        <td>{formatDate(review.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
export default UserProfilePage;