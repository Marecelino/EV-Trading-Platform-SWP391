// src/pages/HomePage.tsx
import React, { useState, useEffect } from 'react';
import HeroSection from '../components/modules/HeroSection/HeroSection';
import ProductCard from '../components/modules/ProductCard/ProductCard';
import listingsApi from '../api/listingsApi';
import type { Product } from '../types/index'; 
const HomePage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const response = await listingsApi.getAll();
        if (response.data.success) {
          setProducts(response.data.data);
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

      <section className="featured-products container" style={{ padding: '60px 15px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '40px' }}>Tin đăng mới nhất</h2>
        
        {isLoading && <p>Đang tải dữ liệu...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        
        {!isLoading && !error && (
            <div 
                style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                    gap: '30px' 
                }}
            >
              {products.map(product => (
  
                //  imageUrl={product.images[0]?.url}, name={product.title} ...
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;