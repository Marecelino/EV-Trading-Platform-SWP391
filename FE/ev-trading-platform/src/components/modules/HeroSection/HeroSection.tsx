// src/components/modules/HeroSection/HeroSection.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../common/Button/Button';
import bannerImage from '../../../assets/banner2.jpg';
import './HeroSection.scss';

const HeroSection: React.FC = () => {
  return (
    <div className="hero-section">
      <div className="container">
        <div className="hero-section__grid">
          <div className="hero-section__content">
            <h1 className="hero-section__title">Nền tảng Giao dịch Xe điện & Pin cũ</h1>
            <p className="hero-section__description">
              Một nền tảng trực tuyến hiện đại để mua bán xe điện và pin EV đã qua sử dụng. Giao dịch xanh - Tương lai xanh.
            </p>
            <div className="hero-section__cta">
              <Link to="/products">
                <Button variant="primary">Khám phá ngay</Button>
              </Link>
              <Link to="/listings/create">
                <Button variant="outline">Đăng tin</Button>
              </Link>
            </div>
          </div>
          <div className="hero-section__image">
            <img src={bannerImage} alt="EV Trading Platform" className="hero-section__banner-img" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;