// src/pages/HomePage.tsx
import React from 'react';
import HeroSection from '../components/modules/HeroSection/HeroSection';
import ProductCard, { type Product } from '../components/modules/ProductCard/ProductCard';

// Dữ liệu mẫu
const mockProducts: Product[] = [
  { id: '1', name: 'Vinfast VF8 Eco 2022', year: 2022, mileage: 15000, price: 850000000, location: 'Quận 1, TP.HCM', imageUrl: 'https://via.placeholder.com/400x300.png/27AE60/FFFFFF?text=VF8', isVerified: true },
  { id: '2', name: 'Hyundai Ioniq 5 2023', year: 2023, mileage: 8000, price: 1100000000, location: 'Cầu Giấy, Hà Nội', imageUrl: 'https://via.placeholder.com/400x300.png/3498DB/FFFFFF?text=Ioniq+5' },
  { id: '3', name: 'Kia EV6 GT-Line 2022', year: 2022, mileage: 22000, price: 1250000000, location: 'Hải Châu, Đà Nẵng', imageUrl: 'https://via.placeholder.com/400x300.png/2C3E50/FFFFFF?text=EV6', isVerified: true },
  { id: '4', name: 'Tesla Model 3 2021', year: 2021, mileage: 35000, price: 980000000, location: 'Quận 7, TP.HCM', imageUrl: 'https://via.placeholder.com/400x300.png/E74C3C/FFFFFF?text=Model+3' },
 
];


const HomePage: React.FC = () => {
  return (
    <div className="homepage">
      <HeroSection />

      <section className="featured-products container" style={{ padding: '60px 15px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '40px' }}>Tin đăng mới nhất</h2>
        
        <div 
            style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                gap: '30px' 
            }}
        >
          {mockProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;