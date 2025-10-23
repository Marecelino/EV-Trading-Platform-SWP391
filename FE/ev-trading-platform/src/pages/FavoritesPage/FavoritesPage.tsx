// src/pages/FavoritesPage/FavoritesPage.tsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom"; // Import the Link component
import favoriteApi from "../../api/favoriteApi";
import type { Favorite, Product } from "../../types";
import { useAuth } from "../../contexts/AuthContext";
import ProductCard from "../../components/modules/ProductCard/ProductCard";
import "./FavoritesPage.scss";

const FavoritesPage: React.FC = () => {
  const { favoriteIds } = useFavorites();
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    listingsApi
      .getAll()
      .then((res) => {
        if (res.data.success) {
          // Filter all products to get only the ones whose IDs are in the favorites list
          const filtered = res.data.data.filter((p: Product) =>
            favoriteIds.has(p._id)
          );
          setFavoriteProducts(filtered);
        }
      })
      .finally(() => setIsLoading(false));
  }, [favoriteIds]);

  return (
    <div className="favorites-page container">
      <h1>Tin đăng đã lưu</h1>
      {isLoading ? (
        <p>Đang tải...</p>
      ) : favoriteProducts.length > 0 ? (
        <div className="product-grid">
          {favoriteProducts.map((product) => (
            // Wrap ProductCard with a Link component
            <Link
              to={`/products/${product._id}`}
              key={product._id}
              style={{ textDecoration: "none" }}
            >
              <ProductCard product={product} variant="default" />
            </Link>
          ))}
        </div>
      ) : (
        <p>Bạn chưa lưu tin đăng nào.</p>
      )}
    </div>
  );
};

export default FavoritesPage;
