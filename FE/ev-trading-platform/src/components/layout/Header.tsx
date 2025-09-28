// src/components/layout/Header.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Bell, User } from "lucide-react";
import Button from "../common/Button/Button";
import "./Header.scss";
import { useAuth } from "../../contexts/AuthContext";
const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  return (
    <header className="header">
      <div className="container header__container">
        <Link to="/" className="header__logo">
          EV-Platform
        </Link>

        <nav className={`header__nav ${isMenuOpen ? "is-open" : ""}`}>
          <Link to="/mua-xe" className="header__nav-link">
            Mua xe
          </Link>
          <Link to="/mua-pin" className="header__nav-link">
            Mua pin
          </Link>
          <Link to="/tin-tuc" className="header__nav-link">
            Tin tức
          </Link>
        </nav>

        <div className="header__actions">
          {user ? ( // Kiểm tra xem user có tồn tại không
            <>
              <span>Chào, {user.full_name}!</span>
              <Button
                variant="outline"
                onClick={() => {
                  /* Navigate to post page */
                }}
              >
                Đăng tin
              </Button>
              <button className="header__icon-btn">
                <Bell size={22} />
              </button>
              <button className="header__icon-btn" onClick={logout}>
                {" "}
                {/* Thêm sự kiện logout */}
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="header__login-link">
                Đăng nhập
              </Link>
              <Button
                variant="primary"
                onClick={() => {
                  /* Navigate to register page */
                }}
              >
                Đăng ký
              </Button>
            </>
          )}
        </div>

        <button
          className="header__menu-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
};

export default Header;
