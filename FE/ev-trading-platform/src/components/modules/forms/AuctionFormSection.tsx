// src/components/modules/forms/AuctionFormSection.tsx
import React from 'react';

interface AuctionFormSectionProps {
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

const AuctionFormSection: React.FC<AuctionFormSectionProps> = ({ handleInputChange }) => {
  return (
    <div className="form-grid">
      <div className="form-group">
        <label>Thời gian bắt đầu *</label>
        <input 
          name="auction.start_time" 
          type="datetime-local" 
          onChange={handleInputChange} 
          required 
          min={new Date().toISOString().slice(0, 16)}
        />
        <small className="help-text">Thời gian bắt đầu đấu giá</small>
      </div>
      <div className="form-group">
        <label>Thời gian kết thúc *</label>
        <input 
          name="auction.end_time" 
          type="datetime-local" 
          onChange={handleInputChange} 
          required 
          min={new Date().toISOString().slice(0, 16)}
        />
        <small className="help-text">Thời gian kết thúc đấu giá</small>
      </div>
      <div className="form-group">
        <label>Giá khởi điểm (VND) *</label>
        <input 
          name="auction.starting_price" 
          type="number" 
          onChange={handleInputChange} 
          required 
          min={0}
          step={1000}
        />
        <small className="help-text">Giá thấp nhất cho phép đấu giá</small>
      </div>
      <div className="form-group">
        <label>Bước giá tối thiểu (VND) *</label>
        <input 
          name="auction.min_increment" 
          type="number" 
          onChange={handleInputChange} 
          required 
          min={0}
          step={1000}
        />
        <small className="help-text">Số tiền tối thiểu cho mỗi lần đấu giá</small>
      </div>
      <div className="form-group">
        <label>Giá Mua ngay (Tùy chọn)</label>
        <input 
          name="auction.buy_now_price" 
          type="number" 
          onChange={handleInputChange}
          min={0}
          step={1000}
        />
        <small className="help-text">Giá để mua ngay không cần đấu giá</small>
      </div>
    </div>
  );
};

export default AuctionFormSection;