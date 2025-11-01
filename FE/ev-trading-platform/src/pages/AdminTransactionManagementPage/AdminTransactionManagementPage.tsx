// src/pages/AdminTransactionManagementPage/AdminTransactionManagementPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import transactionApi, { GetTransactionsParams } from '../../api/transactionApi';
import type { ITransaction, PaginatedTransactionsResponse } from '../../types';
import { UpdateTransactionStatusDto } from '../../types/api';
import Pagination from '../../components/common/Pagination/Pagination';
import './AdminTransactionManagementPage.scss';

type TransactionStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'FAILED';

const AdminTransactionManagementPage: React.FC = () => {
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TransactionStatus | 'all'>('all');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const ITEMS_PER_PAGE = 3;

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

  // Fetch transactions with proper response handling
  const fetchTransactions = useCallback(() => {
    setIsLoading(true);
    console.log("=== FETCHING TRANSACTIONS ===");
    console.log("Active tab:", activeTab);
    
    const apiStatus = mapTabToApiStatus(activeTab);
    const params: GetTransactionsParams = {
      page: pagination.currentPage,
      limit: ITEMS_PER_PAGE,
      status: apiStatus,
    };
    
    transactionApi.getTransactions(params)
      .then((response) => {
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
      })
      .catch((error: unknown) => {
        console.error("Error fetching transactions:", error);
        console.error("Error details:", error.response?.data || error.message);
        setTransactions([]);
      })
      .finally(() => setIsLoading(false));
  }, [activeTab, pagination.currentPage]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

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
          alert(`Đã cập nhật trạng thái giao dịch thành "${statusLabel}".`);
          fetchTransactions();
        } else {
          alert("Có lỗi xảy ra, vui lòng thử lại.");
        }
      })
      .catch((error: unknown) => {
        console.error("Error updating transaction status:", error);
        const errorMessage = error.response?.data?.message || error.message || "Có lỗi xảy ra khi cập nhật trạng thái.";
        alert(errorMessage);
      });
  };

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

                // Extract buyer data
                const buyer = typeof tx.buyer_id === 'object' && tx.buyer_id
                  ? tx.buyer_id
                  : null;
                const buyerName = buyer && 'full_name' in buyer
                  ? (buyer as { full_name?: string })?.full_name
                  : buyer && 'name' in buyer
                  ? (buyer as { name?: string })?.name
                  : 'N/A';
                const buyerEmail = buyer && 'email' in buyer
                  ? (buyer as { email?: string })?.email
                  : null;

                // Extract seller data
                const seller = typeof tx.seller_id === 'object' && tx.seller_id
                  ? tx.seller_id
                  : null;
                const sellerName = seller && 'full_name' in seller
                  ? (seller as { full_name?: string })?.full_name
                  : seller && 'name' in seller
                  ? (seller as { name?: string })?.name
                  : 'N/A';
                const sellerEmail = seller && 'email' in seller
                  ? (seller as { email?: string })?.email
                  : null;

                // Get price (backend returns price, not amount)
                const price = tx.price ?? tx.amount ?? 0;

                // Get date
                const createdDate = tx.created_at || tx.createdAt || tx.transaction_date || '';
                const formattedDate = createdDate
                  ? new Date(createdDate).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
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
                          </div>
                        </div>
                      ) : (
                        <span>{listingTitle}</span>
                      )}
                    </td>
                    <td>
                      <div className="user-cell">
                        <span className="user-name">{buyerName}</span>
                        {buyerEmail && (
                          <span className="user-email">{buyerEmail}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="user-cell">
                        <span className="user-name">{sellerName}</span>
                        {sellerEmail && (
                          <span className="user-email">{sellerEmail}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <strong style={{ color: '#007bff' }}>
                        {price.toLocaleString('vi-VN')} ₫
                      </strong>
                    </td>
                    <td>{tx.payment_method || 'N/A'}</td>
                    <td>{formattedDate}</td>
                    <td>
                      <span
                        className={`status-badge status--${txStatus.toLowerCase()}`}
                        title={statusLabel}
                      >
                        {statusLabel}
                      </span>
                    </td>
                    <td className="actions-cell">
                      {isFinalStatus ? (
                        <span className="no-actions" style={{ color: '#999', fontStyle: 'italic' }}>
                          Không có hành động
                        </span>
                      ) : (
                        actions.map((action) => (
                          <button
                            key={action.status}
                            className={`action-btn ${action.className}`}
                            onClick={() => handleUpdateStatus(tx._id, action.status, listingTitle)}
                            title={`Chuyển sang "${getStatusLabel(action.status)}"`}
                          >
                            {action.label}
                          </button>
                        ))
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
