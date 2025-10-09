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
import AdminTransactionManagementPage from './pages/AdminTransactionManagementPage/AdminTransactionManagementPage';
import MyListingsPage from './pages/MyListingsPage/MyListingsPage';
import CreateListingPage from './pages/CreateListingPage/CreateListingPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import { ComparisonProvider } from './contexts/ComparisonContext';
import ComparePage from './pages/ComparePage/ComparePage';
import DashboardLayout from './layouts/DashboardLayout';
import UserProfilePage from './pages/UserProfilePage/UserProfilePage';
import { FavoritesProvider } from './contexts/FavoritesContext';
import FavoritesPage from './pages/FavoritesPage/FavoritesPage';
import AuctionDetailPage from './pages/AuctionDetailPage/AuctionDetailPage';
import AuctionListPage from './pages/AuctionListPage/AuctionListPage';

function App() {
  return (
    <AuthProvider>
       <FavoritesProvider>
       <ComparisonProvider>
      <Router>
        <Routes>
          {/* Tất cả các Route bên trong đây sẽ sử dụng chung UserLayout */}
          <Route path="/" element={<UserLayout />}>
            {/* Khi người dùng truy cập vào "/", Outlet trong UserLayout sẽ render HomePage */}
            <Route index element={<HomePage />} />
            <Route path="register" element={<RegisterPage />} />

            <Route path="login" element={<LoginPage />} />
            <Route path="products" element={<ProductListPage />} />
            <Route path="products/:id" element={<ProductDetailPage />} />
            <Route path="/dashboard/my-listings" element={<MyListingsPage />} />
            <Route path="/listings/create" element={<CreateListingPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/auctions/:id" element={<AuctionDetailPage />} />
<Route path="/auctions" element={<AuctionListPage />} />

          </Route>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route path="profile" element={<UserProfilePage />} />
              <Route path="my-listings" element={<MyListingsPage />} />
              <Route path="listings/create" element={<CreateListingPage />} />
              <Route path="transactions" element={<div>Trang Lịch sử Giao dịch chi tiết</div>} />
              <Route path="favorites" element={<FavoritesPage/>} />
            </Route>

          {/* === ADMIN ROUTES === */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="users" element={<AdminUserManagementPage />} />
              <Route path="listings" element={<AdminListingManagementPage />} />
              <Route path="transactions" element={<AdminTransactionManagementPage />} />
            </Route>
          </Route>
        </Routes>
      </Router>
      </ComparisonProvider>
      </FavoritesProvider>
    </AuthProvider>
  );
}

export default App;
