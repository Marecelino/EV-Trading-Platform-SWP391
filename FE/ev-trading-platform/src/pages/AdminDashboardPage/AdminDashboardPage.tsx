// src/pages/AdminDashboardPage/AdminDashboardPage.tsx
import React, { useEffect, useState } from 'react';
import { Users, FileText, Clock, Gavel, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import authApi from '../../api/authApi';
import listingApi from '../../api/listingApi';
import transactionApi from '../../api/transactionApi';
import auctionApi from '../../api/auctionApi';
import commissionApi from '../../api/commissionApi';
import { PaginatedResponse } from '../../types/api';
import { ITransaction } from '../../types';
import './AdminDashboardPage.scss';

interface Stats {
  totalUsers: number;
  totalListings: number;
  pendingListings: number;
  totalAuctions: number;
  pendingAuctions: number;
  listingFeeRevenue: number;
  commissionRevenue: number;
  totalRevenue: number;
}

const AdminDashboardPage: React.FC = () => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Gọi song song tất cả API để tăng tốc
                const [
                    userStatsRes,
                    allListingsRes,
                    pendingListingsRes,
                    allAuctionsRes,
                    pendingAuctionsRes,
                    transactionsRes,
                    commissionStatsRes
                ] = await Promise.allSettled([
                    // 1. Số người dùng - GET /api/auth/users/stats
                    authApi.getUserStats(),
                    // 2. Tổng số tin đăng - GET /api/listings
                    listingApi.getListings({ page: 1, limit: 50 }),
                    // 3. Số tin đăng chờ duyệt - GET /api/listings?status=pending
                    listingApi.getListings({ status: 'pending', page: 1, limit: 50 }),
                    // 4. Tổng đấu giá - GET /api/auctions
                    auctionApi.getAllAuctions(undefined, 1, 50),
                    // 5. Số đấu giá chờ duyệt - GET /api/auctions?status=pending
                    auctionApi.getAllAuctions('pending', 1, 50),
                    // 6. Tất cả transactions để tính doanh thu đăng tin - GET /api/transactions
                    transactionApi.getTransactions({ page: 1, limit: 1000 }),
                    // 7. Commission stats - GET /api/commissions/stats
                    commissionApi.getCommissionStats()
                ]);

                // Extract data từ responses
                const userStats = userStatsRes.status === 'fulfilled' ? userStatsRes.value.data : null;
                const allListings = allListingsRes.status === 'fulfilled' ? allListingsRes.value.data : null;
                const pendingListings = pendingListingsRes.status === 'fulfilled' ? pendingListingsRes.value.data : null;
                const allAuctions = allAuctionsRes.status === 'fulfilled' ? allAuctionsRes.value.data : null;
                const pendingAuctions = pendingAuctionsRes.status === 'fulfilled' ? pendingAuctionsRes.value.data : null;
                const transactions = transactionsRes.status === 'fulfilled' ? transactionsRes.value.data : null;
                const commissionStats = commissionStatsRes.status === 'fulfilled' ? commissionStatsRes.value.data : null;

                // Tính tổng số tin đăng từ meta.total
                let totalListings = 0;
                if (allListings && typeof allListings === 'object') {
                    const listingsResponse = allListings as PaginatedResponse<unknown>;
                    if (listingsResponse.meta?.total) {
                        totalListings = listingsResponse.meta.total;
                    } else if (Array.isArray(listingsResponse.data)) {
                        totalListings = listingsResponse.data.length;
                    }
                }

                // Tính số tin đăng chờ duyệt từ meta.total
                let pendingListingsCount = 0;
                if (pendingListings && typeof pendingListings === 'object') {
                    const pendingResponse = pendingListings as PaginatedResponse<unknown>;
                    if (pendingResponse.meta?.total) {
                        pendingListingsCount = pendingResponse.meta.total;
                    } else if (Array.isArray(pendingResponse.data)) {
                        pendingListingsCount = pendingResponse.data.length;
                    }
                }

                // Tính tổng đấu giá từ pagination.total
                let totalAuctions = 0;
                if (allAuctions && typeof allAuctions === 'object') {
                    const auctionsResponse = allAuctions as { pagination?: { total?: number }; data?: unknown[] };
                    if (auctionsResponse.pagination?.total) {
                        totalAuctions = auctionsResponse.pagination.total;
                    } else if (Array.isArray(auctionsResponse.data)) {
                        totalAuctions = auctionsResponse.data.length;
                    }
                }

                // Tính số đấu giá chờ duyệt từ pagination.total
                let pendingAuctionsCount = 0;
                if (pendingAuctions && typeof pendingAuctions === 'object') {
                    const pendingAuctionsResponse = pendingAuctions as { pagination?: { total?: number }; data?: unknown[] };
                    if (pendingAuctionsResponse.pagination?.total) {
                        pendingAuctionsCount = pendingAuctionsResponse.pagination.total;
                    } else if (Array.isArray(pendingAuctionsResponse.data)) {
                        pendingAuctionsCount = pendingAuctionsResponse.data.length;
                    }
                }

                // Tính doanh thu đăng tin từ transactions
                // Filter: status='COMPLETED' và (platform_fee > 0 hoặc notes.includes('Listing fee'))
                let listingFeeRevenue = 0;
                if (transactions && typeof transactions === 'object') {
                    const transactionsResponse = transactions as { data?: ITransaction[] };
                    const transactionsList = Array.isArray(transactionsResponse.data) 
                        ? transactionsResponse.data 
                        : Array.isArray(transactions) 
                            ? transactions as ITransaction[]
                            : [];
                    
                    listingFeeRevenue = transactionsList
                        .filter((tx: ITransaction) => 
                            (tx.status === 'COMPLETED' || tx.status === 'completed') &&
                            ((tx.platform_fee && tx.platform_fee > 0) || 
                             (tx.notes && typeof tx.notes === 'string' && tx.notes.includes('Listing fee')))
                        )
                        .reduce((sum: number, tx: ITransaction) => sum + (tx.platform_fee || 0), 0);
                }

                let commissionRevenue = 0;
                if (commissionStats && typeof commissionStats === 'object') {
                    const stats = commissionStats as { paid?: { total?: number } };
                    commissionRevenue = stats.paid?.total || 0;
                }

                // Tính tổng doanh thu = Phí đăng tin + Commission pending
                // Hoặc có thể dùng: Phí đăng tin + Commission paid (tùy business logic)
                // Theo hướng dẫn: Tổng doanh thu = Phí đăng tin + Commission pending
                let totalRevenue = listingFeeRevenue;
                if (commissionStats && typeof commissionStats === 'object') {
                    const stats = commissionStats as { pending?: { total?: number } };
                    totalRevenue = listingFeeRevenue + (stats.pending?.total || 0);
                }

                const calculatedStats: Stats = {
                    totalUsers: userStats?.total || 0,
                    totalListings,
                    pendingListings: pendingListingsCount,
                    totalAuctions,
                    pendingAuctions: pendingAuctionsCount,
                    listingFeeRevenue,
                    commissionRevenue,
                    totalRevenue
                };

                console.log("=== DASHBOARD STATS CALCULATED ===");
                console.log(calculatedStats);

                setStats(calculatedStats);
            } catch (error) {
                console.error("Lỗi khi tải dữ liệu dashboard:", error);
                // Set default values nếu có lỗi
                setStats({
                    totalUsers: 0,
                    totalListings: 0,
                    pendingListings: 0,
                    totalAuctions: 0,
                    pendingAuctions: 0,
                    listingFeeRevenue: 0,
                    commissionRevenue: 0,
                    totalRevenue: 0
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount);
    };

    if (isLoading) {
        return (
            <div className="admin-dashboard">
                <div className="admin-dashboard__loading">
                    <div className="loading-spinner"></div>
                    <p>Đang tải dữ liệu Dashboard...</p>
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="admin-dashboard">
                <div className="admin-dashboard__error">
                    <p>Không thể tải dữ liệu dashboard</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <div className="admin-dashboard__header">
                <h1 className="admin-dashboard__title">Thống kê & Báo cáo</h1>
            </div>

            {/* 8 stat cards */}
            <div className="stats-grid">
                {/* 1. Tổng người dùng */}
                <div className="stat-card stat-card--users">
                    <div className="stat-card__icon">
                        <Users size={32} />
                    </div>
                    <div className="stat-card__content">
                        <h3 className="stat-card__label">Tổng người dùng</h3>
                        <p className="stat-card__value">{stats.totalUsers.toLocaleString('vi-VN')}</p>
                    </div>
                </div>

                {/* 2. Tổng tin đăng */}
                <div className="stat-card stat-card--listings">
                    <div className="stat-card__icon">
                        <FileText size={32} />
                    </div>
                    <div className="stat-card__content">
                        <h3 className="stat-card__label">Tổng tin đăng</h3>
                        <p className="stat-card__value">{stats.totalListings.toLocaleString('vi-VN')}</p>
                    </div>
                </div>

                {/* 3. Tin đăng chờ duyệt */}
                <div className="stat-card stat-card--pending-listings">
                    <div className="stat-card__icon">
                        <Clock size={32} />
                    </div>
                    <div className="stat-card__content">
                        <h3 className="stat-card__label">Tin đăng chờ duyệt</h3>
                        <p className="stat-card__value">{stats.pendingListings.toLocaleString('vi-VN')}</p>
                    </div>
                </div>

                {/* 4. Tổng đấu giá */}
                <div className="stat-card stat-card--auctions">
                    <div className="stat-card__icon">
                        <Gavel size={32} />
                    </div>
                    <div className="stat-card__content">
                        <h3 className="stat-card__label">Tổng đấu giá</h3>
                        <p className="stat-card__value">{stats.totalAuctions.toLocaleString('vi-VN')}</p>
                    </div>
                </div>

                {/* 5. Đấu giá chờ duyệt */}
                <div className="stat-card stat-card--pending-auctions">
                    <div className="stat-card__icon">
                        <AlertCircle size={32} />
                    </div>
                    <div className="stat-card__content">
                        <h3 className="stat-card__label">Đấu giá chờ duyệt</h3>
                        <p className="stat-card__value">{stats.pendingAuctions.toLocaleString('vi-VN')}</p>
                    </div>
                </div>

                {/* 6. Doanh thu đăng tin */}
                <div className="stat-card stat-card--listing-revenue">
                    <div className="stat-card__icon">
                        <DollarSign size={32} />
                    </div>
                    <div className="stat-card__content">
                        <h3 className="stat-card__label">Doanh thu đăng tin</h3>
                        <p className="stat-card__value stat-card__value--currency">
                            {formatCurrency(stats.listingFeeRevenue)}
                        </p>
                    </div>
                </div>

                {/* 7. Doanh thu hoa hồng */}
                <div className="stat-card stat-card--commission-revenue">
                    <div className="stat-card__icon">
                        <TrendingUp size={32} />
                    </div>
                    <div className="stat-card__content">
                        <h3 className="stat-card__label">Doanh thu hoa hồng</h3>
                        <p className="stat-card__value stat-card__value--currency">
                            {formatCurrency(stats.commissionRevenue)}
                        </p>
                    </div>
                </div>

                {/* 8. Tổng doanh thu */}
                <div className="stat-card stat-card--total-revenue">
                    <div className="stat-card__icon">
                        <DollarSign size={32} />
                    </div>
                    <div className="stat-card__content">
                        <h3 className="stat-card__label">Tổng doanh thu</h3>
                        <p className="stat-card__value stat-card__value--currency stat-card__value--highlight">
                            {formatCurrency(stats.totalRevenue)}
                        </p>
                        <small className="stat-card__note">
                            = Phí đăng tin + Hoa hồng pending
                        </small>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardPage;