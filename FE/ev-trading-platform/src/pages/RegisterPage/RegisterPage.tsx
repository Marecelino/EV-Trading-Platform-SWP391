// src/pages/RegisterPage/RegisterPage.tsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/common/Button/Button";
import "./RegisterPage.scss";
import authApi from "../../api/authApi";
import { CompleteRegistrationDto, RegisterDto } from "../../types";

type RegisterStage = "credentials" | "profile";

const initialCredentials = {
  email: "",
  password: "",
  confirmPassword: "",
};

const initialProfile: Omit<CompleteRegistrationDto, 'userId'> = {
  fullName: "",
  phone: "",
  address: "",
  dateOfBirth: "",
};

const RegisterPage: React.FC = () => {
  const [credentials, setCredentials] = useState(initialCredentials);
  const [profileData, setProfileData] = useState(initialProfile);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [stage, setStage] = useState<RegisterStage>("credentials");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleCredentialChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCredentials((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleProfileChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setProfileData((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleCredentialSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (credentials.password !== credentials.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (credentials.password.length < 8) {
      setError("Mật khẩu cần ít nhất 8 ký tự.");
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const registerData: RegisterDto = { email: credentials.email, password: credentials.password };
      const response = await authApi.register(registerData);
      // Register response structure: { success, message, data: { userId, email, requiresProfileCompletion } }
      const newUserId = response.data.data.userId;
      if (!newUserId) {
        throw new Error('User ID not received from server');
      }
      setUserId(newUserId);
      setStage("profile");
    } catch (err: any) {
      // Handle both axios errors and ApiErrorResponse structure
      const errorMessage = err?.message || err?.response?.data?.message || err?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!userId) {
      setError("Phiên đăng ký không hợp lệ. Vui lòng thử lại.");
      setStage("credentials");
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const completeRegistrationData: CompleteRegistrationDto = { userId, ...profileData };
      await authApi.completeRegistration(completeRegistrationData);
      navigate("/login"); // Redirect to login after successful registration
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Không thể hoàn tất đăng ký. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-page">
      {stage === "credentials" && (
        <div className="register-form-container">
          <h2>Tạo tài khoản</h2>
          <p>Nhập email và mật khẩu để bắt đầu quá trình đăng ký.</p>
          <form onSubmit={handleCredentialSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={credentials.email}
                onChange={handleCredentialChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Mật khẩu</label>
              <input
                type="password"
                name="password"
                value={credentials.password}
                onChange={handleCredentialChange}
                required
                minLength={8}
              />
            </div>
            <div className="form-group">
              <label>Xác nhận mật khẩu</label>
              <input
                type="password"
                name="confirmPassword"
                value={credentials.confirmPassword}
                onChange={handleCredentialChange}
                required
                minLength={8}
              />
            </div>
            {error && <p className="error-message">{error}</p>}
            <Button type="submit" variant="primary" disabled={isLoading}>
              {isLoading ? "Đang xử lý..." : "Tiếp tục"}
            </Button>
          </form>
          <p className="login-link">
            Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
          </p>
        </div>
      )}

      {stage === "profile" && (
        <div className="register-form-container profile-card">
          <h2>Hoàn tất thông tin cá nhân</h2>
          <p>
            Chúng tôi cần thêm một vài thông tin để tạo tài khoản cho địa chỉ
            <strong> {credentials.email}</strong>.
          </p>
          <form onSubmit={handleProfileSubmit}>
            <div className="form-group">
              <label>Họ và tên</label>
              <input
                type="text"
                name="fullName"
                value={profileData.fullName}
                onChange={handleProfileChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Số điện thoại</label>
              <input
                type="tel"
                name="phone"
                value={profileData.phone}
                onChange={handleProfileChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Địa chỉ</label>
              <textarea
                name="address"
                value={profileData.address}
                onChange={handleProfileChange}
                rows={3}
                required
              />
            </div>
            <div className="form-group">
              <label>Ngày sinh</label>
              <input
                type="date"
                name="dateOfBirth"
                value={profileData.dateOfBirth}
                onChange={handleProfileChange}
                required
              />
            </div>
            {error && <p className="error-message">{error}</p>}
            <Button type="submit" variant="primary" disabled={isLoading}>
              {isLoading ? "Đang xử lý..." : "Hoàn tất đăng ký"}
            </Button>
            <button
              type="button"
              className="back-link"
              onClick={() => {
                setStage("credentials");
                setError(null);
                setProfileData(initialProfile);
                setUserId(null);
              }}
              disabled={isLoading}
            >
              Quay lại
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default RegisterPage;
