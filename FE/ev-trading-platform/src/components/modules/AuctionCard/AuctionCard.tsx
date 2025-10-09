// src/components/modules/AuctionCard/AuctionCard.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Timer, Hammer } from 'lucide-react';
import type { Auction, Product } from '../../../types';
import './AuctionCard.scss';

// --- HOOK ĐẾM NGƯỢC THỜI GIAN (ĐÃ HOÀN THIỆN) ---
const useCountdown = (endTime: string) => {
  const calculateTimeLeft = () => {
    const difference = +new Date(endTime) - +new Date();
    let timeLeft;

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isOver: false,
      };
    } else {
      timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  return timeLeft;
};

interface AuctionCardProps {
  auction: Auction & { listing: Product };
}

const AuctionCard: React.FC<AuctionCardProps> = ({ auction }) => {
  // Kiểm tra an toàn phòng trường hợp `listing` không tồn tại
  if (!auction.listing) {
    return <div className="auction-card--error">Lỗi: Không có thông tin sản phẩm.</div>;
  }
  
  const { listing } = auction;
  const timeLeft = useCountdown(auction.end_time);

  return (
    <div className="auction-card">
      <Link to={`/auctions/${auction._id}`}>
        <div className="auction-card__image">
          <img src={listing.images[0]} alt={listing.title} />
          <div className={`timer-overlay ${timeLeft.isOver ? 'ended' : ''}`}>
            <Timer size={16} />
            {/* SỬA LỖI: Hiển thị "Đã kết thúc" nếu thời gian đã hết */}
            <span>
              {timeLeft.isOver
                ? 'Đã kết thúc'
                : `${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s`}
            </span>
          </div>
        </div>
        <div className="auction-card__info">
          <h3 className="title">{listing.title}</h3>
          <p className="price-label">Giá cao nhất hiện tại</p>
          <p className="current-price">{auction.current_price.toLocaleString('vi-VN')} ₫</p>
          <div className="bid-info">
            <Hammer size={16} />
            <span>{auction.bids.length} lượt đấu giá</span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default AuctionCard;