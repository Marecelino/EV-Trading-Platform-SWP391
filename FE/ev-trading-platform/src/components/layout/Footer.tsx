// src/components/layout/Footer.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Youtube, Instagram } from 'lucide-react';
import './Footer.scss';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container footer__container">
        <div className="footer__column footer__column--about">
          <h3 className="footer__logo">EV-Platform</h3>
          <p>Nền tảng giao dịch xe điện và pin đã qua sử dụng hàng đầu Việt Nam. Hướng tới một tương lai xanh và bền vững.</p>
        </div>

        <div className="footer__column">
          <h4 className="footer__title">Về chúng tôi</h4>
          <Link to="/gioi-thieu" className="footer__link">Giới thiệu</Link>
          <Link to="/tuyen-dung" className="footer__link">Tuyển dụng</Link>
          <Link to="/dieu-khoan" className="footer__link">Điều khoản</Link>
        </div>

        <div className="footer__column">
          <h4 className="footer__title">Hỗ trợ khách hàng</h4>
          <Link to="/faq" className="footer__link">Câu hỏi thường gặp</Link>
          <Link to="/lien-he" className="footer__link">Liên hệ</Link>
          <Link to="/chinh-sach" className="footer__link">Chính sách bảo mật</Link>
        </div>

        <div className="footer__column">
          <h4 className="footer__title">Theo dõi chúng tôi</h4>
          <div className="footer__socials">
            <a href="#" className="footer__social-link"><Facebook /></a>
            <a href="#" className="footer__social-link"><Youtube /></a>
            <a href="#" className="footer__social-link"><Instagram /></a>
          </div>
        </div>
      </div>
      <div className="footer__bottom">
        <p>© 2025 Second-hand EV & Battery Trading Platform. All Rights Reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;