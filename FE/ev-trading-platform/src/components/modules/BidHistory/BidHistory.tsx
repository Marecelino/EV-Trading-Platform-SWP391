import React, { useMemo } from 'react';
import type { Bid } from '../../../types';
import './BidHistory.scss';

interface BidHistoryProps {
  bids: Bid[];
  isLoading?: boolean;
}

const BidHistory: React.FC<BidHistoryProps> = ({ bids, isLoading = false }) => {
  
  // Format time since bid was placed
  const timeSince = (dateString: string): string => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " năm trước";
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " tháng trước";
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " ngày trước";
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " giờ trước";
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " phút trước";
    
    return "vừa xong";
  };

  // Sort bids by created_at DESC (newest first)
  const sortedBids = useMemo(() => {
    if (!bids || bids.length === 0) return [];
    return [...bids].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });
  }, [bids]);

  // Get highest bid
  const highestBid = useMemo(() => {
    if (!bids || bids.length === 0) return null;
    return bids.reduce((max, bid) => bid.amount > max.amount ? bid : max, bids[0]);
  }, [bids]);

  // Calculate bid statistics
  const bidStats = useMemo(() => {
    if (!bids || bids.length === 0) return null;
    
    const amounts = bids.map(bid => bid.amount);
    const avgBid = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    const minBid = Math.min(...amounts);
    const maxBid = Math.max(...amounts);
    
    return {
      total: bids.length,
      average: avgBid,
      min: minBid,
      max: maxBid,
    };
  }, [bids]);

  // Get bidder display name
  const getBidderName = (bid: Bid): string => {
    if (highestBid && bid._id === highestBid._id) {
      return "Giá cao nhất";
    }
    
    const bidder = typeof bid.user_id === 'object' ? bid.user_id : null;
    
    // If bidder object exists
    if (bidder) {
      if (bidder.full_name) return bidder.full_name;
      if (bidder.email) {
        const emailParts = bidder.email.split('@');
        if (emailParts[0].length > 3) {
          return `${emailParts[0].slice(0, 3)}***@${emailParts[1] || 'email'}`;
        }
        return emailParts[0];
      }
      if (bidder._id && bidder._id.length > 4) {
        return `User_${bidder._id.slice(-4)}`;
      }
    }
    
    // If user_id is a string, try to extract from it
    if (typeof bid.user_id === 'string' && bid.user_id.length > 4) {
      return `User_${bid.user_id.slice(-4)}`;
    }
    
    return "Người dùng ẩn";
  };

  // Get bidder avatar
  const getBidderAvatar = (bid: Bid): string => {
    const bidder = typeof bid.user_id === 'object' ? bid.user_id : null;
    const bidderName = bidder?.full_name || "Người dùng ẩn";
    return bidder?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(bidderName)}&background=27AE60&color=fff&bold=true&size=128`;
  };

  return (
    <div className={`bid-history content-card ${isLoading ? 'loading' : ''}`}>
      {/* Header with Bid Count */}
      <h3>
        Lịch sử đấu giá
        {bidStats && <span className="bid-count">{bidStats.total}</span>}
      </h3>

      {/* Bid Statistics */}
      {bidStats && bidStats.total > 0 && (
        <div className="bid-stats">
          <div className="stat-item">
            <span className="stat-label">Trung bình</span>
            <span className="stat-value">{bidStats.average.toLocaleString('vi-VN')} ₫</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Thấp nhất</span>
            <span className="stat-value">{bidStats.min.toLocaleString('vi-VN')} ₫</span>
          </div>
        </div>
      )}

      {/* Bid List */}
      {sortedBids && sortedBids.length > 0 ? (
        <ul className="bid-list" role="list" aria-label="Danh sách đấu giá">
          {sortedBids.map((bid, index) => {
            const bidder = typeof bid.user_id === 'object' ? bid.user_id : null;
            const bidderName = getBidderName(bid);
            const bidderAvatar = getBidderAvatar(bid);

            return (
              <li
                key={bid._id}
                className="bid-item"
                data-position={index + 1}
                role="listitem"
                aria-label={`${bidderName} đặt giá ${bid.amount.toLocaleString('vi-VN')} đồng ${timeSince(bid.created_at)}`}
              >
                <div className="bid-user">
                  <img
                    src={bidderAvatar}
                    alt={`Avatar của ${bidderName}`}
                    loading="lazy"
                    width="42"
                    height="42"
                    onError={(e) => {
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(bidderName)}&background=27AE60&color=fff&bold=true&size=128`;
                    }}
                  />
                  <div className="bid-info">
                    <span title={bidder?.full_name || "Người dùng ẩn"}>
                      {bidderName}
                    </span>
                    <span 
                      className="bid-time" 
                      title={new Date(bid.created_at).toLocaleString('vi-VN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    >
                      {timeSince(bid.created_at)}
                    </span>
                  </div>
                </div>
                <strong 
                  className="bid-amount"
                  aria-label={`${bid.amount.toLocaleString('vi-VN')} đồng`}
                >
                  {bid.amount.toLocaleString('vi-VN')}
                </strong>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="no-bids" role="status" aria-live="polite">
          <p>
            Chưa có ai đặt giá.
            <strong>Hãy là người đầu tiên!</strong>
          </p>
        </div>
      )}
    </div>
  );
};

export default BidHistory;