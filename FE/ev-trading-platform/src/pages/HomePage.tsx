// src/pages/HomePage.tsx
import React, { useState, useEffect, useMemo } from "react";
import HeroSection from "../components/modules/HeroSection/HeroSection";
//import ProductCard from '../components/modules/ProductCard/ProductCard';
import listingApi from "../api/listingApi";
import type { Product } from "../types/index";
import FeaturedProducts from "../components/modules/FeaturedProducts/FeaturedProducts";
const HomePage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const response = await listingApi.getListings();
        console.log("HomePage API Response:", response.data);
        if (response.data.data) {
          setProducts(response.data.data);
        } else {
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
  const evProducts = useMemo(
    () => products.filter((p) => {
      // Filter by brand names that are typically EV brands
      if (typeof p.brand_id === 'object') {
        const brandName = (p.brand_id as any).name.toLowerCase();
        return brandName.includes('tesla') || brandName.includes('vinfast') || brandName.includes('byd');
      }
      return false;
    }),
    [products]
  );

  const batteryProducts = useMemo(
    () => products.filter((p) => {
      // Filter by brand names that are typically battery brands or products with "pin" in title
      if (typeof p.brand_id === 'object') {
        const brandName = (p.brand_id as any).name.toLowerCase();
        return brandName.includes('catl') || p.title.toLowerCase().includes('pin');
      }
      return false;
    }),
    [products]
  );
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
