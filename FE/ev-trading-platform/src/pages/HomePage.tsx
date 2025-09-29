// src/pages/HomePage.tsx
import React, { useState, useEffect } from 'react';
import HeroSection from '../components/modules/HeroSection/HeroSection';
//import ProductCard from '../components/modules/ProductCard/ProductCard';
import listingsApi from '../api/listingsApi';
import type { Product } from '../types/index'; 
import FeaturedProducts from '../components/modules/FeaturedProducts/FeaturedProducts';
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
          setError(response.data.message || 'Có lỗi xảy ra');
        }
      } catch (err) {
        setError('Không thể kết nối đến server.');
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
{isLoading && <p style={{ textAlign: 'center', padding: '40px' }}>Đang tải dữ liệu...</p>}
      {error && <p style={{ color: 'red', textAlign: 'center', padding: '40px' }}>{error}</p>}
      
      {!isLoading && !error && (
        // Sử dụng component carousel mới
        <FeaturedProducts products={products} totalProducts={totalProducts} />
      )}
      
       
    </div>
  );
};

export default HomePage;