// src/components/modules/ProductCard/ProductCard.tsx
import React from 'react';
import { Heart, MessageSquare } from 'lucide-react';
import type { Product } from '../../../types';
import './ProductCard.scss';
import Button from '../../common/Button/Button';
import { Link } from 'react-router-dom';

interface ProductCardProps {
  product: Product;
  variant?: 'default' | 'detailed'; 
}

const ProductCard: React.FC<ProductCardProps> = ({ product, variant = 'default' }) => { // <-- NHẬN PROP MỚI
  const formatPrice = (price: number) => {
    if (typeof price !== 'number') return 'Thương lượng';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const primaryImage = product.images?.[0]?.url || 'https://via.placeholder.com/400x300.png/EAECEE/2C3E50?text=No+Image';
  const details = product.category_id === 'electric_vehicle' ? product.ev_details : product.battery_details;
  const timeSince = (date: string) => "2 giờ trước";

  // Dựa vào variant để render UI tương ứng
  if (variant === 'detailed') {
    return (
      // Giao diện chi tiết cho trang danh sách
      <div className="product-card--detailed">
        <Link to={`/products/${product._id}`} className="product-card__image-link">
          <div className="product-card__image-container">
            <img src={primaryImage} alt={product.title} className="product-card__image" />
            {product.is_verified && <span className="product-card__verified-badge">Đã kiểm định</span>}
          </div>
        </Link>
        <div className="product-card__info">
          <h3 className="product-card__name">
            <Link to={`/products/${product._id}`}>{product.title}</Link>
          </h3>
          <p className="product-card__price">{formatPrice(product.price)}</p>
          <div className="product-card__specs-detailed">
            {details && 'manufacturing_year' in details && details.manufacturing_year && (
              <span>{details.manufacturing_year}</span>
            )}
            {details && 'mileage_km' in details && details.mileage_km && (
              <span>- {details.mileage_km.toLocaleString('vi-VN')} km</span>
            )}
          </div>
          <div className="product-card__footer">
            <span className="product-card__location">{product.city}</span>
            <span className="product-card__time">{timeSince(product.created_at)}</span>
          </div>
          <div className="product-card__actions">
            <Button variant='outline'><MessageSquare size={16} /><span>Chat</span></Button>
            <button className="product-card__favorite-btn--detailed"><Heart size={20} /></button>
          </div>
        </div>
      </div>
    );
  }

  // Giao diện mặc định (gọn nhẹ) cho trang chủ
  return (
    <div className="product-card">
      <div className="product-card__image-container">
        <img src={primaryImage} alt={product.title} className="product-card__image" />
        {product.is_verified && <span className="product-card__verified-badge">Đã kiểm định</span>}
        <button className="product-card__favorite-btn"><Heart size={20} /></button>
      </div>
      <div className="product-card__info">
        <h3 className="product-card__name">{product.title}</h3>
        <p className="product-card__price">{formatPrice(product.price)}</p>
        <div className="product-card__specs">
          {details && 'manufacturing_year' in details && details.manufacturing_year && (
            <span>{details.manufacturing_year}</span>
          )}
          {details && 'mileage_km' in details && details.mileage_km && (
            <><span>•</span><span>{details.mileage_km.toLocaleString('vi-VN')} km</span></>
          )}
        </div>
        <p className="product-card__location">{product.city}</p>
      </div>
    </div>
  );
};

export default ProductCard;