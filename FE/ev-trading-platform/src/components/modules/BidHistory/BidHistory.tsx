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

  // Sort bids by created_at DESC (newest first) - backend returns bids from newest to oldest (unshift)
  // But we want to display newest first in UI
  const sortedBids = useMemo(() => {
    if (!bids || bids.length === 0) return [];
    // Sort by created_at DESC (newest first)
    return [...bids].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA; // DESC order
    });
  }, [bids]);

  // Get highest bid for "Giá cao nhất" label
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
  const getBidderName = (bid: Bid, index: number): string => {
    // Show "Giá cao nhất" label for the highest bid (not necessarily index 0)
    if (highestBid && bid._id === highestBid._id) {
      return "Giá cao nhất";
    }
    
    const bidder = typeof bid.user_id === 'object' ? bid.user_id : null;
    return bidder?.full_name || "Người dùng ẩn";
  };

  // Get bidder avatar
  const getBidderAvatar = (bid: Bid): string => {
    const bidder = typeof bid.user_id === 'object' ? bid.user_id : null;
    const bidderName = bidder?.full_name || "Người dùng ẩn";
    return bidder?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(bidderName)}&background=27AE60&color=fff`;
  };

  return (
    <div className={`bid-history content-card ${isLoading ? 'loading' : ''}`}>
      {/* Header with Bid Count */}
      <h3>
        Lịch sử đấu giá
        {bidStats && <span className="bid-count">{bidStats.total}</span>}
      </h3>

      {/* Bid Statistics - Show only if there are bids */}
      {bidStats && bidStats.total > 0 && (
        <div className="bid-stats">
          <div className="stat-item">
            <span className="stat-label">Trung bình:</span>
            <span className="stat-value">{bidStats.average.toLocaleString('vi-VN')} ₫</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Thấp nhất:</span>
            <span className="stat-value">{bidStats.min.toLocaleString('vi-VN')} ₫</span>
          </div>
        </div>
      )}

      {/* Bid List */}
      {sortedBids && sortedBids.length > 0 ? (
        <ul className="bid-list">
          {sortedBids.map((bid, index) => {
            const bidder = typeof bid.user_id === 'object' ? bid.user_id : null;
            const bidderName = getBidderName(bid, index);
            const bidderAvatar = getBidderAvatar(bid);

            return (
              <li
                key={bid._id}
                className="bid-item"
                data-position={index + 1}
              >
                <div className="bid-user">
                  <img
                    src={bidderAvatar}
                    alt={bidderName}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(bidderName)}&background=27AE60&color=fff`;
                    }}
                  />
                  <div className="bid-info">
                    <span title={bidder?.full_name || "Người dùng ẩn"}>
                      {bidderName}
                    </span>
                    <span className="bid-time" title={new Date(bid.created_at).toLocaleString('vi-VN')}>
                      {timeSince(bid.created_at)}
                    </span>
                  </div>
                </div>
                <strong className="bid-amount">
                  {bid.amount.toLocaleString('vi-VN')}
                </strong>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="no-bids">
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