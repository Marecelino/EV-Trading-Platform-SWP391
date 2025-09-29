// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import UserLayout from "./layouts/UserLayout";
import { AuthProvider } from "./contexts/AuthContext";
import HomePage from "./pages/HomePage";
import ProductListPage from "./pages/ProductList/ProductListPage";
import LoginPage from "./pages/LoginPage/LoginPage";

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
          </Route>

          {/*  các route cho admin
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
          </Route> 
        */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
