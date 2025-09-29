// src/pages/HomePage.tsx
import React, { useState, useEffect ,useMemo  } from "react";
import HeroSection from "../components/modules/HeroSection/HeroSection";
//import ProductCard from '../components/modules/ProductCard/ProductCard';
import listingsApi from "../api/listingsApi";
import type { Product } from "../types/index";
import FeaturedProducts from "../components/modules/FeaturedProducts/FeaturedProducts";
const HomePage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalProducts, setTotalProducts] = useState(0);
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const response = await listingsApi.getAll();
        if (response.data.success) {
          setProducts(response.data.data);
          setTotalProducts(response.data.pagination?.total || 0);
        } else {
          setError(response.data.message || "Có lỗi xảy ra");
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
    () => products.filter((p) => p.ev_details),
    [products]
  );

  const batteryProducts = useMemo(
    () => products.filter((p) => p.battery_details),
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
