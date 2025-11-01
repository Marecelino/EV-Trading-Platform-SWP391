// src/pages/AdminCommissionManagementPage/AdminCommissionManagementPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import commissionApi from '../../api/commissionApi';
import type { Commission, ITransaction, Product } from '../../types';
import './AdminCommissionManagementPage.scss';

const AdminCommissionManagementPage: React.FC = () => {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // CRITICAL FIX: Improve response parsing to handle multiple structures
  const fetchCommissions = useCallback(() => {
    setIsLoading(true);
    console.log("=== FETCHING COMMISSIONS ===");
    
    commissionApi.getCommissions().then(response => {
      console.log("=== COMMISSIONS API RESPONSE ===");
      console.log("Full response:", response);
      console.log("Response data:", response.data);
      
      // Handle both direct array and nested response structures
      let commissionsData: Commission[] = [];
      if (response.data?.data && Array.isArray(response.data.data)) {
        commissionsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        commissionsData = response.data;
      }
      
      setCommissions(commissionsData);
      console.log(`Loaded ${commissionsData.length} commissions`);
    }).catch(error => {
      console.error("Error fetching commissions:", error);
      setCommissions([]);
    }).finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    fetchCommissions();
  }, [fetchCommissions]);

  return (
    <div className="admin-page">
      <h1>Quản lý hoa hồng</h1>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Giao dịch</th>
              <th>Số tiền</th>
              <th>Tỷ lệ</th>
              <th>Trạng thái</th>
              <th>Ngày trả</th>
              <th>Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center' }}>Đang tải...</td></tr>
            ) : (
              commissions.map(commission => {
                // CRITICAL FIX: Add type guards for transaction_id and listing_id
                const transaction = typeof commission.transaction_id === 'object' && commission.transaction_id
                  ? commission.transaction_id as ITransaction
                  : null;
                const listing = transaction && typeof transaction.listing_id === 'object' && transaction.listing_id
                  ? transaction.listing_id as Product
                  : null;
                const listingTitle = listing 
                  ? (listing.title || listing.name || 'N/A')
                  : (transaction && typeof transaction.listing_id === 'string'
                      ? transaction.listing_id
                      : 'N/A');
                
                return (
                  <tr key={commission._id}>
                    <td>{listingTitle}</td>
                    <td>{commission.amount.toLocaleString('vi-VN')} ₫</td>
                    <td>{commission.rate}%</td>
                    <td>
                      <span className={`status-badge status--${commission.status}`}>
                        {commission.status === 'pending' ? 'Đang chờ' : commission.status === 'paid' ? 'Đã trả' : 'Đã hủy'}
                      </span>
                    </td>
                    <td>{commission.paid_at ? new Date(commission.paid_at).toLocaleDateString('vi-VN') : '-'}</td>
                    <td>{commission.notes}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminCommissionManagementPage;
