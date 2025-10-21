// src/layouts/DashboardLayout.tsx
import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import { User, ShoppingBag, Heart } from "lucide-react";
import "./DashboardLayout.scss";

const DashboardLayout: React.FC = () => {
  return (
    <div className="dashboard-layout container">
      <aside className="dashboard-sidebar">
        <nav>
          <NavLink to="/dashboard/profile">
            <User /> Thông tin tài khoản
          </NavLink>

          <NavLink to="/dashboard/transactions">
            <ShoppingBag /> Lịch sử giao dịch
          </NavLink>
          <NavLink to="/dashboard/favorites">
            <Heart /> Tin đã lưu
          </NavLink>
        </nav>
      </aside>
      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
