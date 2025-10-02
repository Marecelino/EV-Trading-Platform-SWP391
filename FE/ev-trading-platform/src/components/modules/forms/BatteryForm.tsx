// src/components/modules/forms/BatteryForm.tsx
import React from 'react';
import Button from '../../common/Button/Button';

const BatteryForm: React.FC<{ onSubmit: (data: any) => void; isLoading: boolean }> = ({ onSubmit, isLoading }) => {
  return (
    <form className="product-form">
      <h3>Thông tin chi tiết Pin</h3>
      <div className="form-grid">
        <div className="form-group">
          <label>Tiêu đề</label>
          <input type="text" placeholder="VD: Pin Lithium-ion cho xe máy điện" required />
        </div>
         <div className="form-group">
          <label>Dung lượng (Ah)</label>
          <input type="number" placeholder="VD: 50" required />
        </div>
        <div className="form-group">
          <label>Tình trạng pin (% sức khỏe)</label>
          <input type="number" placeholder="VD: 95" required />
        </div>
        <div className="form-group">
          <label>Số lần sạc (ước tính)</label>
          <input type="number" placeholder="VD: 150" />
        </div>
         <div className="form-group full-width">
          <label>Mô tả chi tiết</label>
          <textarea placeholder="Mô tả tình trạng pin, khả năng tương thích..." rows={5} required></textarea>
        </div>
         <div className="form-group">
          <label>Giá bán (VND)</label>
          <input type="number" placeholder="Nhập giá" required />
        </div>
      </div>
      <Button type="submit" disabled={isLoading}>{isLoading ? 'Đang xử lý...' : 'Đăng tin'}</Button>
    </form>
  );
};
export default BatteryForm;