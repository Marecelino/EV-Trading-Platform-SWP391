// src/pages/FavoritesPage/FavoritesPage.tsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import listingApi from "../../api/listingApi";
import type { Product } from "../../types";
import { useAuth } from "../../contexts/AuthContext";
import { useFavorites } from "../../contexts/FavoritesContext";
import ProductCard from "../../components/modules/ProductCard/ProductCard";
import "./FavoritesPage.scss";

const FavoritesPage: React.FC = () => {
  const { user } = useAuth();
  const { favoriteIds, isLoading: favoritesLoading, refreshFavorites } = useFavorites();
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFavoriteProducts = async () => {
      if (!user || favoriteIds.size === 0) {
        setFavoriteProducts([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        console.log("=== FETCHING FAVORITE PRODUCTS ===");
        console.log("Favorite IDs:", Array.from(favoriteIds));
        
        // Fetch all listings first
        const listingsResponse = await listingApi.getListings();
        console.log("=== LISTINGS API RESPONSE ===");
        console.log("Full response:", listingsResponse);
        
        let allListings: Product[] = [];
        if (listingsResponse.data.data) {
          allListings = listingsResponse.data.data;
        } else if (Array.isArray(listingsResponse.data)) {
          allListings = listingsResponse.data;
        }
        
        console.log(`Loaded ${allListings.length} total listings`);
        
        // Filter to get only favorite products
        const filtered = allListings.filter((product: Product) =>
          favoriteIds.has(product._id)
        );
        
        console.log(`Found ${filtered.length} favorite products`);
        setFavoriteProducts(filtered);
      } catch (error) {
        console.error("Error fetching favorite products:", error);
        setFavoriteProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavoriteProducts();
  }, [user, favoriteIds]);

  return (
    <div className="favorites-page container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Tin đăng đã lưu</h1>
        <button 
          onClick={refreshFavorites}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🔄 Làm mới
        </button>
      </div>
      
      {/* Debug Info */}
      <div className="debug-info" style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <h4>Debug Info:</h4>
        <p>Số lượng tin đăng yêu thích: {favoriteProducts.length}</p>
        <p>Favorite IDs: {Array.from(favoriteIds).join(', ') || 'Không có'}</p>
        <p>Đang tải favorites: {favoritesLoading ? 'Có' : 'Không'}</p>
        <p>Đang tải products: {isLoading ? 'Có' : 'Không'}</p>
        <p><strong>Lưu ý:</strong> Kiểm tra Console để xem chi tiết API responses.</p>
      </div>
      
      {isLoading || favoritesLoading ? (
        <p>Đang tải...</p>
      ) : favoriteProducts.length > 0 ? (
        <div className="product-grid">
          {favoriteProducts.map((product) => (
            <Link
              key={product._id}
              to={`/products/${product._id}`}
              style={{ textDecoration: "none" }}
            >
              <ProductCard product={product} variant="default" />
            </Link>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Bạn chưa lưu tin đăng nào.</p>
          <p>Hãy duyệt qua các sản phẩm và nhấn vào biểu tượng trái tim để lưu tin đăng yêu thích!</p>
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;
