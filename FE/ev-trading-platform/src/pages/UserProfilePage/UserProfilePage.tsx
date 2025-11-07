import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import transactionApi from '../../api/transactionApi';
import reviewApi from '../../api/reviewApi';
import authApi from '../../api/authApi';
import type { ITransaction, Review, User } from '../../types';
import { UpdateUserDto, ChangePasswordDto, ReviewStats } from '../../types/api';
import { Edit } from 'lucide-react';
import { toast } from 'react-toastify';
import './UserProfilePage.scss';
import EditProfileModal from '../../components/modals/EditProfileModal/EditProfileModal';
import {
  ReviewFormModal,
  ReviewList,
  TransactionReviewCard,
  type TransactionRole,
} from '../../components/modules/Reviews';

// CRITICAL FIX: Type guard function to properly narrow the union type
function isChangePasswordDto(data: UpdateUserDto | ChangePasswordDto): data is ChangePasswordDto {
  return 'currentPassword' in data && 'newPassword' in data;
}

type TransactionFilter = 'all' | 'buyer' | 'seller' | 'pending' | 'reviewed';

const UserProfilePage: React.FC = () => {
  const { user, loading, login } = useAuth(); // Use login to update context after profile update
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<ITransaction[]>([]);
  const [reviewsReceived, setReviewsReceived] = useState<Review[]>([]);
  const [reviewsGiven, setReviewsGiven] = useState<Review[]>([]);
  const [reviewsGivenMap, setReviewsGivenMap] = useState<Record<string, Review>>({});
  const [reviewsStats, setReviewsStats] = useState<ReviewStats | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState<TransactionFilter>('all');
  const [reviewModalState, setReviewModalState] = useState<{
    transaction: ITransaction;
    role: TransactionRole;
    review?: Review;
  } | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const parseReviewResponse = (response: unknown) => {
    if (!response) {
      return { list: [] as Review[], stats: undefined as ReviewStats | undefined };
    }

    // Axios response.data contains the API response: { data: Review[], meta: {...}, stats: ReviewStats[] }
    // We're already passing response.data, so response should be the API response object
    if (typeof response === 'object' && response !== null) {
      const apiResponse = response as {
        data?: unknown;
        meta?: unknown;
        stats?: ReviewStats[];
      };
      
      // Backend returns { data: Review[], meta: {...}, stats: ReviewStats[] }
      const list = Array.isArray(apiResponse.data) ? (apiResponse.data as Review[]) : [];
      // stats is an array, we take the first element if available
      const stats = Array.isArray(apiResponse.stats) && apiResponse.stats.length > 0 
        ? apiResponse.stats[0] 
        : undefined;
      
      return { list, stats };
    }

    // Fallback: if it's directly an array (shouldn't happen with current API)
    if (Array.isArray(response)) {
      return { list: response as Review[], stats: undefined as ReviewStats | undefined };
    }

    return { list: [] as Review[], stats: undefined as ReviewStats | undefined };
  };

  const mapReviewsByTransaction = (reviewsList: Review[]) => {
    return reviewsList.reduce<Record<string, Review>>((accumulator, current) => {
      const transactionId =
        typeof current.transaction_id === 'object'
          ? (current.transaction_id as ITransaction)._id
          : (current.transaction_id as string | undefined);

      if (transactionId) {
        accumulator[transactionId] = current;
      }

      return accumulator;
    }, {});
  };

  const getRoleForTransaction = useCallback(
    (transaction: ITransaction): TransactionRole | null => {
      if (!user) return null;

      const buyerId =
        typeof transaction.buyer_id === 'object'
          ? (transaction.buyer_id as User)._id
          : (transaction.buyer_id as string | undefined);

      const sellerId =
        typeof transaction.seller_id === 'object'
          ? (transaction.seller_id as User)._id
          : (transaction.seller_id as string | undefined);

      if (buyerId === user._id) return 'buyer';
      if (sellerId === user._id) return 'seller';
      return null;
    },
    [user],
  );

  const isTransactionCompleted = useCallback((status: ITransaction['status']) => {
    if (!status) return false;
    const value = typeof status === 'string' ? status.toUpperCase() : status;
    return value === 'COMPLETED';
  }, []);

  const transactionCounters = useMemo(() => {
    const counters = {
      all: allTransactions.length,
      buyer: 0,
      seller: 0,
      pending: 0,
      reviewed: 0,
    };

    allTransactions.forEach((transaction) => {
      const role = getRoleForTransaction(transaction);
      const completed = isTransactionCompleted(transaction.status);
      const hasReview = Boolean(reviewsGivenMap[transaction._id]);

      if (role === 'buyer') counters.buyer += 1;
      if (role === 'seller') counters.seller += 1;
      if (role !== null && completed && !hasReview) counters.pending += 1;
      if (role !== null && hasReview) counters.reviewed += 1;
    });

    return counters;
  }, [allTransactions, getRoleForTransaction, isTransactionCompleted, reviewsGivenMap]);

  const handleSubmitReview = async ({
    rating,
    comment,
    transaction,
    revieweeId,
    reviewId,
  }: {
    rating: number;
    comment: string;
    transaction: ITransaction;
    revieweeId: string;
    reviewId?: string;
  }) => {
    setIsSubmittingReview(true);

    try {
      if (reviewId) {
        const response = await reviewApi.updateReview(reviewId, {
          rating,
          comment,
          transaction_id: transaction._id,
          reviewee_id: revieweeId,
        });

        const updatedReview = response.data;

        setReviewsGiven((previous) =>
          previous.map((item) => (item._id === reviewId ? updatedReview : item)),
        );
        setReviewsGivenMap((previous) => ({ ...previous, [transaction._id]: updatedReview }));
        toast.success('Đánh giá đã được cập nhật thành công!');
      } else {
        // Backend auto-detects review_type from transaction, so we don't send it
        const response = await reviewApi.createReview({
          reviewee_id: revieweeId,
          transaction_id: transaction._id,
          rating,
          comment,
        });

        const createdReview = response.data;
        setReviewsGiven((previous) => [...previous, createdReview]);
        setReviewsGivenMap((previous) => ({ ...previous, [transaction._id]: createdReview }));
        toast.success('Đánh giá đã được gửi thành công!');
      }

      setReviewModalState(null);
    } catch (error) {
      console.error('Error submitting review', error);
      toast.error('Không thể gửi đánh giá. Vui lòng thử lại.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      setIsLoadingData(true);
      try {
        const [buyerRes, sellerRes, receivedRes, givenRes] = await Promise.all([
          transactionApi.getMyTransactions({ as: 'buyer' }),
          transactionApi.getMyTransactions({ as: 'seller' }),
          reviewApi.getReviews({ reviewee_id: user._id, limit: 100 }),
          reviewApi.getReviews({ reviewer_id: user._id, limit: 100 }),
        ]);

        // /api/transactions/my returns array directly (not wrapped)
        const buyerData = Array.isArray(buyerRes.data)
          ? buyerRes.data
          : [];

        const sellerData = Array.isArray(sellerRes.data)
          ? sellerRes.data
          : [];

        const allTrans = [...buyerData, ...sellerData];
        const uniqueTrans = allTrans.filter((tx, index, self) =>
          index === self.findIndex((item) => item._id === tx._id)
        );

        setAllTransactions(uniqueTrans);

        // Parse review responses - axios wraps in .data property
        const receivedParsed = parseReviewResponse(receivedRes.data);
        const givenParsed = parseReviewResponse(givenRes.data);

        setReviewsReceived(receivedParsed.list);
        setReviewsStats(receivedParsed.stats ?? null);
        setReviewsGiven(givenParsed.list);
        setReviewsGivenMap(mapReviewsByTransaction(givenParsed.list));
      } catch (error) {
        console.error('Failed to fetch user data', error);
        toast.error('Không thể tải thông tin hồ sơ. Vui lòng thử lại sau.');
      } finally {
        setIsLoadingData(false);
      }
    };
    
    fetchData();
  }, [user]);

  // Filter transactions based on selected filter
  useEffect(() => {
    if (!user) return;

    const filtered = allTransactions.filter((transaction) => {
      const role = getRoleForTransaction(transaction);
      const completed = isTransactionCompleted(transaction.status);
      const hasReview = Boolean(reviewsGivenMap[transaction._id]);

      switch (transactionFilter) {
        case 'buyer':
          return role === 'buyer';
        case 'seller':
          return role === 'seller';
        case 'pending':
          return role !== null && completed && !hasReview;
        case 'reviewed':
          return role !== null && hasReview;
        case 'all':
        default:
          return true;
      }
    });

    setTransactions(filtered);
  }, [allTransactions, transactionFilter, user, reviewsGivenMap, getRoleForTransaction, isTransactionCompleted]);

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
      <ReviewFormModal
        isOpen={Boolean(reviewModalState)}
        transaction={reviewModalState?.transaction ?? null}
        role={reviewModalState?.role ?? 'buyer'}
        existingReview={reviewModalState?.review}
        onClose={() => setReviewModalState(null)}
        onSubmit={handleSubmitReview}
        isSubmitting={isSubmittingReview}
        initialRating={reviewModalState?.review?.rating}
        initialComment={reviewModalState?.review?.comment}
      />
      <div className="user-profile-page">
        <div className="profile-header content-card">
          <div className="avatar-section">
            <img src={user.avatar_url || user.avatar || ''} alt={user.full_name || user.name || 'User'} />
            <button className="edit-avatar-btn"><Edit size={16} /></button>
          </div>
          <div className="info-section">
            <h1>{user.full_name || user.name || 'User'}</h1>
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
                Tất cả ({transactionCounters.all})
              </button>
              <button
                className={`filter-tab ${transactionFilter === 'buyer' ? 'active' : ''}`}
                onClick={() => setTransactionFilter('buyer')}
              >
                Người mua ({transactionCounters.buyer})
              </button>
              <button
                className={`filter-tab ${transactionFilter === 'seller' ? 'active' : ''}`}
                onClick={() => setTransactionFilter('seller')}
              >
                Người bán ({transactionCounters.seller})
              </button>
              <button
                className={`filter-tab ${transactionFilter === 'pending' ? 'active' : ''}`}
                onClick={() => setTransactionFilter('pending')}
              >
                Chờ đánh giá ({transactionCounters.pending})
              </button>
              <button
                className={`filter-tab ${transactionFilter === 'reviewed' ? 'active' : ''}`}
                onClick={() => setTransactionFilter('reviewed')}
              >
                Đã đánh giá ({transactionCounters.reviewed})
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
            <div className="transaction-review-list">
              {transactions.map((tx) => {
                const role = getRoleForTransaction(tx);
                if (!role) return null;

                const review = reviewsGivenMap[tx._id] ?? null;
                const canReview = isTransactionCompleted(tx.status) && !review;

                return (
                  <TransactionReviewCard
                    key={tx._id}
                    transaction={tx}
                    role={role}
                    canReview={canReview}
                    review={review}
                    onReviewClick={(transaction, transactionRole, currentReview) =>
                      setReviewModalState({ transaction, role: transactionRole, review: currentReview || undefined })
                    }
                  />
                );
              })}
            </div>
          )}
        </div>

        <div className="reviews-section content-card">
          <ReviewList
            reviews={reviewsReceived}
            stats={reviewsStats || undefined}
            isLoading={isLoadingData}
            title="Đánh giá nhận được"
          />
        </div>

        <div className="reviews-section content-card">
          <ReviewList
            reviews={reviewsGiven}
            isLoading={isLoadingData}
            title="Đánh giá đã gửi"
            emptyMessage="Bạn chưa gửi đánh giá nào"
            showStats={false}
          />
        </div>
      </div>
    </>
  );
};
export default UserProfilePage;