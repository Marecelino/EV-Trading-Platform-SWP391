// src/pages/HomePage.tsx
import React, { useState, useEffect } from "react";
import HeroSection from "../components/modules/HeroSection/HeroSection";
//import ProductCard from '../components/modules/ProductCard/ProductCard';
import listingApi from "../api/listingApi";
import type { Product } from "../types/index";
import { PaginatedResponse } from "../types/api";
import FeaturedProducts from "../components/modules/FeaturedProducts/FeaturedProducts";
const HomePage: React.FC = () => {
  const [evProducts, setEvProducts] = useState<Product[]>([]);
  const [batteryProducts, setBatteryProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // CRITICAL FIX: Use getListings() instead of searchListings()
        // Fetch all listings once, then filter by category field in response
        const response = await listingApi.getListings();

        console.log("HomePage API Response:", response.data);

        // Parse response - can be array or PaginatedResponse { data: [], meta: {} }
        let allProducts: Product[] = [];
        if (Array.isArray(response.data)) {
          allProducts = response.data;
        } else if ((response.data as PaginatedResponse<Product>).data) {
          allProducts = (response.data as PaginatedResponse<Product>).data;
        } else if (response.data && typeof response.data === 'object' && 'data' in response.data && Array.isArray((response.data as { data: unknown }).data)) {
          allProducts = (response.data as { data: Product[] }).data;
        }

        // Filter by category field from response body
        const evProductsData = allProducts
          .filter((product: Product) => product.category === 'ev')
          .slice(0, 10); // Limit to 10 items
        
        const batteryProductsData = allProducts
          .filter((product: Product) => product.category === 'battery')
          .slice(0, 10); // Limit to 10 items

        setEvProducts(evProductsData);
        setBatteryProducts(batteryProductsData);

        if (evProductsData.length === 0 && batteryProductsData.length === 0) {
          setError("Không có dữ liệu sản phẩm");
        }
      } catch (err) {
        setError("Không thể kết nối đến server.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);
  return (
    <div className="homepage">
      <HeroSection />
      {isLoading && (
        <p style={{ textAlign: "center", padding: "40px" }}>
          Đang tải dữ liệu...
        </p>
      )}
      {error && (
        <p style={{ color: "red", textAlign: "center", padding: "40px" }}>
          {error}
        </p>
      )}

      {!isLoading && !error && (
        <>
          <FeaturedProducts
            title="Xe điện nổi bật"
            products={evProducts}
            totalProducts={evProducts.length}
          />

          <FeaturedProducts
            title="Pin & Phụ kiện nổi bật"
            products={batteryProducts}
            totalProducts={batteryProducts.length}
          />
        </>
      )}
    </div>
  );
};

export default HomePage;
