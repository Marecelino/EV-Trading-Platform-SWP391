// src/pages/AdminDashboardPage/AdminDashboardPage.tsx
import React, { useEffect, useState } from 'react';
import adminApi from '../../api/adminApi';
import './AdminDashboardPage.scss';

interface Stats {
  totalUsers: number;
  pendingListings: number;
  totalTransactions: number;
  totalRevenue: number;
}

const AdminDashboardPage: React.FC = () => {
    const [stats, setStats] = useState<Stats | null>(null);

    useEffect(() => {
        adminApi.getDashboardStats().then(response => {
            if(response.data.success) {
                setStats(response.data.data);
            }
        });
    }, []);

    if (!stats) return <div>Đang tải thống kê...</div>;

    return (
        <div className="admin-dashboard">
            <h1>Bảng điều khiển</h1>
            <div className="stats-grid">
                <div className="stat-card">
                    <h2>Tổng người dùng</h2>
                    <p>{stats.totalUsers.toLocaleString('vi-VN')}</p>
                </div>
                <div className="stat-card">
                    <h2>Tin chờ duyệt</h2>
                    <p>{stats.pendingListings.toLocaleString('vi-VN')}</p>
                </div>
                <div className="stat-card">
                    <h2>Tổng giao dịch</h2>
                    <p>{stats.totalTransactions.toLocaleString('vi-VN')}</p>
                </div>
                <div className="stat-card">
                    <h2>Doanh thu (ước tính)</h2>
                    <p>{stats.totalRevenue.toLocaleString('vi-VN')} ₫</p>
                </div>
            </div>
            {/* Thêm các biểu đồ và bảng dữ liệu khác ở đây */}
        </div>
    );
};

export default AdminDashboardPage;