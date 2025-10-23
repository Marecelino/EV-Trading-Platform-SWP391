// src/pages/AdminListingManagementPage/AdminListingManagementPage.tsx
import React, { useEffect, useState } from 'react';
import listingApi from '../../api/listingApi';
import type { Product } from '../../types';
import { Link } from 'react-router-dom';
import './AdminListingManagementPage.scss';
import Pagination from '../../components/common/Pagination/Pagination';

type ListingStatus = 'pending' | 'active' | 'rejected';

const AdminListingManagementPage: React.FC = () => {
  const [listings, setListings] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ListingStatus>('pending');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const ITEMS_PER_PAGE = 3;

  const fetchListings = (status: ListingStatus, page: number) => {
    setIsLoading(true);
    listingApi.getListings(status, page, ITEMS_PER_PAGE).then(response => {
      if (response.data.success) {
        setListings(response.data.data);
        setPagination({

          currentPage: response.data.pagination.page || 1,
          totalPages: response.data.pagination.pages || 1,
        });
      }
    }).finally(() => setIsLoading(false));
  };

  // useEffect sẽ gọi lại fetchListings mỗi khi activeTab hoặc currentPage thay đổi
  useEffect(() => {
    fetchListings(activeTab, pagination.currentPage);
  }, [activeTab, pagination.currentPage]);

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

    listingApi.updateListingStatus(id, newStatus).then(response => {
      if (response.data.success) {
        alert(`Đã ${actionText} tin đăng thành công!`);
        // Tải lại dữ liệu của trang hiện tại để cập nhật danh sách
        fetchListings(activeTab, pagination.currentPage);
      } else {
        alert('Có lỗi xảy ra, vui lòng thử lại.');
      }
    });
  };
  
  // Tương tự, gọi lại fetchListings sau khi bật/tắt kiểm định
  const handleToggleVerification = (id: string, currentVerification: boolean) => {
    listingApi.updateListingVerification(id, !currentVerification).then(response => {
       if (response.data.success) {
         // Tải lại dữ liệu để hiển thị trạng thái mới nhất
         fetchListings(activeTab, pagination.currentPage);
       }
    });
  };

  return (
    <div className="admin-page">
      <h1>Quản lý tin đăng</h1>
      
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
            ) : listings.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>Không có tin đăng nào trong mục này.</td></tr>
            ) : (
              listings.map(listing => (
                <tr key={listing._id}>
                  <td>
                    <div className="product-cell">
                      <img src={listing.images[0]} alt={listing.title} />
                      <div className="product-info">
                        <Link to={`/products/${listing._id}`} target="_blank" title="Xem chi tiết tin đăng">{listing.title}</Link>
                        <span>Người đăng: {(listing.seller_id as any)?.full_name || 'N/A'}</span>
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
        totalPages={pagination.totalPages}
        onPageChange={(page) => setPagination(prev => ({...prev, currentPage: page}))}
      />
    </div>
  );
};

export default AdminListingManagementPage;