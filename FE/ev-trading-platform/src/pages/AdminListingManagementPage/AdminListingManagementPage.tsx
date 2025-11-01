// src/pages/AdminListingManagementPage/AdminListingManagementPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import listingApi from '../../api/listingApi';
import type { Product } from '../../types';
import { SearchListingsParams, PaginatedResponse, UpdateListingStatusDto } from '../../types/api';
import { Link } from 'react-router-dom';
import './AdminListingManagementPage.scss';
import Pagination from '../../components/common/Pagination/Pagination';

type ListingStatus = 'pending' | 'active' | 'rejected';

// Map frontend status to API status
const mapStatusToApi = (status: ListingStatus): 'draft' | 'active' | 'removed' | undefined => {
  switch (status) {
    case 'pending':
      return 'draft'; // API uses 'draft' for pending listings
    case 'active':
      return 'active';
    case 'rejected':
      return 'removed'; // API uses 'removed' for rejected listings
    default:
      return undefined;
  }
};

const AdminListingManagementPage: React.FC = () => {
  const [allListings, setAllListings] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ListingStatus>('pending');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const ITEMS_PER_PAGE = 3;

  // REMOVED: Client-side filtering - now handled by API with status param
  // Calculate pagination
  const totalPages = Math.ceil(allListings.length / ITEMS_PER_PAGE);
  const startIndex = (pagination.currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedListings = allListings.slice(startIndex, endIndex);

  // CRITICAL FIX: Use searchListings with status param instead of getListings + client-side filtering
  const fetchListings = useCallback(() => {
    setIsLoading(true);
    console.log("=== FETCHING LISTINGS ===");
    console.log("Active tab (status):", activeTab);
    
    const apiStatus = mapStatusToApi(activeTab);
    const searchParams: SearchListingsParams = {
      status: apiStatus,
      limit: 100, // Get enough listings for admin view
    };

    listingApi.searchListings(searchParams).then(response => {
      console.log("=== LISTINGS API RESPONSE ===");
      console.log("Full response:", response);
      console.log("Response data:", response.data);
      
      // Handle both direct array and PaginatedResponse
      let listingsData: Product[] = [];
      if (Array.isArray(response.data)) {
        listingsData = response.data;
      } else if ((response.data as PaginatedResponse<Product>).data) {
        listingsData = (response.data as PaginatedResponse<Product>).data;
      } else if (response.data?.data) {
        listingsData = response.data.data;
      }
      
      setAllListings(listingsData);
      console.log(`Loaded ${listingsData.length} listings with status ${activeTab}`);
    }).catch(error => {
      console.error("Error fetching listings:", error);
      setAllListings([]);
    }).finally(() => setIsLoading(false));
  }, [activeTab]);

  // Update pagination when filtered listings change
  useEffect(() => {
    setPagination(prev => ({ 
      ...prev, 
      totalPages: totalPages,
      currentPage: prev.currentPage > totalPages ? 1 : prev.currentPage
    }));
  }, [totalPages]);

  // Load listings on component mount and when activeTab changes
  useEffect(() => {
    fetchListings();
  }, [fetchListings]); // fetchListings already depends on activeTab

  const handleTabClick = (tab: ListingStatus) => {
    setActiveTab(tab);
    setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset về trang 1 khi chuyển tab
  };

  // Sau khi cập nhật trạng thái, gọi lại fetchListings để làm mới dữ liệu
  const handleUpdateStatus = (id: string, newStatus: 'active' | 'rejected') => {
    const actionText = newStatus === 'active' ? 'duyệt' : (activeTab === 'active' ? 'gỡ' : 'từ chối');
    if (!window.confirm(`Bạn có chắc muốn ${actionText} tin đăng này?`)) {
      return;
    }

    // CRITICAL FIX: Map frontend status to API status and use UpdateListingStatusDto
    const apiStatus: UpdateListingStatusDto['status'] = newStatus === 'active' ? 'active' : 'removed'; // 'rejected' → 'removed'
    const statusDto: UpdateListingStatusDto = { status: apiStatus };

    listingApi.updateListingStatus(id, statusDto).then((response) => {
      // CRITICAL FIX: updateListingStatus returns AxiosResponse<Product>
      // Response.data is Product, not a wrapper object with 'success'
      // Check if we have a Product object or HTTP status code
      const responseData = response.data as Product | { success?: boolean; data?: Product };
      const isSuccess = response.status === 200 || 
                       (responseData && typeof responseData === 'object' && '_id' in responseData) ||
                       ('success' in responseData && responseData.success);
      
      if (isSuccess) {
        alert(`Đã ${actionText} tin đăng thành công!`);
        // Tải lại dữ liệu của trang hiện tại để cập nhật danh sách
        fetchListings();
      } else {
        alert('Có lỗi xảy ra, vui lòng thử lại.');
      }
    }).catch((error: unknown) => {
      console.error("Error updating listing status:", error);
      alert('Có lỗi xảy ra, vui lòng thử lại.');
    });
  };
  
  // Tương tự, gọi lại fetchListings sau khi bật/tắt kiểm định
  // CRITICAL FIX: Use updateListingVerification method (added to listingApi)
  const handleToggleVerification = (id: string, currentVerification: boolean) => {
    const newVerificationStatus = !currentVerification;
    
    listingApi.updateListingVerification(id, newVerificationStatus).then((response) => {
      // CRITICAL FIX: updateListingVerification returns AxiosResponse<Product>
      // Response.data is Product, not a wrapper object with 'success'
      // Check if we have a Product object or HTTP status code
      const responseData = response.data as Product | { success?: boolean; data?: Product; is_verified?: boolean };
      const isSuccess = response.status === 200 || 
                       (responseData && typeof responseData === 'object' && '_id' in responseData) ||
                       ('success' in responseData && responseData.success) ||
                       ('is_verified' in responseData);
      
      if (isSuccess) {
        // Tải lại dữ liệu để hiển thị trạng thái mới nhất
        fetchListings();
      } else {
        alert('Có lỗi xảy ra khi cập nhật trạng thái kiểm định.');
      }
    }).catch((error: unknown) => {
      console.error("Error updating verification status:", error);
      alert('Có lỗi xảy ra khi cập nhật trạng thái kiểm định.');
    });
  };

  return (
    <div className="admin-page">
      <h1>Quản lý tin đăng</h1>
      
      {/* Debug Info */}
      <div className="debug-info" style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <h4>Debug Info:</h4>
        <p>Đang hiển thị {allListings.length} tin đăng (tất cả đã được filter bởi API)</p>
        <p>Trang hiện tại: {pagination.currentPage} / {totalPages}</p>
        <p>Tab hiện tại: {activeTab}</p>
        <p><strong>Lưu ý:</strong> Kiểm tra Console để xem chi tiết API responses.</p>
      </div>
      
      <div className="admin-tabs">
        <button className={activeTab === 'pending' ? 'active' : ''} onClick={() => handleTabClick('pending')}>Chờ duyệt</button>
        <button className={activeTab === 'active' ? 'active' : ''} onClick={() => handleTabClick('active')}>Đang hiển thị</button>
        <button className={activeTab === 'rejected' ? 'active' : ''} onClick={() => handleTabClick('rejected')}>Bị từ chối</button>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>Giá</th>
              <th>Ngày đăng</th>
              <th>Trạng thái kiểm định</th>
              <th style={{ width: '220px' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>Đang tải dữ liệu...</td></tr>
            ) : paginatedListings.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>Không có tin đăng nào trong mục này.</td></tr>
            ) : (
              paginatedListings.map(listing => (
                <tr key={listing._id}>
                  <td>
                    <div className="product-cell">
                      <img src={listing.images[0]} alt={listing.title} />
                      <div className="product-info">
                        <Link to={`/products/${listing._id}`} target="_blank" title="Xem chi tiết tin đăng">{listing.title}</Link>
                        <span>Người đăng: {(listing.seller_id as { full_name?: string })?.full_name || 'N/A'}</span>
                      </div>
                    </div>
                  </td>
                  <td>{listing.price.toLocaleString('vi-VN')} ₫</td>
                  <td>{new Date(listing.created_at).toLocaleDateString('vi-VN')}</td>
                  <td>
                    <label className="switch" title={listing.is_verified ? "Bỏ nhãn kiểm định" : "Gắn nhãn đã kiểm định"}>
                      <input type="checkbox" checked={listing.is_verified} onChange={() => handleToggleVerification(listing._id, listing.is_verified)} />
                      <span className="slider round"></span>
                    </label>
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
        onPageChange={(page) => setPagination(prev => ({...prev, currentPage: page}))}
      />
    </div>
  );
};

export default AdminListingManagementPage;