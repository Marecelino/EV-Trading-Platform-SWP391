// src/pages/RegisterPage/RegisterPage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/common/Button/Button';
import './RegisterPage.scss';

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState<string | null>(null);
  const { register, isLoading } = useAuth(); // Sẽ thêm hàm register vào AuthContext
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    setError(null);

    try {
      await register(formData.fullName, formData.email, formData.password);
      navigate('/'); // Chuyển về trang chủ sau khi đăng ký thành công
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="register-page">
      <div className="register-form-container">
        <h2>Tạo tài khoản</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Họ và tên</label>
            <input type="text" name="fullName" onChange={handleInputChange} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" onChange={handleInputChange} required />
          </div>
          <div className="form-group">
            <label>Mật khẩu</label>
            <input type="password" name="password" onChange={handleInputChange} required />
          </div>
           <div className="form-group">
            <label>Xác nhận mật khẩu</label>
            <input type="password" name="confirmPassword" onChange={handleInputChange} required />
          </div>
          {error && <p className="error-message">{error}</p>}
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? 'Đang xử lý...' : 'Đăng ký'}
          </Button>
        </form>
        <p className="login-link">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
};
export default RegisterPage;