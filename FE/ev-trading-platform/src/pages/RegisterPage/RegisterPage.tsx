// src/pages/RegisterPage/RegisterPage.tsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import type {
  RegistrationProfilePayload,
  RegistrationTicket,
} from "../../contexts/AuthContext";
import Button from "../../components/common/Button/Button";
import "./RegisterPage.scss";

type RegisterStage = "credentials" | "profile";

const initialCredentials = {
  email: "",
  password: "",
  confirmPassword: "",
};

const initialProfile: RegistrationProfilePayload = {
  fullName: "",
  phone: "",
  address: "",
  dateOfBirth: "",
};

const RegisterPage: React.FC = () => {
  const [credentials, setCredentials] = useState(initialCredentials);
  const [profileData, setProfileData] =
    useState<RegistrationProfilePayload>(initialProfile);
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<RegistrationTicket | null>(null);
  const [stage, setStage] = useState<RegisterStage>("credentials");

  const { register, completeRegistration, isLoading } = useAuth();
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
    try {
      const response = await register(credentials.email, credentials.password);
      setTicket(response);
      setStage("profile");
    } catch (err: any) {
      setError(err.message ?? "Đăng ký thất bại. Vui lòng thử lại.");
    }
  };

  const handleProfileSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!ticket) {
      setError("Phiên đăng ký không hợp lệ. Vui lòng thử lại.");
      setStage("credentials");
      return;
    }

    setError(null);
    try {
      await completeRegistration(ticket.userId, profileData);
      navigate("/");
    } catch (err: any) {
      setError(err.message ?? "Không thể hoàn tất đăng ký. Vui lòng thử lại.");
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
            <strong> {ticket?.email}</strong>.
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
                setTicket(null);
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
