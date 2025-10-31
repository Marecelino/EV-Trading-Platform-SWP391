// src/pages/LoginPage.tsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/common/Button/Button";
import "./LoginPage.scss";
import { useAuth } from "../../contexts/AuthContext";
import SocialButton from "../../components/common/SocialButton/SocialButton";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";
import authApi from "../../api/authApi";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // CRITICAL FIX: Login response structure is { access_token, token_type, expires_in, user }
      // NOT nested in response.data.data
      const response = await authApi.login({ email, password });
      const { access_token, user } = response.data;
      
      if (!access_token || !user) {
        throw new Error('Invalid response from server');
      }

      login(access_token, user);

      if (user.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/dashboard/profile");
      }
    } catch (err: any) {
      // Handle both axios errors and ApiErrorResponse structure
      const errorMessage = err?.message || err?.response?.data?.message || "Đăng nhập thất bại";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: "google" | "facebook") => {
    // OAuth endpoints redirect, so use window.location
    const authUrl = provider === "google" 
      ? authApi.googleAuth() 
      : authApi.facebookAuth();
    window.location.href = authUrl;
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
            {isLoading ? "Đang xử lý..." : "Đăng nhập"}
          </Button>
        </form>
        <div className="divider">
          <span>Hoặc tiếp tục với</span>
        </div>

        <div className="social-login-group">
          <SocialButton
            provider="google"
            onClick={() => handleSocialLogin("google")}
          >
            <FcGoogle size={22} />
            <span>Google</span>
          </SocialButton>
          <SocialButton
            provider="facebook"
            onClick={() => handleSocialLogin("facebook")}
          >
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
