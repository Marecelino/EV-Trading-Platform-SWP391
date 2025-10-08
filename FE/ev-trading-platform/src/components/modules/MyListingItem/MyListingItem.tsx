// src/components/modules/MyListingItem/MyListingItem.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { MoreHorizontal, Edit, Zap } from 'lucide-react';
import type { Product } from '../../../types';
import './MyListingItem.scss';

interface MyListingItemProps {
  product: Product;
}

const MyListingItem: React.FC<MyListingItemProps> = ({ product }) => {
  
  const getStatusInfo = (status: Product['status']) => {
    switch (status) {
      case 'active':
        return { text: 'Đang hiển thị', className: 'status--active' };
      case 'pending':
        return { text: 'Chờ duyệt', className: 'status--pending' };
      case 'rejected':
        return { text: 'Bị từ chối', className: 'status--rejected' };
      case 'sold':
        return { text: 'Đã bán', className: 'status--sold' };
      default:
        return { text: 'Không xác định', className: '' };
    }
  };

  const statusInfo = getStatusInfo(product.status);

  return (
    <div className="my-listing-item">
      <Link to={`/products/${product._id}`} className="item-image-link">
        <img src={product.images[0]} alt={product.title} />
      </Link>

      <div className="item-details">
        <Link to={`/products/${product._id}`} className="item-title">{product.title}</Link>
        <p className="item-price">{product.price.toLocaleString('vi-VN')} ₫</p>
        <div className="item-meta">
          <span className={`item-status ${statusInfo.className}`}>{statusInfo.text}</span>
          <span className="item-date">Ngày đăng: {new Date(product.created_at).toLocaleDateString('vi-VN')}</span>
        </div>
      </div>

      <div className="item-actions">
        <button className="action-button btn-boost">
          <Zap size={16} /> Đẩy tin
        </button>
        <button className="action-button btn-edit">
          <Edit size={16} /> Sửa
        </button>
        <div className="more-actions">
          <button className="more-actions__toggle">
            <MoreHorizontal size={20} />
          </button>
          <div className="more-actions__menu">
            <a href="#">Đã bán</a>
            <a href="#">Xóa tin</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyListingItem;