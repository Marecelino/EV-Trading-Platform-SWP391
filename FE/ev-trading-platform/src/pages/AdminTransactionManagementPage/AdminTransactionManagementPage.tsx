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

  // Filter transactions based on active tab
  const filteredTransactions = allTransactions.filter(transaction => {
    switch (activeTab) {
      case 'pending':
        return transaction.status === 'pending';
      case 'completed':
        return transaction.status === 'completed';
      case 'cancelled':
        return transaction.status === 'cancelled';
      case 'all':
      default:
        return true;
    }
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const startIndex = (pagination.currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const displayedTransactions = filteredTransactions.slice(startIndex, endIndex);

  const fetchTransactions = useCallback(() => {
    setIsLoading(true);
    console.log("=== FETCHING TRANSACTIONS ===");
    
    transactionApi.getTransactions().then(response => {
      console.log("=== TRANSACTIONS API RESPONSE ===");
      console.log("Full response:", response);
      console.log("Response data:", response.data);
      
      if (response.data.data) {
        setAllTransactions(response.data.data);
        console.log(`Loaded ${response.data.data.length} transactions`);
      } else if (Array.isArray(response.data)) {
        setAllTransactions(response.data);
        console.log(`Loaded ${response.data.length} transactions`);
      } else {
        console.warn("No valid transactions data found in response");
        setAllTransactions([]);
      }
    }).catch(error => {
      console.error("Error fetching transactions:", error);
      setAllTransactions([]);
    }).finally(() => setIsLoading(false));
  }, []);

  // Update pagination when filtered transactions change
  useEffect(() => {
    setPagination(prev => ({ 
      ...prev, 
      totalPages: totalPages,
      currentPage: prev.currentPage > totalPages ? 1 : prev.currentPage
    }));
  }, [totalPages]);

  // Load transactions on component mount
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
        <p>Đang hiển thị {displayedTransactions.length} giao dịch (tổng {allTransactions.length})</p>
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
              displayedTransactions.map(tx => (
                <tr key={tx._id}>
                  <td>
                    {typeof tx.listing_id === 'object' ? tx.listing_id.title : 'N/A'}
                  </td>
                  <td>
                    {typeof tx.buyer_id === 'object' ? tx.buyer_id.full_name : 'N/A'}
                  </td>
                  <td>
                    {typeof tx.seller_id === 'object' ? tx.seller_id.full_name : 'N/A'}
                  </td>
                  <td>{tx.amount.toLocaleString('vi-VN')} ₫</td>
                  <td>{new Date(tx.created_at).toLocaleDateString('vi-VN')}</td>
                  <td>
                    <span className={`status-badge status--${tx.status}`}>
                      {tx.status === 'pending' ? 'Đang chờ' : tx.status === 'completed' ? 'Hoàn thành' : 'Đã hủy'}
                    </span>
                  </td>
                </tr>
              ))
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