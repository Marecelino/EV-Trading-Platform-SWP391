// src/pages/AdminListingManagementPage/AdminListingManagementPage.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Package, CheckCircle, Clock, XCircle, TrendingUp } from 'lucide-react';
import listingApi from '../../api/listingApi';
import type { Product } from '../../types';
import { SearchListingsParams, PaginatedResponse, UpdateListingStatusDto } from '../../types/api';
import { Link } from 'react-router-dom';
import './AdminListingManagementPage.scss';
import Pagination from '../../components/common/Pagination/Pagination';

type ListingStatus = 'pending' | 'active' | 'rejected' | 'draft' | 'sold' | 'expired';

// Map frontend status to API status (direct mapping - backend uses same values)
const mapStatusToApi = (status: ListingStatus): 'draft' | 'pending' | 'active' | 'rejected' | 'sold' | 'expired' | undefined => {
  switch (status) {
    case 'pending':
      return 'pending'; // Listings that have been paid, waiting for admin approval
    case 'active':
      return 'active'; // Approved listings displayed publicly
    case 'rejected':
      return 'rejected'; // Rejected listings
    case 'draft':
      return 'draft'; // Draft listings (not yet paid)
    case 'sold':
      return 'sold'; // Sold listings
    case 'expired':
      return 'expired'; // Expired listings
    default:
      return undefined;
  }
};

const AdminListingManagementPage: React.FC = () => {
  const [listings, setListings] = useState<Product[]>([]);
  const [allListingsForStats, setAllListingsForStats] = useState<Product[]>([]); // Store all listings for stats
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ListingStatus>('pending');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const ITEMS_PER_PAGE = 3;

  // Calculate stats from all listings
  const listingStats = useMemo(() => {
    const total = allListingsForStats.length;
    const active = allListingsForStats.filter(l => l.status === 'active').length;
    const pending = allListingsForStats.filter(l => l.status === 'pending').length;
    const rejected = allListingsForStats.filter(l => l.status === 'rejected').length;
    
    return { total, active, pending, rejected };
  }, [allListingsForStats]);

  // Fetch all listings for stats (once on mount)
  const fetchAllListingsForStats = useCallback(() => {
    // Fetch all listings without status filter for stats
    Promise.all([
      listingApi.getListings({ status: 'pending', page: 1, limit: 100 }),
      listingApi.getListings({ status: 'active', page: 1, limit: 100 }),
      listingApi.getListings({ status: 'rejected', page: 1, limit: 100 }),
      listingApi.getListings({ status: 'draft', page: 1, limit: 100 }),
      listingApi.getListings({ status: 'sold', page: 1, limit: 100 }),
      listingApi.getListings({ status: 'expired', page: 1, limit: 100 }),
    ])
      .then((responses) => {
        let allListingsData: Product[] = [];
        
        responses.forEach((response) => {
          const responseData = response.data as Product[] | PaginatedResponse<Product>;
          let listingsData: Product[] = [];
          
          if (Array.isArray(responseData)) {
            listingsData = responseData;
          } else if (responseData && typeof responseData === 'object' && 'data' in responseData && Array.isArray(responseData.data)) {
            listingsData = responseData.data;
          }
          
          listingsData = listingsData.filter((listing): listing is Product => {
            return !!(listing && listing._id);
          });
          
          allListingsData = [...allListingsData, ...listingsData];
        });
        
        setAllListingsForStats(allListingsData);
      })
      .catch(error => {
        console.error("Error fetching all listings for stats:", error);
      });
  }, []);

  useEffect(() => {
    fetchAllListingsForStats();
  }, [fetchAllListingsForStats]);

  // Fetch listings using getListings endpoint (admin endpoint)
  const fetchListings = useCallback(() => {
    setIsLoading(true);
    console.log("=== FETCHING LISTINGS ===");
    console.log("Active tab (status):", activeTab);
    
    const apiStatus = mapStatusToApi(activeTab);
    const params: SearchListingsParams = {
      status: apiStatus,
      page: pagination.currentPage,
      limit: ITEMS_PER_PAGE,
    };

    listingApi.getListings(params)
      .then((response) => {
        console.log("=== LISTINGS API RESPONSE ===");
        console.log("Full response:", response);
        console.log("Response data:", response.data);
        
        // Handle response structure: { data: [...], meta: {...} }
        const responseData = response.data as Product[] | PaginatedResponse<Product>;
        
        let listingsData: Product[] = [];
        let paginationMeta = null;
        
        // Extract listings from response
        if (Array.isArray(responseData)) {
          // Direct array format (fallback)
          listingsData = responseData;
        } else if (responseData && typeof responseData === 'object') {
          // PaginatedResponse format: { data: Product[], meta: {...} } or { data: Product[], pagination: {...} }
          if ('data' in responseData && Array.isArray(responseData.data)) {
            listingsData = responseData.data;
            // Prefer 'meta' over 'pagination' (backend uses 'meta')
            paginationMeta = 'meta' in responseData && responseData.meta 
              ? responseData.meta 
              : 'pagination' in responseData && responseData.pagination
              ? responseData.pagination
              : null;
          }
        }
        
        // Validate and clean data
        listingsData = listingsData.filter((listing): listing is Product => {
          if (!listing || !listing._id) {
            console.warn("Invalid listing found:", listing);
            return false;
          }
          return true;
        });
        
        setListings(listingsData);
        console.log(`Loaded ${listingsData.length} valid listings with status ${activeTab} (API status: ${apiStatus})`);
        
        // Update pagination from backend meta or pagination
        if (paginationMeta && typeof paginationMeta === 'object') {
          const meta = paginationMeta as { page?: number; totalPages?: number; pages?: number; total?: number; limit?: number };
          setPagination({
            currentPage: meta.page || pagination.currentPage,
            totalPages: meta.totalPages || meta.pages || Math.ceil((meta.total || 0) / (meta.limit || ITEMS_PER_PAGE)) || 1,
          });
        } else {
          // Fallback: calculate from data length
          setPagination({
            currentPage: pagination.currentPage,
            totalPages: Math.ceil(listingsData.length / ITEMS_PER_PAGE) || 1,
          });
        }
        
        // Refresh stats after fetching
        fetchAllListingsForStats();
      })
      .catch((error) => {
        console.error("Error fetching listings:", error);
        console.error("Error details:", error.response?.data || error.message);
        setListings([]);
      })
      .finally(() => setIsLoading(false));
  }, [activeTab, pagination.currentPage, fetchAllListingsForStats]);

  // Load listings on component mount and when activeTab or page changes
  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleTabClick = (tab: ListingStatus) => {
    setActiveTab(tab);
    setPagination((p) => ({ ...p, currentPage: 1 })); // Reset to page 1 when changing tabs
  };

  // Handle listing status update
  const handleUpdateStatus = (id: string, newStatus: 'active' | 'rejected') => {
    const actionText = newStatus === 'active' ? 'duyệt' : (activeTab === 'active' ? 'gỡ' : 'từ chối');
    if (!window.confirm(`Bạn có chắc muốn ${actionText} tin đăng này?`)) {
      return;
    }

    // Map frontend status to API status (direct mapping)
    const apiStatus: UpdateListingStatusDto['status'] = newStatus; // 'active' or 'rejected'
    const statusDto: UpdateListingStatusDto = { status: apiStatus };

    listingApi.updateListingStatus(id, statusDto)
      .then((response) => {
        const responseData = response.data as Product | { success?: boolean; data?: Product };
        const isSuccess = response.status === 200 || 
                         (responseData && typeof responseData === 'object' && '_id' in responseData) ||
                         ('success' in responseData && responseData.success);
        
        if (isSuccess) {
          alert(`Đã ${actionText} tin đăng thành công!`);
          fetchListings();
        } else {
          alert('Có lỗi xảy ra, vui lòng thử lại.');
        }
      })
      .catch((error: unknown) => {
        console.error("Error updating listing status:", error);
        alert('Có lỗi xảy ra, vui lòng thử lại.');
      });
  };
  
  
  return (
    <div className="admin-page">
      <h1>Quản lý tin đăng</h1>

      {/* Stats Cards */}
      <div className="stats-cards">
        <div className="stat-card stat-card--total">
          <div className="stat-card__icon">
            <Package size={24} />
          </div>
          <div className="stat-card__content">
            <h3 className="stat-card__label">Tổng tin đăng</h3>
            <p className="stat-card__value">{listingStats.total.toLocaleString('vi-VN')}</p>
          </div>
        </div>

        <div className="stat-card stat-card--active">
          <div className="stat-card__icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-card__content">
            <h3 className="stat-card__label">Đang hiển thị</h3>
            <p className="stat-card__value">{listingStats.active.toLocaleString('vi-VN')}</p>
          </div>
        </div>

        <div className="stat-card stat-card--pending">
          <div className="stat-card__icon">
            <Clock size={24} />
          </div>
          <div className="stat-card__content">
            <h3 className="stat-card__label">Chờ duyệt</h3>
            <p className="stat-card__value">{listingStats.pending.toLocaleString('vi-VN')}</p>
          </div>
        </div>

        <div className="stat-card stat-card--rejected">
          <div className="stat-card__icon">
            <XCircle size={24} />
          </div>
          <div className="stat-card__content">
            <h3 className="stat-card__label">Bị từ chối</h3>
            <p className="stat-card__value">{listingStats.rejected.toLocaleString('vi-VN')}</p>
          </div>
        </div>
      </div>
      
      <div className="admin-tabs">
        <button className={activeTab === 'pending' ? 'active' : ''} onClick={() => handleTabClick('pending')}>Chờ duyệt</button>
        <button className={activeTab === 'active' ? 'active' : ''} onClick={() => handleTabClick('active')}>Đang hiển thị</button>
        <button className={activeTab === 'rejected' ? 'active' : ''} onClick={() => handleTabClick('rejected')}>Bị từ chối</button>
        <button className={activeTab === 'draft' ? 'active' : ''} onClick={() => handleTabClick('draft')}>Bản nháp</button>
        <button className={activeTab === 'sold' ? 'active' : ''} onClick={() => handleTabClick('sold')}>Đã bán</button>
        <button className={activeTab === 'expired' ? 'active' : ''} onClick={() => handleTabClick('expired')}>Hết hạn</button>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>Giá</th>
              <th>Ngày đăng</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="empty-cell">
                  <div className="loading-spinner">Đang tải dữ liệu...</div>
                </td>
              </tr>
            ) : listings.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-cell">
                  <div className="empty-state">
                    <p className="empty-state-title">
                      Không có tin đăng nào trong mục này.
                    </p>
                    <p className="empty-state-subtitle">
                      Hãy thử chuyển sang tab khác.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              listings.map(listing => (
                <tr key={listing._id}>
                  <td>
                    <div className="product-cell">
                      <img 
                        src={listing.images?.[0] || '/placeholder-image.jpg'} 
                        alt={listing.title || 'No title'} 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                        }}
                      />
                      <div className="product-info">
                        <Link to={`/products/${listing._id}`} target="_blank" title="Xem chi tiết tin đăng">
                          {listing.title || 'Không có tiêu đề'}
                        </Link>
                        <span>
                          Người đăng: {
                            listing.seller_id && typeof listing.seller_id === 'object' 
                              ? (listing.seller_id as { full_name?: string })?.full_name || 'N/A'
                              : 'N/A'
                          }
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>{listing.price ? listing.price.toLocaleString('vi-VN') + ' ₫' : 'N/A'}</td>
                  <td>
                    {listing.created_at || listing.createdAt
                      ? new Date(listing.created_at || listing.createdAt || '').toLocaleDateString('vi-VN')
                      : 'N/A'
                    }
                  </td>
                  
                  <td className="actions-cell">
                    {activeTab === 'pending' && (
                      <>
                        <button className="action-btn btn--approve" onClick={() => handleUpdateStatus(listing._id, 'active')}>Duyệt</button>
                        <button className="action-btn btn--reject" onClick={() => handleUpdateStatus(listing._id, 'rejected')}>Từ chối</button>
                      </>
                    )}
                    {activeTab === 'active' && (
                      <button className="action-btn btn--reject" onClick={() => handleUpdateStatus(listing._id, 'rejected')}>Gỡ bài</button>
                    )}
                    {activeTab === 'rejected' && (
                      <button className="action-btn btn--approve" onClick={() => handleUpdateStatus(listing._id, 'active')}>Duyệt lại</button>
                    )}
                    {(activeTab === 'draft' || activeTab === 'sold' || activeTab === 'expired') && (
                      <span className="no-actions" style={{ color: '#999', fontStyle: 'italic' }}>
                        Không có hành động
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {!isLoading && listings.length > 0 && (
        <div className="pagination-wrapper">
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={(page) => setPagination((p) => ({ ...p, currentPage: page }))}
          />
          <div className="pagination-info">
            Trang {pagination.currentPage} / {pagination.totalPages}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminListingManagementPage;
