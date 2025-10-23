// src/pages/AdminCommissionManagementPage/AdminCommissionManagementPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import commissionApi from '../../api/commissionApi';
import type { Commission, ITransaction } from '../../types';
import './AdminCommissionManagementPage.scss';

const AdminCommissionManagementPage: React.FC = () => {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCommissions = useCallback(() => {
    setIsLoading(true);
    commissionApi.getCommissions().then(response => {
      if (response.data) {
        setCommissions(response.data);
      }
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
              commissions.map(commission => (
                <tr key={commission._id}>
                  <td>{(commission.transaction_id as ITransaction).listing_id.title}</td>
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminCommissionManagementPage;
