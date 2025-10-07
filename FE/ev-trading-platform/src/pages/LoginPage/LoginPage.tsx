// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button/Button';
import './LoginPage.scss'; 
import { useAuth } from '../../contexts/AuthContext'; 
import { User } from '../../types'; 
import SocialButton from '../../components/common/SocialButton/SocialButton';
import { FcGoogle } from 'react-icons/fc'; // Google icon
import { FaFacebook } from 'react-icons/fa'
const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  //const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
 const { login, isLoading } = useAuth();
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    
    try {
      
      const loggedInUser = await login(email, password); 
      
      if (loggedInUser.role === 'admin') {
        navigate('/admin/dashboard'); 
      } else {
        navigate('/'); 
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

const handleSocialLogin = (provider: 'google' | 'facebook') => {
    alert(`Chức năng đăng nhập với ${provider} sẽ được kết nối với backend sau.`);
  };
  return (
    <div className="login-page">
      <div className="login-form-container">
        <h2>Đăng nhập</h2>
        <p>Chào mừng trở lại với EV-Platform!</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Nhập email của bạn"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Nhập mật khẩu"
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
          </Button>
        </form>
        <div className="divider"><span>Hoặc tiếp tục với</span></div>

        <div className="social-login-group">
          <SocialButton provider="google" onClick={() => handleSocialLogin('google')}>
            <FcGoogle size={22} />
            <span>Google</span>
          </SocialButton>
          <SocialButton provider="facebook" onClick={() => handleSocialLogin('facebook')}>
            <FaFacebook size={22} />
            <span>Facebook</span>
          </SocialButton>
        </div>
        <p className="signup-link">
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;