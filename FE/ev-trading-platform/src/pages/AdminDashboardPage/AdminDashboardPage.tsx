// src/pages/AdminDashboardPage/AdminDashboardPage.tsx
import React, { useEffect, useState } from 'react';
import authApi from '../../api/authApi';
import listingApi from '../../api/listingApi';
import transactionApi from '../../api/transactionApi';
import auctionApi from '../../api/auctionApi';
import contactApi from '../../api/contactApi';
import reviewApi from '../../api/reviewApi';
import commissionApi from '../../api/commissionApi';
import { SearchListingsParams } from '../../types/api';
import './AdminDashboardPage.scss';

interface Stats {
  totalUsers: number;
  pendingListings: number;
  totalTransactions: number;
  totalRevenue: number;
  totalAuctions: number;
  totalContacts: number;
  totalReviews: number;
  totalCommissions: number;
}

const AdminDashboardPage: React.FC = () => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Gọi song song tất cả API để tăng tốc
                // CRITICAL FIX: Fix API calls to match correct formats
                const [
                    usersRes,
                    listingsRes,
                    transactionsRes,
                    auctionsRes,
                    contactsRes,
                    reviewsRes,
                    commissionsRes
                ] = await Promise.allSettled([
                    authApi.getUsers(), // FIX: getUsers() doesn't accept params
                    listingApi.searchListings({ status: 'draft' } as SearchListingsParams), // FIX: Use searchListings with status filter for pending listings
                    transactionApi.getTransactions(),
                    auctionApi.getAllAuctions(),
                    contactApi.getContacts(),
                    reviewApi.getReviews(),
                    commissionApi.getCommissions()
                ]);

                // Debug: Log tất cả responses để kiểm tra cấu trúc
                console.log("=== DASHBOARD API RESPONSES ===");
                console.log("Users Response:", usersRes);
                console.log("Listings Response:", listingsRes);
                console.log("Transactions Response:", transactionsRes);
                console.log("Auctions Response:", auctionsRes);
                console.log("Contacts Response:", contactsRes);
                console.log("Reviews Response:", reviewsRes);
                console.log("Commissions Response:", commissionsRes);

                // Helper function để extract data từ response với nhiều fallback paths
                const extractData = (response: PromiseSettledResult<{ data: unknown }>, paths: string[] = ['data.data', 'data', '']) => {
                    if (response.status !== 'fulfilled') return null;
                    
                    for (const path of paths) {
                        if (!path) {
                            // Trường hợp path rỗng, trả về toàn bộ data
                            if (Array.isArray(response.value.data)) return response.value.data;
                            continue;
                        }
                        
                        const pathParts = path.split('.');
                        let data = response.value.data;
                        let found = true;
                        
                        for (const part of pathParts) {
                            if (data && typeof data === 'object' && part in data) {
                                data = data[part];
                            } else {
                                found = false;
                                break;
                            }
                        }
                        
                        if (found && Array.isArray(data)) {
                            return data;
                        }
                    }
                    
                    return null;
                };

                // Tính toán thống kê từ các response với fallback paths
                // FIX: Updated paths for new API response structures
                const usersData = extractData(usersRes, ['data', 'data.data']);
                const listingsData = extractData(listingsRes, ['data', 'data.data']); // searchListings returns same structure
                const transactionsData = extractData(transactionsRes, ['data', 'data.data']);
                const auctionsData = extractData(auctionsRes, ['data', 'data.data']);
                const contactsData = extractData(contactsRes, ['data', 'data.data']);
                const reviewsData = extractData(reviewsRes, ['data', 'data.data']);
                const commissionsData = extractData(commissionsRes, ['', 'data', 'data.data']);

                console.log("=== EXTRACTED DATA ===");
                console.log("Users Data:", usersData);
                console.log("Listings Data:", listingsData);
                console.log("Transactions Data:", transactionsData);
                console.log("Auctions Data:", auctionsData);
                console.log("Contacts Data:", contactsData);
                console.log("Reviews Data:", reviewsData);
                console.log("Commissions Data:", commissionsData);

                const calculatedStats: Stats = {
                    totalUsers: Array.isArray(usersData) ? usersData.length : 0,
                    
                    // FIX: listingsData from searchListings({ status: 'draft' }) already filtered, just count them
                    pendingListings: Array.isArray(listingsData) ? listingsData.length : 0,
                    
                    totalTransactions: Array.isArray(transactionsData) ? transactionsData.length : 0,
                    
                    totalRevenue: Array.isArray(transactionsData)
                        ? transactionsData
                            .filter((transaction: Record<string, unknown>) => transaction.status === 'completed')
                            .reduce((sum: number, transaction: Record<string, unknown>) => sum + (Number(transaction.amount) || 0), 0)
                        : 0,
                    
                    totalAuctions: Array.isArray(auctionsData) ? auctionsData.length : 0,
                    
                    totalContacts: Array.isArray(contactsData) ? contactsData.length : 0,
                    
                    totalReviews: Array.isArray(reviewsData) ? reviewsData.length : 0,
                    
                    totalCommissions: Array.isArray(commissionsData) ? commissionsData.length : 0
                };

                console.log("=== CALCULATED STATS ===");
                console.log(calculatedStats);

                setStats(calculatedStats);
            } catch (error) {
                console.error("Lỗi khi tải dữ liệu dashboard:", error);
                // Set default values nếu có lỗi
                setStats({
                    totalUsers: 0,
                    pendingListings: 0,
                    totalTransactions: 0,
                    totalRevenue: 0,
                    totalAuctions: 0,
                    totalContacts: 0,
                    totalReviews: 0,
                    totalCommissions: 0
                });
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

            {/* Các thẻ thống kê chính */}
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

            {/* Các thẻ thống kê bổ sung */}
            <div className="stats-grid secondary">
                <div className="stat-card">
                    <h2>Tổng đấu giá</h2>
                    <p>{stats?.totalAuctions.toLocaleString('vi-VN') || 0}</p>
                </div>
                <div className="stat-card">
                    <h2>Tổng liên hệ</h2>
                    <p>{stats?.totalContacts.toLocaleString('vi-VN') || 0}</p>
                </div>
                <div className="stat-card">
                    <h2>Tổng đánh giá</h2>
                    <p>{stats?.totalReviews.toLocaleString('vi-VN') || 0}</p>
                </div>
                <div className="stat-card">
                    <h2>Tổng hoa hồng</h2>
                    <p>{stats?.totalCommissions.toLocaleString('vi-VN') || 0}</p>
                </div>
            </div>

            {/* Thông tin debug */}
            <div className="debug-info" style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
                <h3>Debug Info:</h3>
                <p>Dữ liệu được tính toán từ các API hiện có:</p>
                <ul>
                    <li><strong>Users:</strong> authApi.getUsers() - {stats?.totalUsers || 0} users</li>
                    <li><strong>Listings:</strong> listingApi.searchListings({'{'} status: 'draft' {'}'}) - {stats?.pendingListings || 0} pending</li>
                    <li><strong>Transactions:</strong> transactionApi.getTransactions() - {stats?.totalTransactions || 0} transactions</li>
                    <li><strong>Revenue:</strong> Tổng amount từ transactions completed - {stats?.totalRevenue?.toLocaleString('vi-VN') || 0} ₫</li>
                    <li><strong>Auctions:</strong> auctionApi.getAllAuctions() - {stats?.totalAuctions || 0} auctions</li>
                    <li><strong>Contacts:</strong> contactApi.getContacts() - {stats?.totalContacts || 0} contacts</li>
                    <li><strong>Reviews:</strong> reviewApi.getReviews() - {stats?.totalReviews || 0} reviews</li>
                    <li><strong>Commissions:</strong> commissionApi.getCommissions() - {stats?.totalCommissions || 0} commissions</li>
                </ul>
                <p><strong>Lưu ý:</strong> Kiểm tra Console để xem chi tiết API responses và debug info.</p>
            </div>
        </div>
    );
};

export default AdminDashboardPage;