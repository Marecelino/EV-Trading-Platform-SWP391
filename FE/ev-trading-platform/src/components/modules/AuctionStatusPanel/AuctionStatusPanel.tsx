// src/components/modules/AuctionStatusPanel/AuctionStatusPanel.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import type { Auction } from '../../../types';
import Button from '../../common/Button/Button';
import './AuctionStatusPanel.scss';

interface AuctionStatusPanelProps {
  auction: Auction;
  onBidPlaced: (amount: number) => Promise<void>;
  onBuyNow: () => void;
}

const AuctionStatusPanel: React.FC<AuctionStatusPanelProps> = ({ auction, onBidPlaced, onBuyNow }) => {
  const { user } = useAuth();
  const [bidAmount, setBidAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- LOGIC ĐẾM NGƯỢC THỜI GIAN ---
  const calculateTimeLeft = () => {
    const difference = +new Date(auction.end_time) - +new Date();
    let timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearTimeout(timer);
  });
  // --- KẾT THÚC LOGIC ĐẾM NGƯỢC ---

  const minNextBid = auction.current_price + auction.min_increment;

  const handlePlaceBid = async () => {
    setError(null);
    const amount = Number(bidAmount);

    // --- VALIDATION ---
    if (!user) {
      setError("Bạn cần đăng nhập để đấu giá.");
      return;
    }
    if (user._id === auction.seller_id) {
      setError("Bạn không thể tự đấu giá sản phẩm của mình.");
      return;
    }
    if (isNaN(amount) || amount < minNextBid) {
      setError(`Giá đặt phải lớn hơn hoặc bằng ${minNextBid.toLocaleString('vi-VN')} ₫`);
      return;
    }

    setIsSubmitting(true);
    await onBidPlaced(amount);
    setBidAmount(''); // Xóa ô input sau khi đặt giá
    setIsSubmitting(false);
  };

  return (
    <div className="auction-panel content-card">
      <div className="timer">
        <span className="timer__label">Thời gian còn lại</span>
        <div className="timer__time">
          {`${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s`}
        </div>
      </div>

      <div className="price-info">
        <span>Giá cao nhất hiện tại</span>
        <p>{auction.current_price.toLocaleString('vi-VN')} ₫</p>
      </div>

      {user && (
        <div className="bid-form">
          <input 
            type="number" 
            placeholder={`≥ ${minNextBid.toLocaleString('vi-VN')} ₫`}
            value={bidAmount}
            onChange={e => setBidAmount(e.target.value)} 
            disabled={isSubmitting}
          />
          <p className="min-bid-note">Bước giá: {auction.min_increment.toLocaleString('vi-VN')} ₫</p>
          {error && <p className="error-message">{error}</p>}
          <Button onClick={handlePlaceBid} disabled={isSubmitting}>
            {isSubmitting ? 'Đang xử lý...' : 'Đặt giá'}
          </Button>
        </div>
      )}

      {auction.buy_now_price && (
        <Button variant="secondary" className="btn-buy-now" onClick={onBuyNow}>
          Mua ngay {auction.buy_now_price.toLocaleString('vi-VN')} ₫
        </Button>
      )}
    </div>
  );
};

export default AuctionStatusPanel;