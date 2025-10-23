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
  Hammer,
  MessageSquare,
  Star,
  DollarSign,
  Building2,
  Car
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
          <Hammer size={20} />
          <span>Tin Đấu giá</span>
        </NavLink>
        
        <NavLink to="/admin/transactions" className="nav-link">
          <ArrowLeftRight size={20} />
          <span>Quản lý giao dịch</span>
        </NavLink>
        
        <NavLink to="/admin/brands" className="nav-link">
          <Building2 size={20} />
          <span>Quản lý thương hiệu</span>
        </NavLink>
        
        <NavLink to="/admin/models" className="nav-link">
          <Car size={20} />
          <span>Quản lý mẫu xe</span>
        </NavLink>
        
        <NavLink to="/admin/contacts" className="nav-link">
          <MessageSquare size={20} />
          <span>Quản lý liên hệ</span>
        </NavLink>
        
        <NavLink to="/admin/reviews" className="nav-link">
          <Star size={20} />
          <span>Quản lý đánh giá</span>
        </NavLink>
        
        <NavLink to="/admin/commissions" className="nav-link">
          <DollarSign size={20} />
          <span>Quản lý hoa hồng</span>
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