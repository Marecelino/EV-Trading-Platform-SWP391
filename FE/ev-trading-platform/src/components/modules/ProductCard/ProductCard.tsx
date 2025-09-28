// src/components/modules/ProductCard/ProductCard.tsx
import React from 'react';
import { Heart } from 'lucide-react'; // Dùng thư viện icon cho nhanh: npm install lucide-react
import './ProductCard.scss';

export interface Product {
  id: string;
  imageUrl: string;
  name: string;
  year: number;
  mileage: number; // số km
  price: number;
  location: string;
  isVerified?: boolean; // Xe đã được kiểm định?
}

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <div className="product-card">
      <div className="product-card__image-container">
        <img src={product.imageUrl} alt={product.name} className="product-card__image" />
        {product.isVerified && <span className="product-card__verified-badge">Đã kiểm định</span>}
        <button className="product-card__favorite-btn">
          <Heart size={20} />
        </button>
      </div>
      <div className="product-card__info">
        <h3 className="product-card__name">{product.name}</h3>
        <p className="product-card__price">{formatPrice(product.price)}</p>
        <div className="product-card__specs">
          <span>{product.year}</span>
          <span>•</span>
          <span>{product.mileage.toLocaleString('vi-VN')} km</span>
        </div>
        <p className="product-card__location">{product.location}</p>
      </div>
    </div>
  );
};

export default ProductCard;