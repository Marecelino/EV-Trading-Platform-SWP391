// src/pages/FavoritesPage/FavoritesPage.tsx
import React, { useState, useEffect } from 'react';
import { useFavorites } from '../../contexts/FavoritesContext';
import listingsApi from '../../api/listingsApi';
import type { Product } from '../../types';
import ProductCard from '../../components/modules/ProductCard/ProductCard';
import './FavoritesPage.scss';

const FavoritesPage: React.FC = () => {
  const { favoriteIds } = useFavorites();
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    listingsApi.getAll().then(res => {
      if (res.data.success) {
        // Lọc tất cả sản phẩm để chỉ lấy những sản phẩm có ID nằm trong danh sách yêu thích
        const filtered = res.data.data.filter(p => favoriteIds.has(p._id));
        setFavoriteProducts(filtered);
      }
    }).finally(() => setIsLoading(false));
  }, [favoriteIds]);

  return (
    <div className="favorites-page container">
      <h1>Tin đăng đã lưu</h1>
      {isLoading ? <p>Đang tải...</p> : (
        favoriteProducts.length > 0 ? (
          <div className="product-grid">
            {favoriteProducts.map(product => (
              <ProductCard key={product._id} product={product} variant="default" />
            ))}
          </div>
        ) : (
          <p>Bạn chưa lưu tin đăng nào.</p>
        )
      )}
    </div>
  );
};

export default FavoritesPage;