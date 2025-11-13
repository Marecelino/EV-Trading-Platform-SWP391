// src/pages/AdminTransactionManagementPage/AdminTransactionManagementPage.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Phone, DollarSign, Calendar, CreditCard, Info } from 'lucide-react';
import transactionApi, { GetTransactionsParams } from '../../api/transactionApi';
import authApi from '../../api/authApi';
import type { ITransaction, PaginatedTransactionsResponse, User as UserType } from '../../types';
import { UpdateTransactionStatusDto } from '../../types/api';
import { toast } from 'react-toastify';
import Pagination from '../../components/common/Pagination/Pagination';
import './AdminTransactionManagementPage.scss';

type TransactionStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'FAILED';

const AdminTransactionManagementPage: React.FC = () => {
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TransactionStatus | 'all'>('all');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [userCache, setUserCache] = useState<Record<string, UserType>>({}); // Cache for fetched users
  const userCacheRef = useRef<Record<string, UserType>>({}); // Ref to avoid dependency issues
  const loadingUsersRef = useRef<Set<string>>(new Set()); // Ref to track loading users
  const ITEMS_PER_PAGE = 20; // Increased from 3 to show more transactions

  // Helper function to get Vietnamese status label
  const getStatusLabel = (status: string): string => {
    const statusUpper = status.toUpperCase();
    const statusMap: Record<string, string> = {
      PENDING: 'Đang chờ',
      PROCESSING: 'Đang xử lý',
      COMPLETED: 'Hoàn thành',
      CANCELLED: 'Đã hủy',
      FAILED: 'Thất bại',
    };
    return statusMap[statusUpper] || status;
  };

  // Helper function to normalize status (convert to uppercase)
  const normalizeStatus = (status: string): TransactionStatus => {
    const statusUpper = status.toUpperCase() as TransactionStatus;
    return statusUpper;
  };

  // Map frontend tab to API status
  const mapTabToApiStatus = (tab: TransactionStatus | 'all'): string | undefined => {
    if (tab === 'all') return undefined;
    return tab;
  };

  // Fetch user by ID and cache it
  const fetchUser = useCallback(async (userId: string): Promise<UserType | null> => {
    // Check cache first (using ref to avoid dependency)
    if (userCacheRef.current[userId]) {
      return userCacheRef.current[userId];
    }

    // Check if already loading
    if (loadingUsersRef.current.has(userId)) {
      return null;
    }

    try {
      loadingUsersRef.current.add(userId);
      const response = await authApi.getUserById(userId);
      const user = response.data;
      
      if (user && typeof user === 'object' && '_id' in user) {
        const userData = user as UserType;
        // Update both ref and state
        userCacheRef.current[userId] = userData;
        setUserCache(prev => ({ ...prev, [userId]: userData }));
        return userData;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error);
      return null;
    } finally {
      loadingUsersRef.current.delete(userId);
    }
  }, []); // No dependencies to avoid infinite loop

  // Fetch transactions with proper response handling
  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    console.log("=== FETCHING TRANSACTIONS ===");
    console.log("Active tab:", activeTab);
    
    const apiStatus = mapTabToApiStatus(activeTab);
    const params: GetTransactionsParams = {
      page: pagination.currentPage,
      limit: ITEMS_PER_PAGE,
      status: apiStatus,
    };
    
    try {
      const response = await transactionApi.getTransactions(params);
      console.log("=== TRANSACTIONS API RESPONSE ===");
      console.log("Full response:", response);
      console.log("Response data:", response.data);
      
      // Handle response structure: { data: [...], meta: {...}, stats: {...} }
      const responseData = response.data as PaginatedTransactionsResponse;
      
      let transactionsData: ITransaction[] = [];
      
      // Extract transactions from response
      if (Array.isArray(responseData)) {
        // Direct array format (fallback)
        transactionsData = responseData;
      } else if (responseData?.data && Array.isArray(responseData.data)) {
        // Standard format: { data: [...], meta: {...}, stats: {...} }
        transactionsData = responseData.data;
      } else {
        console.warn("Unknown response structure:", responseData);
      }
      
      // Validate transactions
      transactionsData = transactionsData.filter((tx): tx is ITransaction => {
        if (!tx || !tx._id) {
          console.warn("Invalid transaction found:", tx);
          return false;
        }
        return true;
      });
      
      setTransactions(transactionsData);
      console.log(`Loaded ${transactionsData.length} transactions`);
      
      // Fetch user info for transactions where buyer_id/seller_id are strings
      // Use ref to check cache to avoid dependency issues
      const userIdsToFetch = new Set<string>();
      transactionsData.forEach(tx => {
        if (typeof tx.buyer_id === 'string' && !userCacheRef.current[tx.buyer_id]) {
          userIdsToFetch.add(tx.buyer_id);
        }
        if (typeof tx.seller_id === 'string' && !userCacheRef.current[tx.seller_id]) {
          userIdsToFetch.add(tx.seller_id);
        }
      });

      // Fetch all users in parallel
      if (userIdsToFetch.size > 0) {
        await Promise.allSettled(
          Array.from(userIdsToFetch).map(userId => fetchUser(userId))
        );
      }
      
      // Update pagination from meta
      if (responseData?.meta) {
        const meta = responseData.meta;
        setPagination({
          currentPage: meta.page || pagination.currentPage,
          totalPages: meta.totalPages || meta.pages || Math.ceil((meta.total || 0) / ITEMS_PER_PAGE) || 1,
        });
      } else if (responseData?.pagination) {
        // Legacy pagination support
        const pag = responseData.pagination;
        setPagination({
          currentPage: pag.page || pagination.currentPage,
          totalPages: pag.pages || Math.ceil((pag.total || 0) / ITEMS_PER_PAGE) || 1,
        });
      } else {
        // Fallback: calculate from data length
        setPagination({
          currentPage: pagination.currentPage,
          totalPages: Math.ceil(transactionsData.length / ITEMS_PER_PAGE) || 1,
        });
      }
    } catch (error: unknown) {
      console.error("Error fetching transactions:", error);
      const errorMessage = (error as { response?: { data?: unknown }; message?: string })?.response?.data || 
                          (error as { message?: string })?.message;
      console.error("Error details:", errorMessage);
      toast.error("Không thể tải danh sách giao dịch");
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, pagination.currentPage]); // Removed fetchUser and userCache from dependencies

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, pagination.currentPage]); // Only depend on activeTab and pagination.currentPage

  const handleTabClick = (tab: TransactionStatus | 'all') => {
    setActiveTab(tab);
    setPagination((p) => ({ ...p, currentPage: 1 }));
  };

  // Handle transaction status update
  const handleUpdateStatus = (transactionId: string, newStatus: TransactionStatus, transactionTitle?: string) => {
    const statusLabel = getStatusLabel(newStatus);
    const title = transactionTitle || "giao dịch này";
    
    if (!window.confirm(`Bạn có chắc muốn chuyển ${title} sang trạng thái "${statusLabel}"?`)) {
      return;
    }

    const updateData: UpdateTransactionStatusDto = {
      status: newStatus,
    };

    transactionApi.updateTransactionStatus(transactionId, updateData)
      .then((response) => {
        const isSuccess = response.status === 200 || 
                         (response.data && typeof response.data === 'object' && '_id' in response.data);
        
        if (isSuccess) {
          toast.success(`Đã cập nhật trạng thái giao dịch thành "${statusLabel}"`);
          fetchTransactions();
        } else {
          toast.error("Có lỗi xảy ra, vui lòng thử lại");
        }
      })
      .catch((error: unknown) => {
        console.error("Error updating transaction status:", error);
        const errorMessage = (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || 
                            (error as { message?: string })?.message || 
                            "Có lỗi xảy ra khi cập nhật trạng thái";
        toast.error(errorMessage);
      });
  };

  // Helper to get user info (from populated object or cache)
  const getUserInfo = useCallback((userId: UserType | string | undefined): UserType | null => {
    if (!userId) return null;
    
    if (typeof userId === 'object' && '_id' in userId) {
      return userId as UserType;
    }
    
    if (typeof userId === 'string') {
      // Check both state and ref for user info
      return userCache[userId] || userCacheRef.current[userId] || null;
    }
    
    return null;
  }, [userCache]); // Keep userCache here for reactive updates in UI

  // Helper function to get available actions for a transaction status
  const getAvailableActions = (currentStatus: string) => {
    const statusUpper = normalizeStatus(currentStatus);
    
    switch (statusUpper) {
      case 'PENDING':
        return [
          { label: 'Xử lý', status: 'PROCESSING' as TransactionStatus, className: 'btn--approve' },
          { label: 'Hủy', status: 'CANCELLED' as TransactionStatus, className: 'btn--reject' },
        ];
      case 'PROCESSING':
        return [
          { label: 'Hoàn thành', status: 'COMPLETED' as TransactionStatus, className: 'btn--approve' },
          { label: 'Hủy', status: 'CANCELLED' as TransactionStatus, className: 'btn--reject' },
        ];
      case 'FAILED':
        return [
          { label: 'Xử lý lại', status: 'PENDING' as TransactionStatus, className: 'btn--approve' },
        ];
      case 'COMPLETED':
      case 'CANCELLED':
      default:
        return [];
    }
  };

  return (
    <div className="admin-page">
      <h1>Quản lý giao dịch</h1>

      <div className="admin-tabs">
        <button
          className={activeTab === 'all' ? 'active' : ''}
          onClick={() => handleTabClick('all')}
        >
          Tất cả
        </button>
        <button
          className={activeTab === 'PENDING' ? 'active' : ''}
          onClick={() => handleTabClick('PENDING')}
        >
          Đang chờ
        </button>
        <button
          className={activeTab === 'PROCESSING' ? 'active' : ''}
          onClick={() => handleTabClick('PROCESSING')}
        >
          Đang xử lý
        </button>
        <button
          className={activeTab === 'COMPLETED' ? 'active' : ''}
          onClick={() => handleTabClick('COMPLETED')}
        >
          Hoàn thành
        </button>
        <button
          className={activeTab === 'CANCELLED' ? 'active' : ''}
          onClick={() => handleTabClick('CANCELLED')}
        >
          Đã hủy
        </button>
        <button
          className={activeTab === 'FAILED' ? 'active' : ''}
          onClick={() => handleTabClick('FAILED')}
        >
          Thất bại
        </button>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>Người mua</th>
              <th>Người bán</th>
              <th>Số tiền</th>
              <th>Phương thức</th>
              <th>Ngày tạo</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="empty-cell">
                  <div className="loading-spinner">Đang tải dữ liệu...</div>
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-cell">
                  <div className="empty-state">
                    <p className="empty-state-title">
                      Không có giao dịch nào trong mục này.
                    </p>
                    <p className="empty-state-subtitle">
                      Hãy thử chuyển sang tab khác hoặc tạo giao dịch mới.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              transactions.map((tx) => {
                // Extract listing data
                const listing = typeof tx.listing_id === 'object' && tx.listing_id
                  ? tx.listing_id
                  : null;
                const listingTitle = listing
                  ? ('title' in listing ? (listing as { title?: string })?.title : null) ||
                    ('name' in listing ? (listing as { name?: string })?.name : null) ||
                    'N/A'
                  : tx.auction_id ? 'Auction' : 'N/A';
                const listingImages = listing && 'images' in listing && Array.isArray((listing as { images?: string[] }).images)
                  ? (listing as { images?: string[] }).images || []
                  : [];
                const firstImage = listingImages[0] || '/placeholder-image.jpg';
                const listingId = listing && '_id' in listing
                  ? (listing as { _id?: string })?._id
                  : typeof tx.listing_id === 'string' ? tx.listing_id : null;

                // Get buyer info (from populated object or cache)
                const buyer = getUserInfo(tx.buyer_id);
                const buyerName = buyer?.full_name || buyer?.name || 'Đang tải...';
                const buyerEmail = buyer?.email;
                const buyerPhone = buyer?.phone;
                const buyerId = typeof tx.buyer_id === 'string' ? tx.buyer_id : buyer?._id;

                // Get seller info (from populated object or cache)
                const seller = getUserInfo(tx.seller_id);
                const sellerName = seller?.full_name || seller?.name || 'Đang tải...';
                const sellerEmail = seller?.email;
                const sellerPhone = seller?.phone;
                const sellerId = typeof tx.seller_id === 'string' ? tx.seller_id : seller?._id;

                // Get price (backend returns price, not amount)
                const price = tx.price ?? tx.amount ?? 0;
                const platformFee = tx.platform_fee || 0;
                const sellerPayout = tx.seller_payout || (price - platformFee);

                // Get date
                const createdDate = tx.created_at || tx.createdAt || tx.transaction_date || '';
                const formattedDate = createdDate
                  ? new Date(createdDate).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'N/A';

                // Get status (normalize to uppercase)
                const txStatus = normalizeStatus(tx.status);
                const statusLabel = getStatusLabel(tx.status);

                // Get available actions
                const actions = getAvailableActions(tx.status);
                const isFinalStatus = txStatus === 'COMPLETED' || txStatus === 'CANCELLED';

                return (
                  <tr key={tx._id}>
                    <td>
                      {listingId ? (
                        <div className="product-cell">
                          <img
                            src={firstImage}
                            alt={listingTitle}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                            }}
                          />
                          <div className="product-info">
                            <Link to={`/products/${listingId}`} target="_blank">
                              {listingTitle}
                            </Link>
                            {tx.auction_id && (
                              <span className="auction-badge">Auction</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span>{listingTitle}</span>
                      )}
                    </td>
                    <td>
                      <div className="user-cell">
                        {buyerId && (
                          <Link to={`/admin/users/${buyerId}`} className="user-link">
                            <User size={16} />
                            <div className="user-info">
                              <span className="user-name">{buyerName}</span>
                              {buyerEmail && (
                                <span className="user-email">
                                  <Mail size={12} />
                                  {buyerEmail}
                                </span>
                              )}
                              {buyerPhone && (
                                <span className="user-phone">
                                  <Phone size={12} />
                                  {buyerPhone}
                                </span>
                              )}
                            </div>
                          </Link>
                        )}
                        {!buyerId && <span>{buyerName}</span>}
                      </div>
                    </td>
                    <td>
                      <div className="user-cell">
                        {sellerId && (
                          <Link to={`/admin/users/${sellerId}`} className="user-link">
                            <User size={16} />
                            <div className="user-info">
                              <span className="user-name">{sellerName}</span>
                              {sellerEmail && (
                                <span className="user-email">
                                  <Mail size={12} />
                                  {sellerEmail}
                                </span>
                              )}
                              {sellerPhone && (
                                <span className="user-phone">
                                  <Phone size={12} />
                                  {sellerPhone}
                                </span>
                              )}
                            </div>
                          </Link>
                        )}
                        {!sellerId && <span>{sellerName}</span>}
                      </div>
                    </td>
                    <td>
                      <div className="price-cell">
                        <div className="price-main">
                          <DollarSign size={16} />
                          <strong>{price.toLocaleString('vi-VN')} ₫</strong>
                        </div>
                        {platformFee > 0 && (
                          <div className="price-detail">
                            <span className="fee">Phí: {platformFee.toLocaleString('vi-VN')} ₫</span>
                          </div>
                        )}
                        {sellerPayout > 0 && (
                          <div className="price-detail">
                            <span className="payout">Người bán nhận: {sellerPayout.toLocaleString('vi-VN')} ₫</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="payment-method-cell">
                        <CreditCard size={16} />
                        <span>{tx.payment_method || 'N/A'}</span>
                        {tx.payment_reference && (
                          <span className="payment-ref" title={tx.payment_reference}>
                            Ref: {tx.payment_reference.substring(0, 8)}...
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="date-cell">
                        <Calendar size={16} />
                        <span>{formattedDate}</span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`status-badge status--${txStatus.toLowerCase()}`}
                        title={statusLabel}
                      >
                        {statusLabel}
                      </span>
                      {tx.notes && (
                        <div className="notes-tooltip" title={tx.notes}>
                          <Info size={14} />
                        </div>
                      )}
                    </td>
                    <td className="actions-cell">
                      {isFinalStatus ? (
                        <span className="no-actions">
                          Không có hành động
                        </span>
                      ) : (
                        <div className="action-buttons">
                          {actions.map((action) => (
                            <button
                              key={action.status}
                              className={`action-btn ${action.className}`}
                              onClick={() => handleUpdateStatus(tx._id, action.status, listingTitle)}
                              title={`Chuyển sang "${getStatusLabel(action.status)}"`}
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      {!isLoading && transactions.length > 0 && (
        <div className="pagination-wrapper">
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={(page) =>
              setPagination((p) => ({ ...p, currentPage: page }))
            }
          />
          <div className="pagination-info">
            Trang {pagination.currentPage} / {pagination.totalPages}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTransactionManagementPage;
