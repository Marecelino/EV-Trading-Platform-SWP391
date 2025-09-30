// src/layouts/AdminLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/layout/AdminSidebar'; // Sẽ tạo component này
import './AdminLayout.scss';

const AdminLayout: React.FC = () => {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;