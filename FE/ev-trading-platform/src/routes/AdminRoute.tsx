// src/routes/AdminRoute.tsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AdminRoute: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Đang tải...</div>; 
  }

  if (user && user.role === 'admin') {
    return <Outlet />;
  }
  
  return <Navigate to="/" />;
};

export default AdminRoute;