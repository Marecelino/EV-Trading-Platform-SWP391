// src/components/modules/ProductCard/ProductCard.tsx
import React from 'react';
import { Heart, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useComparison } from '../../../contexts/ComparisonContext'; // Import hook mới
import StarRating from '../../common/StarRating/StarRating';
import type { Product } from '../../../types'; // Import type đã cập nhật
//import Button from '../../common/Button/Button';
import './ProductCard.scss';
import { useFavorites } from '../../../contexts/FavoritesContext';

const formatNumber = (num: number) => num.toLocaleString('vi-VN');

interface ProductCardProps {
  product: Product;
  variant?: 'default' | 'detailed';
}

const ProductCard: React.FC<ProductCardProps> = ({ product, variant = 'default' }) => {
  const formatPrice = (price: number) => {
    if (typeof price !== 'number') return 'Thương lượng';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const primaryImage = product.images?.[0] || 'https://via.placeholder.com/600x400.png/EAECEE/2C3E50?text=No+Image';

  const timeSince = (date: string) => {
    return "Vài giờ trước";
  };
  const { addItem, removeItem, isInCompare } = useComparison(); 
  
  const handleCompareChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      addItem(product);
    } else {
      removeItem(product._id);
    }
  };
 const { isFavorite, toggleFavorite } = useFavorites(); // Lấy hàm từ context
  const isLiked = isFavorite(product._id); // Kiểm tra trạng thái "thích"

  const handleFavoriteClick = (e: React.MouseEvent) => {
      e.stopPropagation(); // Ngăn việc click vào nút tim điều hướng cả thẻ card
      toggleFavorite(product._id);
  }
  if (variant === 'detailed') {
        const seller = typeof product.seller_id === 'object' ? product.seller_id : null;

    return (
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
            {product.ev_details && (
              <>
                <span>{product.ev_details.year_of_manufacture}</span>
                <span>- {formatNumber(product.ev_details.mileage)} km</span>
              </>
            )}
             {product.battery_details && (
              <>
                <span>{formatNumber(product.battery_details.capacity)} Ah</span>
                <span>- {product.battery_details.state_of_health}%</span>
              </>
            )}
          </div>

            <div className="product-card__footer">
    <span className="product-card__location">{product.location.city}</span>
    
  </div>
          <div className="product-card__actions">
              {seller && (
                <div className="seller-info">
                  <img src={seller.avatar_url} alt={seller.full_name} className="seller-info__avatar" />
                  <div className="seller-info__details">
                    <span className="seller-info__name">{seller.full_name}</span>
                    {/* SỬ DỤNG COMPONENT STAR RATING */}
                    {seller.rating ? (
                      <StarRating rating={seller.rating.average} count={seller.rating.count} />
                    ) : (
                      <span className="no-rating">Chưa có đánh giá</span>
                    )}
                  </div>
                </div>
              )}
            <button 
    className={`product-card__favorite-btn ${isLiked ? 'liked' : ''}`}
    onClick={handleFavoriteClick}
  >
    <Heart size={20} />
  </button>
          </div>
        </div>
      </div>
    );
  }

  //  HOMEPAGE CAROUSEL) 
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
          {/* SỬA LỖI: Truy cập dữ liệu chi tiết lồng nhau */}
          {product.ev_details && (
            <>
              <span>{product.ev_details.year_of_manufacture}</span>
              <span>•</span>
              <span>{formatNumber(product.ev_details.mileage)} km</span>
            </>
          )}
           {product.battery_details && (
            <>
              <span>{formatNumber(product.battery_details.capacity)} Ah</span>
              <span>•</span>
              <span>Sức khỏe: {product.battery_details.state_of_health}%</span>
            </>
          )}
        </div>
        <p className="product-card__location">{product.location.city}</p>
      </div>
    </div>
  );
};

export default ProductCard;