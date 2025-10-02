// src/components/modules/forms/EVForm.tsx
import React from 'react';
import Button from '../../common/Button/Button';

const EVForm: React.FC<{ onSubmit: (data: any) => void; isLoading: boolean }> = ({ onSubmit, isLoading }) => {
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <form onSubmit={handleSubmit} className="product-form">
      <h3>Thông tin chi tiết Xe điện</h3>
      <div className="form-grid">
        <div className="form-group">
          <label>Tiêu đề</label>
          <input type="text" placeholder="VD: Vinfast VF8 Eco 2023 còn mới" required />
        </div>
        <div className="form-group">
          <label>Năm sản xuất</label>
          <input type="number" placeholder="VD: 2023" required />
        </div>
        <div className="form-group">
          <label>Số km đã đi</label>
          <input type="number" placeholder="VD: 15000" required />
        </div>
        <div className="form-group">
          <label>Dung lượng pin (kWh)</label>
          <input type="number" placeholder="VD: 82" />
        </div>
        <div className="form-group full-width">
          <label>Mô tả chi tiết</label>
          <textarea placeholder="Mô tả tình trạng xe, lịch sử bảo dưỡng..." rows={5} required></textarea>
        </div>
         <div className="form-group">
          <label>Giá bán (VND)</label>
          <input type="number" placeholder="Nhập giá" required />
        </div>
        {/* Thêm các trường khác: màu sắc, số ghế, hình ảnh... */}
      </div>
      <Button type="submit" disabled={isLoading}>{isLoading ? 'Đang xử lý...' : 'Đăng tin'}</Button>
    </form>
  );
};

export default EVForm;