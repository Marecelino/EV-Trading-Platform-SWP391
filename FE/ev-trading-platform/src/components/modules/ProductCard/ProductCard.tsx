// src/components/modules/ProductCard/ProductCard.tsx
import React from "react";
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import StarRating from "../../common/StarRating/StarRating";
import type { Product, User } from "../../../types"; // Import type đã cập nhật
//import Button from '../../common/Button/Button';
import "./ProductCard.scss";
import { useFavorites } from "../../../contexts/FavoritesContext";

const formatNumber = (num: number) => num.toLocaleString("vi-VN");

interface ProductCardProps {
  product: Product;
  variant?: "default" | "detailed";
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  variant = "default",
}) => {
  console.log("Product in ProductCard:", product);
  const formatPrice = (price: number) => {
    if (typeof price !== "number") return "Thương lượng";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const primaryImage =
    product.images?.[0] ||
    "https://via.placeholder.com/600x400.png/EAECEE/2C3E50?text=No+Image";

  const { isFavorite, toggleFavorite } = useFavorites(); // Lấy hàm từ context
  const isLiked = isFavorite(product._id); // Kiểm tra trạng thái "thích"

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Ngăn việc click vào nút tim điều hướng cả thẻ card
    toggleFavorite(product._id);
  };
  if (variant === "detailed") {
    // Handle seller data from API - API only returns _id, email, phone
    const seller = typeof product.seller_id === 'object' ? product.seller_id as any : null;
    const brand = typeof product.brand_id === 'object' ? product.brand_id as any : null;
    const model = typeof product.model_id === 'object' ? product.model_id as any : null;

    return (
      <div className="product-card--detailed">
        <Link
          to={`/products/${product._id}`}
          className="product-card__image-link"
        >
          <div className="product-card__image-container">
            <img
              src={primaryImage}
              alt={product.title}
              className="product-card__image"
            />
            {product.is_verified && (
              <span className="product-card__verified-badge">Đã kiểm định</span>
            )}
          </div>
        </Link>
        <div className="product-card__info">
          <h3 className="product-card__name">
            <Link to={`/products/${product._id}`}>{product.title}</Link>
          </h3>
          <p className="product-card__price">{formatPrice(product.price)}</p>

          <div className="product-card__specs-detailed">
            {brand && model && (
              <>
                <span>{brand.name} {model.name}</span>
                <span>- {product.condition === 'new' ? 'Mới' : product.condition === 'like_new' ? 'Như mới' : 'Đã sử dụng'}</span>
              </>
            )}
            {!product.ev_details && !product.battery_details && (
              <span>Chi tiết sản phẩm</span>
            )}
          </div>

          <div className="product-card__footer">
            <span className="product-card__location">
              {product.location.city}
            </span>
            {typeof product.views === 'number' && (
              <span className="product-card__views">
                {formatNumber(product.views)} lượt xem
              </span>
            )}
          </div>
          <div className="product-card__actions">
            {seller && (
              <div className="seller-info">
                <div className="seller-info__avatar">
                  {seller.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="seller-info__details">
                  <span className="seller-info__name">{seller.email || 'Người bán'}</span>
                  <span className="no-rating">Liên hệ: {seller.phone || 'N/A'}</span>
                </div>
              </div>
            )}
            <button
              className={`product-card__favorite-btn ${isLiked ? "liked" : ""}`}
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
        <img
          src={primaryImage}
          alt={product.title}
          className="product-card__image"
        />
        {product.is_verified && (
          <span className="product-card__verified-badge">Đã kiểm định</span>
        )}
        <button
          className={`product-card__favorite-btn ${isLiked ? "liked" : ""}`}
          onClick={handleFavoriteClick}
        >
          <Heart size={20} />
        </button>
      </div>
      <div className="product-card__info">
        <h3 className="product-card__name">{product.title}</h3>
        <p className="product-card__price">{formatPrice(product.price)}</p>
        <div className="product-card__specs">
          {/* Handle brand and model from API */}
          {typeof product.brand_id === 'object' && typeof product.model_id === 'object' && (
            <>
              <span>{(product.brand_id as any).name} {(product.model_id as any).name}</span>
              <span>•</span>
              <span>{product.condition === 'new' ? 'Mới' : product.condition === 'like_new' ? 'Như mới' : 'Đã sử dụng'}</span>
            </>
          )}
          {!product.ev_details && !product.battery_details && (
            <span>Chi tiết sản phẩm</span>
          )}
        </div>
        <div className="product-card__meta">
          <p className="product-card__location">{product.location.city}</p>
          {typeof product.views === 'number' && (
            <p className="product-card__views">{formatNumber(product.views)} lượt xem</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
