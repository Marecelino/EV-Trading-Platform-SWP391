// src/components/modules/ProductCard/ProductCard.tsx
import React from 'react';
import { Heart } from 'lucide-react';
import type { Product } from '../../../types'; 
import './ProductCard.scss';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const formatPrice = (price: number) => {
    if (typeof price !== 'number') return 'Thương lượng';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const primaryImage = product.images?.[0]?.url || 'https://via.placeholder.com/400x300.png/EAECEE/2C3E50?text=No+Image';

  // Lấy thông tin chi tiết của xe hoặc pin để hiển thị
  const details = product.category_id === 'electric_vehicle' ? product.ev_details : product.battery_details;

  return (
    <div className="product-card">
      <div className="product-card__image-container">
        <img src={primaryImage} alt={product.title} className="product-card__image" />
        {product.is_verified && <span className="product-card__verified-badge">Đã kiểm định</span>}
        <button className="product-card__favorite-btn">
          <Heart size={20} />
        </button>
      </div>
      <div className="product-card__info">
        <h3 className="product-card__name">{product.title}</h3>
        <p className="product-card__price">{formatPrice(product.price)}</p>
        <div className="product-card__specs">
          
          {/* Hiển thị thông số tùy theo loại sản phẩm */}
          {details && 'manufacturing_year' in details && details.manufacturing_year && (
            <span>{details.manufacturing_year}</span>
          )}

          {details && 'mileage_km' in details && details.mileage_km && (
            <>
              <span>•</span>
              <span>{details.mileage_km.toLocaleString('vi-VN')} km</span>
            </>
          )}

          {details && 'capacity_kwh' in details && details.capacity_kwh && (
             <span>{details.capacity_kwh} kWh</span>
          )}

        </div>
        <p className="product-card__location">{product.city}</p>
      </div>
    </div>
  );
};

export default ProductCard;