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
import { ApiErrorResponse } from "../../types/api";
import { User } from "../../types";

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
      // DEBUG: Log login attempt
      console.log("=== LOGIN ATTEMPT ===");
      console.log("Email:", email);
      console.log("Password length:", password.length);
      console.log("Request payload:", { email, password: password.substring(0, 3) + "***" });
      
      // CRITICAL FIX: Backend returns wrapped response: {success, message, data: {access_token, user, ...}}
      const response = await authApi.login({ email, password });
      console.log("=== LOGIN RESPONSE ===");
      console.log("Full response:", response);
      console.log("Response data:", response.data);
      
      const loginApiResponse = response.data; // {success, message, data: {...}}
      console.log("=== LOGIN API RESPONSE PARSING ===");
      console.log("loginApiResponse:", loginApiResponse);
      console.log("loginApiResponse.success:", loginApiResponse.success);
      console.log("loginApiResponse.data:", loginApiResponse.data);
      console.log("loginApiResponse.data keys:", loginApiResponse.data ? Object.keys(loginApiResponse.data) : 'N/A');
      
      // Validate response structure
      if (!loginApiResponse.success || !loginApiResponse.data) {
        console.error("Validation failed - success:", loginApiResponse.success, "data exists:", !!loginApiResponse.data);
        throw new Error(loginApiResponse.message || 'Invalid response from server');
      }
      
      const loginData = loginApiResponse.data;
      console.log("loginData type:", typeof loginData);
      console.log("loginData keys:", Object.keys(loginData));
      
      // CRITICAL FIX: Backend returns 'token' not 'access_token'
      // Support both 'token' and 'access_token' for compatibility
      const token = loginData.token || loginData.access_token;
      const loginUser = loginData.user;
      
      console.log("loginData.token:", loginData.token);
      console.log("loginData.access_token:", loginData.access_token);
      console.log("Extracted token:", token);
      console.log("loginData.user:", loginUser);
      
      if (!token || !loginUser) {
        console.error("Missing fields - token:", !!token, "loginUser:", !!loginUser);
        console.error("Full loginData object:", JSON.stringify(loginData, null, 2));
        throw new Error('Missing token or user in response data');
      }

      // CRITICAL FIX: Map LoginResponse.user to User type
      // LoginResponse.user has 'name' but User requires 'full_name'
      // Backend may also return 'full_name' directly
      const user: User = {
        _id: loginUser._id || loginUser.id || '', // Ensure _id is always a string
        email: loginUser.email,
        full_name: loginUser.full_name || loginUser.name || loginUser.email, // Prefer full_name, fallback to name
        role: loginUser.role === 'admin' ? 'admin' : 'user', // Map role to match User type
        status: loginUser.status as User['status'] || 'active', // Ensure status matches User type
      };

      login(token, user);

      if (user.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/dashboard/profile");
      }
    } catch (err: unknown) {
      // DEBUG: Enhanced error logging
      console.error("=== LOGIN ERROR ===");
      console.error("Full error object:", err);
      console.error("Error type:", typeof err);
      console.error("Error constructor:", err?.constructor?.name);
      
      // CRITICAL FIX: Use proper error types instead of any
      const axiosError = err as { 
        message?: string;
        response?: {
          status?: number;
          statusText?: string;
          data?: ApiErrorResponse | { message?: string; error?: string; statusCode?: number };
          headers?: Record<string, string>;
        };
        request?: unknown;
        config?: unknown;
      };
      
      // Debug axios error structure
      if (axiosError.response) {
        console.error("Error response status:", axiosError.response.status);
        console.error("Error response statusText:", axiosError.response.statusText);
        console.error("Error response data:", axiosError.response.data);
        console.error("Error response headers:", axiosError.response.headers);
      }
      if (axiosError.request) {
        console.error("Error request:", axiosError.request);
      }
      if (axiosError.config) {
        console.error("Error config:", axiosError.config);
      }
      
      // Handle both axios errors and ApiErrorResponse structure
      // Check if error property exists before accessing it
      const errorData = axiosError?.response?.data;
      const errorMessage = 
        axiosError?.message || 
        (errorData && 'message' in errorData ? errorData.message : undefined) ||
        (errorData && 'error' in errorData ? errorData.error : undefined) ||
        `Đăng nhập thất bại (Status: ${axiosError?.response?.status || 'Unknown'})`;
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
