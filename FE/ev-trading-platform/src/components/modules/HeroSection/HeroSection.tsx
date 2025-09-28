// src/components/modules/HeroSection/HeroSection.tsx
import React from 'react';
import { Search } from 'lucide-react';
import Button from '../../common/Button/Button';
import './HeroSection.scss';

const HeroSection: React.FC = () => {
  return (
    <div className="hero-section">
      <div className="container">
        <div className="hero-section__content">
          <h1>Nền tảng Giao dịch Xe điện & Pin cũ</h1>
          <p>Tìm kiếm, mua bán và trao đổi xe điện một cách bền vững.</p>
          
          <div className="search-form">
            <div className="search-form__tabs">
                <button className="search-form__tab active">Tìm xe</button>
                <button className="search-form__tab">Tìm pin</button>
            </div>
            <div className="search-form__main">
              <div className="search-form__input-wrapper">
                <Search size={20} className="search-form__icon" />
                <input type="text" placeholder="Nhập tên xe, ví dụ: Vinfast VF8..." />
              </div>
              <select className="search-form__select">
                <option value="">Toàn quốc</option>
                <option value="hcm">TP. Hồ Chí Minh</option>
                <option value="hn">Hà Nội</option>
              </select>
              <Button>Tìm kiếm</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;