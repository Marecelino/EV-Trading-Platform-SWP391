// src/components/modules/FeaturedProducts/FeaturedProducts.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import ProductCard from '../ProductCard/ProductCard';
import Button from '../../common/Button/Button';
import type { Product } from '../../../types';
import './FeaturedProducts.scss';
import 'swiper/css';
import 'swiper/css/navigation';
interface FeaturedProductsProps {
  title: string; // pin & xe
  products: Product[];
  totalProducts: number;
}

const FeaturedProducts: React.FC<FeaturedProductsProps> = ({ title, products, totalProducts }) => {

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="featured-products container">
      <h2 className="section-title"> {title} </h2>
      
      <Swiper
        modules={[Navigation]}
        navigation
        spaceBetween={24}
        slidesPerView={2}
         loop={products.length > 4} // Chỉ loop khi có nhiều hơn số slide hiển thị
        breakpoints={{
          768: { slidesPerView: 3, spaceBetween: 24 },
          1024: { slidesPerView: 4, spaceBetween: 30 },
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
          <Button >
            Xem thêm {totalProducts.toLocaleString('vi-VN')} tin đăng
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default FeaturedProducts;