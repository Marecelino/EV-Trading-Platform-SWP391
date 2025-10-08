// src/pages/MyListingsPage/MyListingsPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import listingsApi from '../../api/listingsApi';
import type { Product } from '../../types';
import { Link } from 'react-router-dom';
import './MyListingsPage.scss';

type ListingStatus = 'active' | 'pending' | 'rejected' | 'expired';

const MyListingsPage: React.FC = () => {
  const [listings, setListings] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ListingStatus>('active');

  const fetchMyListings = useCallback((status: ListingStatus) => {
    setIsLoading(true);
    // API thật có thể không có status 'expired', chúng ta sẽ xử lý sau
    const apiStatus = status === 'expired' ? 'active' : status;
    listingsApi.getMyListings(apiStatus).then(response => {
      if (response.data.success) {
        setListings(response.data.data);
      }
    }).finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    fetchMyListings(activeTab);
  }, [activeTab, fetchMyListings]);

  return (
    <div className="my-listings-page container">
      <h1 className="page-title">Quản lý tin đăng</h1>
      <div className="content-card">
        <div className="admin-tabs">
          <button className={activeTab === 'active' ? 'active' : ''} onClick={() => setActiveTab('active')}>Đang hiển thị</button>
          <button className={activeTab === 'pending' ? 'active' : ''} onClick={() => setActiveTab('pending')}>Chờ duyệt</button>
          <button className={activeTab === 'expired' ? 'active' : ''} onClick={() => setActiveTab('expired')}>Hết hạn</button>
          <button className={activeTab === 'rejected' ? 'active' : ''} onClick={() => setActiveTab('rejected')}>Bị từ chối</button>
        </div>

        <div className="listings-list">
          {isLoading ? (
            <p>Đang tải...</p>
          ) : listings.length === 0 ? (
            <p>Bạn chưa có tin đăng nào trong mục này.</p>
          ) : (
            listings.map(listing => (
              <div key={listing._id} className="listing-item">
                <img src={listing.images[0]} alt={listing.title} className="listing-item__image" />
                <div className="listing-item__details">
                  <Link to={`/products/${listing._id}`} className="listing-item__title">{listing.title}</Link>
                  <p className="listing-item__price">{listing.price.toLocaleString('vi-VN')} ₫</p>
                  <p className="listing-item__date">Ngày đăng: {new Date(listing.created_at).toLocaleDateString('vi-VN')}</p>
                </div>
                <div className="listing-item__actions">
                  <button className="action-button btn-boost">Đẩy tin</button>
                  <button className="action-button btn-edit">Sửa tin</button>
                  <button className="action-button btn-hide">Ẩn tin</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MyListingsPage;