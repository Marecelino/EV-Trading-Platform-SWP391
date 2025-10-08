// src/components/layout/Header.tsx
import React, { useState } from "react";
import { Link  , useNavigate } from "react-router-dom";
import { Menu, X, Bell, User } from "lucide-react";
import Button from "../common/Button/Button";
import "./Header.scss";
import { useAuth } from "../../contexts/AuthContext";

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
    const handleRegisterClick = () => {
    navigate("/register"); 
  };
  return (
    <header className="header">
      <div className="container header__container">
        <Link to="/" className="header__logo">
          EV-Platform
        </Link>

        <nav className={`header__nav ${isMenuOpen ? "is-open" : ""}`}>
          <Link to="/compare" className="header__nav-link">
            So sánh 
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
              <Link to="/dashboard/my-listings">
                {" "}
                {/* THÊM LINK MỚI */}
                <Button variant="outline">Quản lý tin</Button>
              </Link>
              <Link to="/listings/create">
                <Button variant="outline">Đăng tin</Button>
              </Link>
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
                  handleRegisterClick()
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
