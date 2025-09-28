// src/components/layout/Header.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Bell, User } from 'lucide-react';
import Button from '../common/Button/Button';
import './Header.scss';

const Header: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // State mẫu, sau này sẽ lấy từ context/store
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="header">
      <div className="container header__container">
        <Link to="/" className="header__logo">
          EV-Platform
        </Link>

        <nav className={`header__nav ${isMenuOpen ? 'is-open' : ''}`}>
          <Link to="/mua-xe" className="header__nav-link">Mua xe</Link>
          <Link to="/mua-pin" className="header__nav-link">Mua pin</Link>
          <Link to="/tin-tuc" className="header__nav-link">Tin tức</Link>
        </nav>

        <div className="header__actions">
          {isLoggedIn ? (
            <>
              <Button variant="outline">
                Đăng tin
              </Button>
              <button className="header__icon-btn">
                <Bell size={22} />
              </button>
              <button className="header__icon-btn">
                <User size={22} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="header__login-link">Đăng nhập</Link>
              <Button variant="primary">Đăng ký</Button>
            </>
          )}
        </div>
        
        <button className="header__menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
};

export default Header;