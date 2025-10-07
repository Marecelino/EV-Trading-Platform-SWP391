// src/components/modules/forms/EVForm.tsx
import React from 'react';
import Button from '../../common/Button/Button';
import './EVForm.scss';

const EVForm: React.FC<{ onSubmit: (data: any) => void; isLoading: boolean }> = ({ onSubmit, isLoading }) => {
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <form onSubmit={handleSubmit} className="ev-form">
      <div className="form-header">
        <h3>Thông tin cơ bản</h3>
      </div>

      <div className="form-section">
        <div className="form-group">
          <label htmlFor="ev-brand">
            Hãng
          </label>
          <select id="ev-brand" required>
            <option value="">Chọn hãng</option>
            <option value="vinfast">VinFast</option>
            <option value="tesla">Tesla</option>
            <option value="byd">BYD</option>
            <option value="hyundai">Hyundai</option>
            <option value="kia">Kia</option>
            <option value="other">Khác</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="ev-title">
            Tiêu đề tin đăng
          </label>
          <input 
            id="ev-title"
            type="text" 
            placeholder="VD: Vinfast VF8 Eco 2023 còn mới" 
            required 
          />
        </div>

        <div className="form-group">
          <label htmlFor="ev-description">
            Mô tả chi tiết
          </label>
          <textarea 
            id="ev-description"
            placeholder="Mô tả tình trạng, lịch sử bảo dưỡng..." 
            rows={5} 
            required
          ></textarea>
        </div>
      </div>

      <div className="form-header">
        <h3>Thông số kỹ thuật</h3>
      </div>

      <div className="form-section">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="ev-year">Năm sản xuất</label>
            <input 
              id="ev-year"
              type="number" 
              placeholder="" 
              min="2000"
              max="2025"
              required 
            />
          </div>

          <div className="form-group">
            <label htmlFor="ev-mileage">Số km đã đi</label>
            <input 
              id="ev-mileage"
              type="number" 
              placeholder="" 
              min="0"
              required 
            />
          </div>

          <div className="form-group">
            <label htmlFor="ev-battery">Dung lượng pin (kWh)</label>
            <input 
              id="ev-battery"
              type="number" 
              placeholder="" 
              min="0"
              step="0.1"
            />
          </div>

          <div className="form-group">
            <label htmlFor="ev-range">Quãng đường (km)</label>
            <input 
              id="ev-range"
              type="number" 
              placeholder="" 
              min="0"
            />
          </div>
        </div>
      </div>

      <div className="form-header">
        <h3>Hình ảnh sản phẩm</h3>
      </div>

      <div className="form-section">
        <div className="image-upload-area">
          <div className="upload-placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p>Kéo và thả ảnh vào đây, hoặc bấm để chọn ảnh</p>
            <span>Hỗ trợ tối đa 12 ảnh, định dạng JPG, PNG</span>
          </div>
        </div>
      </div>

      <div className="form-header">
        <h3>Thông tin bán</h3>
      </div>

      <div className="form-section">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="ev-condition">Tình trạng</label>
            <select id="ev-condition" required>
              <option value="">Như mới</option>
              <option value="new">Mới</option>
              <option value="like-new">Như mới</option>
              <option value="used">Đã sử dụng</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="ev-price">Giá bán (VND)</label>
            <input 
              id="ev-price"
              type="number" 
              placeholder="" 
              min="0"
              required 
            />
          </div>

          <div className="form-group">
            <label htmlFor="ev-city">Thành phố</label>
            <select id="ev-city" required>
              <option value="">TP Hồ Chí Minh</option>
              <option value="hcm">TP Hồ Chí Minh</option>
              <option value="hanoi">Hà Nội</option>
              <option value="danang">Đà Nẵng</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="ev-district">Quận/Huyện</label>
            <input 
              id="ev-district"
              type="text" 
              placeholder="" 
            />
          </div>
        </div>
      </div>

      <div className="form-actions">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Đang xử lý...' : 'Hoàn tất'}
        </Button>
      </div>
    </form>
  );
};

export default EVForm;