// src/components/modules/FeaturedProducts/FeaturedProducts.tsx
import React from 'react';
import { Link } from 'react-router-dom';

// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';

import ProductCard from '../ProductCard/ProductCard';
import Button from '../../common/Button/Button';
import type { Product } from '../../../types';
import './FeaturedProducts.scss';

interface FeaturedProductsProps {
  products: Product[];
  totalProducts: number; // Thêm tổng số sản phẩm để hiển thị trên nút
}

const FeaturedProducts: React.FC<FeaturedProductsProps> = ({ products, totalProducts }) => {
  if (!products || products.length === 0) {
    return null; // Không hiển thị gì nếu không có sản phẩm
  }

  return (
    <section className="featured-products container">
      <h2 className="section-title">Tin đăng mới nhất</h2>
      
      <Swiper
        modules={[Navigation]}
        navigation // Kích hoạt 2 nút mũi tên
        spaceBetween={24} // Khoảng cách giữa các slide
        slidesPerView={2} // Mặc định cho mobile
        loop={true}
        breakpoints={{
          // Khi màn hình >= 768px
          768: {
            slidesPerView: 3,
            spaceBetween: 24,
          },
          // Khi màn hình >= 1024px
          1024: {
            slidesPerView: 4,
            spaceBetween: 30,
          },
        }}
        className="product-carousel"
      >
        {products.map((product) => (
          <SwiperSlide key={product._id}>
            <ProductCard product={product} />
          </SwiperSlide>
        ))}
      </Swiper>

      <div className="view-more-container">
        <Link to="/products">
          <Button variant="outline">
            Xem thêm {totalProducts.toLocaleString('vi-VN')} tin đăng
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default FeaturedProducts;