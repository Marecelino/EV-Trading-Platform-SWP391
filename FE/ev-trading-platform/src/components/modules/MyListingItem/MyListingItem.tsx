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

  // Helper function to safely format date
  // Backend may return createdAt (camelCase) or created_at (snake_case)
  const formatDate = (product: Product): string => {
    // Try both camelCase and snake_case
    const dateString = product.createdAt || product.created_at;
    
    if (!dateString) {
      return 'Không xác định';
    }

    // Try to parse the date
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date format:', dateString, 'for product:', product._id);
      return 'Không xác định';
    }

    // Format as Vietnamese date
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
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
          <span className="item-date">Ngày đăng: {formatDate(product)}</span>
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