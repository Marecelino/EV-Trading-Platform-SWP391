// src/layouts/DashboardLayout.tsx
import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import { User , Home} from "lucide-react";
import "./DashboardLayout.scss";

const DashboardLayout: React.FC = () => {
  return (
    <div className="dashboard-layout container">
      <aside className="dashboard-sidebar">
      <NavLink to="/" className="back-home">
            <Home /> Trang chủ
          </NavLink>
        <nav>
          <NavLink to="/dashboard/profile">
            <User /> Thông tin tài khoản
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
