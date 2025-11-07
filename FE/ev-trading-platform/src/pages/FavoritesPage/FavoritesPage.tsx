// src/pages/FavoritesPage/FavoritesPage.tsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, RefreshCw, Eye } from "lucide-react";
import favoriteApi from "../../api/favoriteApi";
import type { Product, Favorite } from "../../types";
import { useAuth } from "../../contexts/AuthContext";
import { useFavorites } from "../../contexts/FavoritesContext";
import ProductCard from "../../components/modules/ProductCard/ProductCard";
import { toast } from "react-toastify";
import "./FavoritesPage.scss";

const FavoritesPage: React.FC = () => {
  const { user } = useAuth();
  const { toggleFavorite, refreshFavorites, isLoading: favoritesLoading } = useFavorites();
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 12;

  useEffect(() => {
    const fetchFavoriteProducts = async () => {
      if (!user) {
        setFavoriteProducts([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await favoriteApi.getFavorites({ 
          user_id: user._id,
          page,
          limit
        });
        
        // Backend returns { data: Favorite[], meta: {...} }
        const responseData = response.data;
        let favorites: Favorite[] = [];
        let meta = { page: 1, limit: 12, total: 0, totalPages: 1 };
        
        if (responseData && typeof responseData === 'object' && 'data' in responseData) {
          const data = (responseData as { data: Favorite[]; meta?: typeof meta }).data;
          if (Array.isArray(data)) {
            favorites = data;
          }
          if ('meta' in responseData && responseData.meta) {
            meta = responseData.meta as typeof meta;
          }
        }
        
        // Extract products from populated listing_id objects
        const products: Product[] = [];
        favorites.forEach((fav) => {
          if (fav.listing_id) {
            // listing_id is already populated as Product object from backend
            const listing = typeof fav.listing_id === 'object' 
              ? (fav.listing_id as Product)
              : null;
            if (listing) {
              products.push(listing);
            }
          }
        });
        
        setFavoriteProducts(products);
        setTotal(meta.total);
        setTotalPages(meta.totalPages || 1);
      } catch (error) {
        console.error("Error fetching favorite products:", error);
        toast.error("Không thể tải danh sách yêu thích");
        setFavoriteProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavoriteProducts();
  }, [user, page]);

  const handleRemoveFavorite = async (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await toggleFavorite(productId);
      // Remove from local state immediately for better UX
      setFavoriteProducts(prev => prev.filter(p => p._id !== productId));
      setTotal(prev => Math.max(0, prev - 1));
      toast.success("Đã xóa khỏi danh sách yêu thích");
    } catch (error) {
      console.error("Error removing favorite:", error);
      toast.error("Không thể xóa khỏi danh sách yêu thích");
    }
  };

  const formatNumber = (num: number) => num.toLocaleString("vi-VN");

  return (
    <div className="favorites-page">
      <div className="favorites-page__header">
        <div className="favorites-page__title-section">
          <h1 className="favorites-page__title">Tin đăng đã lưu</h1>
          {total > 0 && (
            <p className="favorites-page__count">{total} sản phẩm</p>
          )}
        </div>
        <button 
          className="favorites-page__refresh-btn"
          onClick={refreshFavorites}
          disabled={isLoading || favoritesLoading}
        >
          <RefreshCw size={18} />
          <span>Làm mới</span>
        </button>
      </div>
      
      {isLoading || favoritesLoading ? (
        <div className="favorites-page__loading">
          <div className="loading-spinner"></div>
          <p>Đang tải danh sách yêu thích...</p>
        </div>
      ) : favoriteProducts.length > 0 ? (
        <>
          <div className="favorites-page__grid">
            {favoriteProducts.map((product) => {
              const primaryImage = product.images?.[0] || "https://via.placeholder.com/600x400.png/EAECEE/2C3E50?text=No+Image";
              
              return (
                <div key={product._id} className="favorite-card">
                  <Link
                    to={`/products/${product._id}`}
                    className="favorite-card__link"
                  >
                    <div className="favorite-card__image-container">
                      <img
                        src={primaryImage}
                        alt={product.title}
                        className="favorite-card__image"
                      />
                      {product.is_verified && (
                        <span className="favorite-card__verified-badge">Đã kiểm định</span>
                      )}
                      <button
                        className="favorite-card__remove-btn"
                        onClick={(e) => handleRemoveFavorite(product._id, e)}
                        aria-label="Xóa khỏi danh sách yêu thích"
                      >
                        <Heart size={20} fill="currentColor" />
                      </button>
                    </div>
                    <div className="favorite-card__info">
                      <h3 className="favorite-card__title">{product.title}</h3>
                      <p className="favorite-card__price">
                        {typeof product.price === 'number' 
                          ? new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            }).format(product.price)
                          : "Thương lượng"}
                      </p>
                      <div className="favorite-card__meta">
                        {typeof product.view_count === 'number' && (
                          <span className="favorite-card__views">
                            <Eye size={14} />
                            {formatNumber(product.view_count)} lượt xem
                          </span>
                        )}
                        {typeof product.favorite_count === 'number' && (
                          <span className="favorite-card__favorites">
                            <Heart size={14} />
                            {formatNumber(product.favorite_count)} yêu thích
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
          
          {totalPages > 1 && (
            <div className="favorites-page__pagination">
              <button
                className="pagination-btn"
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1 || isLoading}
              >
                Trước
              </button>
              <span className="pagination-info">
                Trang {page} / {totalPages}
              </span>
              <button
                className="pagination-btn"
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages || isLoading}
              >
                Sau
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="favorites-page__empty">
          <div className="empty-state">
            <Heart size={64} className="empty-state__icon" />
            <h2 className="empty-state__title">Chưa có tin đăng yêu thích</h2>
            <p className="empty-state__message">
              Hãy duyệt qua các sản phẩm và nhấn vào biểu tượng trái tim để lưu tin đăng yêu thích!
            </p>
            <Link to="/" className="empty-state__button">
              Khám phá sản phẩm
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;
