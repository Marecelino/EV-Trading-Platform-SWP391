// src/pages/AdminTransactionManagementPage/AdminTransactionManagementPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import adminApi from '../../api/adminApi';
import type { ITransaction } from '../../types';
import Pagination from '../../components/common/Pagination/Pagination';
import './AdminTransactionManagementPage.scss';

type TransactionStatus = 'pending' | 'completed' | 'cancelled';

const AdminTransactionManagementPage: React.FC = () => {
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TransactionStatus | 'all'>('all');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });

  const fetchTransactions = useCallback((status: string, page: number) => {
    setIsLoading(true);
    const apiStatus = status === 'all' ? undefined : status;
    adminApi.getTransactions(apiStatus, page).then(response => {
      if (response.data.success) {
        setTransactions(response.data.data);
        setPagination({
            currentPage: response.data.pagination.page,
            totalPages: response.data.pagination.pages,
        });
      }
    }).finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    fetchTransactions(activeTab, pagination.currentPage);
  }, [activeTab, pagination.currentPage, fetchTransactions]);
  
  const handleTabClick = (tab: TransactionStatus | 'all') => {
      setActiveTab(tab);
      setPagination(p => ({ ...p, currentPage: 1 }));
  }

  return (
    <div className="admin-page">
      <h1>Quản lý giao dịch</h1>
      
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
              <tr><td colSpan={6} style={{ textAlign: 'center' }}>Đang tải...</td></tr>
            ) : (
              transactions.map(tx => (
                <tr key={tx._id}>
                  <td>{tx.listing_id.title}</td>
                  <td>{tx.buyer_id.full_name}</td>
                  <td>{tx.seller_id.full_name}</td>
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
        totalPages={pagination.totalPages}
        onPageChange={(page) => setPagination(p => ({...p, currentPage: page}))}
      />
    </div>
  );
};

export default AdminTransactionManagementPage;