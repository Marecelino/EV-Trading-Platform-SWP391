// src/pages/AdminDashboardPage/AdminDashboardPage.tsx
import React, { useEffect, useState } from 'react';
import dashboardApi from '../../api/dashboardApi';
import TrendChart from '../../components/admin/TrendChart'; // Import component biểu đồ
import './AdminDashboardPage.scss';

interface Stats {
  totalUsers: number;
  pendingListings: number;
  totalTransactions: number;
  totalRevenue: number;
}

const AdminDashboardPage: React.FC = () => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [trendData, setTrendData] = useState(null); // State cho dữ liệu biểu đồ
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Gọi song song 2 API để tăng tốc
                const [statsRes, trendsRes] = await Promise.all([
                    listingApi.getDashboardStats(),
                    listingApi.getDashboardTrends(),
                ]);

                if (statsRes.data.success) {
                    setStats(statsRes.data.data);
                }
                if (trendsRes.data.success) {
                    setTrendData(trendsRes.data.data);
                }
            } catch (error) {
                console.error("Lỗi khi tải dữ liệu dashboard:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    if (isLoading) return <div>Đang tải dữ liệu Dashboard...</div>;

    return (
        <div className="admin-dashboard">
            <h1>Thống kê & Báo cáo</h1>

            {/* Các thẻ thống kê */}
            <div className="stats-grid">
                <div className="stat-card">
                    <h2>Tổng người dùng</h2>
                    <p>{stats?.totalUsers.toLocaleString('vi-VN') || 0}</p>
                </div>
                <div className="stat-card">
                    <h2>Tin chờ duyệt</h2>
                    <p>{stats?.pendingListings.toLocaleString('vi-VN') || 0}</p>
                </div>
                <div className="stat-card">
                    <h2>Tổng giao dịch</h2>
                    <p>{stats?.totalTransactions.toLocaleString('vi-VN') || 0}</p>
                </div>
                <div className="stat-card">
                    <h2>Doanh thu (ước tính)</h2>
                    <p>{stats?.totalRevenue.toLocaleString('vi-VN') || 0} ₫</p>
                </div>
            </div>

            {/* Biểu đồ xu hướng */}
            <div className="chart-container content-card">
                {trendData && <TrendChart chartData={trendData} />}
            </div>
        </div>
    );
};

export default AdminDashboardPage;