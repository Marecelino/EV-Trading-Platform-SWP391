// src/components/layout/Header.tsx
import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, User, FolderKanban, LogOut } from "lucide-react";
import Button from "../common/Button/Button";
import "./Header.scss";
import { useAuth } from "../../contexts/AuthContext";

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // state cho user dropdown
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const handleRegisterClick = () => {
    navigate("/register");
  };

  // đóng khi click ngoài
  useEffect(() => {
    function handleDocClick(e: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleDocClick);
    return () => document.removeEventListener("mousedown", handleDocClick);
  }, []);

  // đóng khi bấm ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIsUserMenuOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="header">
      <div className="container header__container">
        <Link to="/" className="header__logo">
          EV-Platform
        </Link>

        <nav className={`header__nav ${isMenuOpen ? "is-open" : ""}`}>
          <Link to="/compare" className="header__nav-link">So sánh</Link>
          <Link to="/mua-pin" className="header__nav-link">Mua pin</Link>
          <Link to="/tin-tuc" className="header__nav-link">Tin tức</Link>
        </nav>

        <div className="header__actions">
          {user ? (
            <>
              <Link to="/listings/create">
                <Button variant="primary">Đăng tin</Button>
              </Link>

              {/* user menu */}
              <div
                className={`user-menu ${isUserMenuOpen ? "is-open" : ""}`}
                ref={userMenuRef}
                onMouseEnter={() => setIsUserMenuOpen(true)}
                onMouseLeave={() => setIsUserMenuOpen(false)}
              >
                {/* nút có thể focus để keyboard user */}
                <button
                  className="user-menu__toggle"
                  aria-haspopup="true"
                  aria-expanded={isUserMenuOpen}
                  onClick={() => setIsUserMenuOpen((s) => !s)}
                >
                  <img
                    src={user.avatar_url || "https://i.pravatar.cc/150"}
                    alt={user.full_name}
                    className="user-avatar"
                  />
                  <span>{user.full_name}</span>
                </button>

                <div
                  className="dropdown-menu"
                  role="menu"
                  // cho phép tab vào menu
                  tabIndex={-1}
                >
                  <Link to="/dashboard/profile" className="dropdown-item" role="menuitem">
                    <User size={16} /> Hồ sơ của tôi
                  </Link>
                  <Link to="/dashboard/my-listings" className="dropdown-item" role="menuitem">
                    <FolderKanban size={16} /> Quản lý tin đăng
                  </Link>
                  <button
                    onClick={() => { setIsUserMenuOpen(false); logout(); }}
                    className="dropdown-item dropdown-item--logout"
                    role="menuitem"
                  >
                    <LogOut size={16} /> Đăng xuất
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="header__login-link">Đăng nhập</Link>
              <Button variant="primary" onClick={handleRegisterClick}>Đăng ký</Button>
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
