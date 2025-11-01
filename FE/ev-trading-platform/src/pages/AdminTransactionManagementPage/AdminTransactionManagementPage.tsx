// src/pages/AdminTransactionManagementPage/AdminTransactionManagementPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import transactionApi from '../../api/transactionApi';
import type { ITransaction } from '../../types';
import Pagination from '../../components/common/Pagination/Pagination';
import './AdminTransactionManagementPage.scss';

type TransactionStatus = 'pending' | 'completed' | 'cancelled';

const AdminTransactionManagementPage: React.FC = () => {
  const [allTransactions, setAllTransactions] = useState<ITransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TransactionStatus | 'all'>('all');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const ITEMS_PER_PAGE = 5;

  // REMOVED: Client-side filtering - now handled by API with status param
  // Calculate pagination
  const totalPages = Math.ceil(allTransactions.length / ITEMS_PER_PAGE);
  const startIndex = (pagination.currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const displayedTransactions = allTransactions.slice(startIndex, endIndex);

  // CRITICAL FIX: Use getTransactions with status param instead of client-side filtering
  const fetchTransactions = useCallback(() => {
    setIsLoading(true);
    console.log("=== FETCHING TRANSACTIONS ===");
    console.log("Active tab (status):", activeTab);
    
    // Pass status param to API - undefined for 'all'
    const statusParam = activeTab === 'all' ? undefined : activeTab;
    const params = statusParam ? { status: statusParam, page: pagination.currentPage, limit: ITEMS_PER_PAGE * 2 } : { page: pagination.currentPage, limit: ITEMS_PER_PAGE * 2 };
    
    transactionApi.getTransactions(params).then((response) => {
      console.log("=== TRANSACTIONS API RESPONSE ===");
      console.log("Full response:", response);
      console.log("Response data:", response.data);
      
      // CRITICAL FIX: Handle response structure properly
      // getTransactions returns AxiosResponse<ITransaction[]>, so response.data is ITransaction[] or wrapped
      const responseData = response.data as ITransaction[] | { 
        data?: ITransaction[]; 
        pagination?: { page?: number; pages?: number; limit?: number; total?: number } 
      };
      
      // Extract transactions data
      let transactionsData: ITransaction[] = [];
      if (Array.isArray(responseData)) {
        transactionsData = responseData;
      } else if (responseData && typeof responseData === 'object' && 'data' in responseData && Array.isArray(responseData.data)) {
        transactionsData = responseData.data;
      }
      
      setAllTransactions(transactionsData);
      console.log(`Loaded ${transactionsData.length} transactions with status ${activeTab}`);
      
      // CRITICAL FIX: Update pagination if available from response with proper type checking
      if (responseData && typeof responseData === 'object' && 'pagination' in responseData && responseData.pagination) {
        const totalPages = responseData.pagination.pages ?? Math.ceil(transactionsData.length / ITEMS_PER_PAGE);
        setPagination({
          currentPage: responseData.pagination.page ?? pagination.currentPage,
          totalPages,
        });
      }
    }).catch((error: unknown) => {
      console.error("Error fetching transactions:", error);
      setAllTransactions([]);
    }).finally(() => setIsLoading(false));
  }, [activeTab, pagination.currentPage]);

  // Load transactions on component mount and when activeTab or page changes
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);
  
  const handleTabClick = (tab: TransactionStatus | 'all') => {
    setActiveTab(tab);
    setPagination(p => ({ ...p, currentPage: 1 }));
  };

  return (
    <div className="admin-page">
      <h1>Quản lý giao dịch</h1>
      
      {/* Debug Info */}
      <div className="debug-info" style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <h4>Debug Info:</h4>
        <p>Đang hiển thị {allTransactions.length} giao dịch (đã được filter bởi API theo status: {activeTab === 'all' ? 'tất cả' : activeTab})</p>
        <p>Trang hiện tại: {pagination.currentPage} / {totalPages}</p>
        <p>Tab hiện tại: {activeTab}</p>
        <p><strong>Lưu ý:</strong> Kiểm tra Console để xem chi tiết API responses.</p>
      </div>
      
      <div className="admin-tabs">
        <button className={activeTab === 'all' ? 'active' : ''} onClick={() => handleTabClick('all')}>Tất cả</button>
        <button className={activeTab === 'pending' ? 'active' : ''} onClick={() => handleTabClick('pending')}>Đang chờ</button>
        <button className={activeTab === 'completed' ? 'active' : ''} onClick={() => handleTabClick('completed')}>Hoàn thành</button>
        <button className={activeTab === 'cancelled' ? 'active' : ''} onClick={() => handleTabClick('cancelled')}>Đã hủy</button>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>Người mua</th>
              <th>Người bán</th>
              <th>Số tiền</th>
              <th>Ngày tạo</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>Đang tải dữ liệu...</td></tr>
            ) : displayedTransactions.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>Không có giao dịch nào trong mục này.</td></tr>
            ) : (
              displayedTransactions.map(tx => {
                // CRITICAL FIX: Add type guards for listing_id, buyer_id, and seller_id
                const listing = typeof tx.listing_id === 'object' && tx.listing_id
                  ? tx.listing_id
                  : null;
                const listingTitle = listing 
                  ? ('title' in listing ? (listing as { title?: string; name?: string }).title : null) || 
                    ('name' in listing ? (listing as { name?: string }).name : null) || 
                    'N/A'
                  : 'N/A';
                
                const buyer = typeof tx.buyer_id === 'object' && tx.buyer_id
                  ? tx.buyer_id
                  : null;
                const buyerName = buyer && 'full_name' in buyer 
                  ? (buyer as { full_name?: string }).full_name 
                  : 'N/A';
                
                const seller = typeof tx.seller_id === 'object' && tx.seller_id
                  ? tx.seller_id
                  : null;
                const sellerName = seller && 'full_name' in seller 
                  ? (seller as { full_name?: string }).full_name 
                  : 'N/A';
                
                return (
                  <tr key={tx._id}>
                    <td>{listingTitle}</td>
                    <td>{buyerName}</td>
                    <td>{sellerName}</td>
                    <td>{tx.amount.toLocaleString('vi-VN')} ₫</td>
                    <td>{new Date(tx.created_at).toLocaleDateString('vi-VN')}</td>
                    <td>
                      <span className={`status-badge status--${tx.status}`}>
                        {tx.status === 'pending' ? 'Đang chờ' : tx.status === 'completed' ? 'Hoàn thành' : 'Đã hủy'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <Pagination 
        currentPage={pagination.currentPage}
        totalPages={totalPages}
        onPageChange={(page) => setPagination(p => ({...p, currentPage: page}))}
      />
    </div>
  );
};

export default AdminTransactionManagementPage;