// src/components/modules/forms/AuctionFormSection.tsx
import React from 'react';

interface AuctionFormSectionProps {
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  validationErrors?: {
    price?: string;
    min_increment?: string;
    start_time?: string;
    end_time?: string;
    [key: string]: string | undefined;
  };
  validationWarnings?: {
    min_increment?: string;
    buy_now_price?: string;
    [key: string]: string | undefined;
  };
}

const AuctionFormSection: React.FC<AuctionFormSectionProps> = ({ handleInputChange, validationErrors = {}, validationWarnings }) => {
  return (
    <div className="form-grid">
      <div className="form-group">
        <label>
          Thời gian bắt đầu *
          {validationErrors.start_time && <span className="error-text"> * {validationErrors.start_time}</span>}
        </label>
        <input 
          name="auction.start_time" 
          type="datetime-local" 
          onChange={handleInputChange} 
          required 
          min={new Date().toISOString().slice(0, 16)}
          className={validationErrors.start_time ? 'error' : ''}
          aria-invalid={!!validationErrors.start_time}
        />
        {validationErrors.start_time && <span className="error-message">{validationErrors.start_time}</span>}
        <small className="help-text">
          Thời gian bắt đầu đấu giá (phải lớn hơn hoặc bằng thời gian hiện tại)
          <br />
        </small>
      </div>
      <div className="form-group">
        <label>
          Thời gian kết thúc *
          {validationErrors.end_time && <span className="error-text"> * {validationErrors.end_time}</span>}
        </label>
        <input 
          name="auction.end_time" 
          type="datetime-local" 
          onChange={handleInputChange} 
          required 
          min={new Date().toISOString().slice(0, 16)}
          className={validationErrors.end_time ? 'error' : ''}
          aria-invalid={!!validationErrors.end_time}
        />
        {validationErrors.end_time && <span className="error-message">{validationErrors.end_time}</span>}
        <small className="help-text">
          Thời gian kết thúc đấu giá (phải lớn hơn start_time, khuyến nghị: tối thiểu 1 ngày sau start_time)
          <br />
        </small>
      </div>
      <div className="form-group">
        <label>
          Giá khởi điểm (VND) *
          {validationErrors.price && <span className="error-text"> * {validationErrors.price}</span>}
        </label>
        <input 
          name="auction.starting_price" 
          type="number" 
          onChange={handleInputChange} 
          required 
          min={0}
          step={1000}
          className={validationErrors.price ? 'error' : ''}
          aria-invalid={!!validationErrors.price}
          placeholder="VD: 800000000"
        />
        {validationErrors.price && <span className="error-message">{validationErrors.price}</span>}
        <small className="help-text">
          Giá khởi điểm (VND) - Giá thấp nhất để bắt đầu đấu giá
          <br />
        </small>
        {validationWarnings?.min_increment && (
          <span className="warning-message">{validationWarnings.min_increment}</span>
        )}
      </div>
      <div className="form-group">
        <label>
          Bước giá tối thiểu (VND) *
          {validationErrors.min_increment && <span className="error-text"> * {validationErrors.min_increment}</span>}
        </label>
        <input 
          name="auction.min_increment" 
          type="number" 
          onChange={handleInputChange} 
          required 
          min={0}
          step={1000}
          className={validationErrors.min_increment ? 'error' : ''}
          aria-invalid={!!validationErrors.min_increment}
          placeholder="VD: 5000000"
        />
        {validationErrors.min_increment && <span className="error-message">{validationErrors.min_increment}</span>}
        <small className="help-text">
          Mức tăng giá tối thiểu (VND) - Mỗi lần đặt giá phải tăng tối thiểu số tiền này
          <br />
        </small>
        {validationWarnings?.min_increment && (
          <span className="warning-message">{validationWarnings.min_increment}</span>
        )}
      </div>
      <div className="form-group">
        <label>
          Giá Mua ngay (Tùy chọn)
          <span className="tooltip-icon" title="Người mua có thể mua ngay với giá này, không cần đấu giá. Khuyến nghị: >= giá khởi điểm"> ℹ️</span>
        </label>
        <input 
          name="auction.buy_now_price" 
          type="number" 
          onChange={handleInputChange}
          min={0}
          step={1000}
          placeholder="VD: 1200000000"
        />
        <small className="help-text">
          Giá mua ngay (tùy chọn) - Người mua có thể mua ngay với giá này, không cần đấu giá
          <br />
        </small>
        {validationWarnings?.buy_now_price && (
          <span className="warning-message">{validationWarnings.buy_now_price}</span>
        )}
      </div>
    </div>
  );
};

export default AuctionFormSection;