// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import UserLayout from "./layouts/UserLayout";
import { AuthProvider } from "./contexts/AuthContext";
import HomePage from "./pages/HomePage";
import ProductListPage from "./pages/ProductList/ProductListPage";
import LoginPage from "./pages/LoginPage/LoginPage";
import ProductDetailPage from "./pages/ProductDetailPage/ProductDetailPage";
import AdminRoute from "./routes/AdminRoute";
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboardPage from "./pages/AdminDashboardPage/AdminDashboardPage";
import AdminUserManagementPage from "./pages/AdminUserManagementPage/AdminUserManagementPage";
import AdminListingManagementPage from './pages/AdminListingManagementPage/AdminListingManagementPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Tất cả các Route bên trong đây sẽ sử dụng chung UserLayout */}
          <Route path="/" element={<UserLayout />}>
            {/* Khi người dùng truy cập vào "/", Outlet trong UserLayout sẽ render HomePage */}
            <Route index element={<HomePage />} />

            <Route path="login" element={<LoginPage />} />
            <Route path="products" element={<ProductListPage />} />
            <Route path="products/:id" element={<ProductDetailPage />} />
          </Route>

          {/* === ADMIN ROUTES === */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="users" element={<AdminUserManagementPage />} />
              <Route path="listings" element={<AdminListingManagementPage />} />

            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
