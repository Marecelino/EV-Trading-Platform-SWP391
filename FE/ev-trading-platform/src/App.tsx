// src/App.tsx

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';


import UserLayout from './layouts/UserLayout';

import HomePage from './pages/HomePage';



function App() {
  return (
    <Router>
      <Routes>
        {/* Tất cả các Route bên trong đây sẽ sử dụng chung UserLayout */}
        <Route path="/" element={<UserLayout />}>
          
          {/* Khi người dùng truy cập vào "/", Outlet trong UserLayout sẽ render HomePage */}
          <Route index element={<HomePage />} />
          
          {/* Khi người dùng truy cập "/login", Outlet sẽ render LoginPage 
          <Route path="login" element={<LoginPage />} />*/}

        

          
        </Route>

        {/*  các route cho admin
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
          </Route> 
        */}
      </Routes>
    </Router>
  );
}

export default App;