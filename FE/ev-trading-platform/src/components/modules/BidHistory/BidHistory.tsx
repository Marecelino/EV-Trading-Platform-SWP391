// src/components/modules/BidHistory/BidHistory.tsx
import React from 'react';
import type { Bid } from '../../../types';
import './BidHistory.scss';

interface BidHistoryProps {
  bids: Bid[];
}

const BidHistory: React.FC<BidHistoryProps> = ({ bids }) => {
  const timeSince = (date: string) => {
    // Logic tính toán thời gian, ví dụ: "vài giây trước"
    return "vài giây trước";
  };

  return (
    <div className="bid-history content-card">
      <h3>Lịch sử đấu giá ({bids?.length || 0} lượt)</h3>
      {bids && bids.length > 0 ? (
        <ul className="bid-list">
          {bids.map((bid, index) => {
            const bidder = typeof bid.user_id === 'object' ? bid.user_id : null;
            return (
              <li key={bid._id} className="bid-item">
                <div className="bid-user">
                  <img src={bidder?.avatar_url || 'https://i.pravatar.cc/150'} alt={bidder?.full_name} />
                  <div className="bid-info">
                    <span>{index === 0 ? 'Giá cao nhất' : bidder?.full_name || 'Người dùng ẩn'}</span>
                    <span className="bid-time">{timeSince(bid.created_at)}</span>
                  </div>
                </div>
                <strong className="bid-amount">{bid.amount.toLocaleString('vi-VN')} ₫</strong>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="no-bids">Chưa có ai đặt giá. Hãy là người đầu tiên!</p>
      )}
    </div>
  );
};

export default BidHistory;