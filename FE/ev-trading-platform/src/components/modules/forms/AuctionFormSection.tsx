// src/components/forms/AuctionFormSection.tsx
import React from 'react';

interface AuctionFormSectionProps {
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

const AuctionFormSection: React.FC<AuctionFormSectionProps> = ({ handleInputChange }) => {
  return (
    <div className="form-grid">
      <div className="form-group">
        <label>Giá khởi điểm (VND)</label>
        <input name="auction.starting_price" type="number" onChange={handleInputChange} required />
      </div>
      <div className="form-group">
        <label>Bước giá tối thiểu (VND)</label>
        <input name="auction.min_increment" type="number" onChange={handleInputChange} required />
      </div>
      <div className="form-group">
        <label>Giá Mua ngay (Tùy chọn)</label>
        <input name="auction.buy_now_price" type="number" onChange={handleInputChange} />
      </div>
      <div className="form-group">
        <label>Thời gian kết thúc</label>
        <input name="auction.end_time" type="datetime-local" onChange={handleInputChange} required />
      </div>
    </div>
  );
};

export default AuctionFormSection;