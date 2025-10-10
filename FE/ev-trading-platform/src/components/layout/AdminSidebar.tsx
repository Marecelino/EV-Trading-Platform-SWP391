// src/components/layout/AdminSidebar.tsx
import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  ArrowLeftRight, 
  Settings, 
  LogOut, 
  Hammer
} from 'lucide-react';
import './AdminSidebar.scss';

const AdminSidebar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-header">
        <Link to="/" className="sidebar-logo">EV Platform</Link>
        <span className="sidebar-role">Admin Panel</span>
      </div>
      
      <nav className="sidebar-nav">
        <NavLink to="/admin/dashboard" className="nav-link">
          <LayoutDashboard size={20} />
          <span>Tổng quan</span>
        </NavLink>
        <NavLink to="/admin/users" className="nav-link">
          <Users size={20} />
          <span>Quản lý người dùng</span>
        </NavLink>
        <NavLink to="/admin/listings" className="nav-link">
    <FileText size={20} />
    <span>Tin Bán trực tiếp</span>
  </NavLink>
  <NavLink to="/admin/auctions" className="nav-link">
    <Hammer size={20} /> {/* Thêm icon cho đấu giá */}
    <span>Tin Đấu giá</span>
  </NavLink>
        <NavLink to="/admin/transactions" className="nav-link">
          <ArrowLeftRight size={20} />
          <span>Quản lý giao dịch</span>
        </NavLink>
        <NavLink to="/admin/settings" className="nav-link">
          <Settings size={20} />
          <span>Cấu hình hệ thống</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <img src={user?.avatar_url || 'https://i.pravatar.cc/150'} alt="Admin Avatar" />
          <span>{user?.full_name}</span>
        </div>
        <button onClick={logout} className="logout-button">
          <LogOut size={20} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;