// src/pages/FavoritesPage/FavoritesPage.tsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import favoriteApi from "../../api/favoriteApi";
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
        console.log("User ID:", user._id);
        
        // CRITICAL FIX: Use favoriteApi.getFavorites with user_id instead of getListings
        const favoritesResponse = await favoriteApi.getFavorites({ 
          user_id: user._id 
        });
        console.log("=== FAVORITES API RESPONSE ===");
        console.log("Full response:", favoritesResponse);
        
        // CRITICAL FIX: Fix response structure parsing
        type FavoriteItem = { listing_id?: string | Product; auction_id?: string };
        type ResponseData = FavoriteItem[] | { data: FavoriteItem[] } | unknown;
        let favorites: FavoriteItem[] = [];
        
        const responseData = favoritesResponse.data as ResponseData;
        if (Array.isArray(responseData)) {
          favorites = responseData as FavoriteItem[];
        } else if (responseData && typeof responseData === 'object' && 'data' in responseData && Array.isArray((responseData as { data: FavoriteItem[] }).data)) {
          favorites = (responseData as { data: FavoriteItem[] }).data;
        }
        
        // Extract listing IDs from favorites
        const listingIds = favorites
          .filter(fav => fav.listing_id)
          .map(fav => {
            if (typeof fav.listing_id === 'object' && fav.listing_id !== null) {
              return (fav.listing_id as Product)._id;
            }
            return fav.listing_id as string;
          })
          .filter((id): id is string => !!id);
        
        console.log(`Found ${listingIds.length} favorite listings`);
        
        // Fetch listings by IDs using Promise.all
        if (listingIds.length > 0) {
          try {
            const listingPromises = listingIds.map(id => listingApi.getListingById(id));
            const listingResponses = await Promise.allSettled(listingPromises);
            
            const products: Product[] = [];
            listingResponses.forEach((result) => {
              if (result.status === 'fulfilled' && result.value.data) {
                products.push(result.value.data);
              }
            });
            
            console.log(`Successfully loaded ${products.length} favorite products`);
            setFavoriteProducts(products);
          } catch (error) {
            console.error("Error fetching favorite listings:", error);
            setFavoriteProducts([]);
          }
        } else {
          setFavoriteProducts([]);
        }
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
