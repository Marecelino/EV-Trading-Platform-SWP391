
// src/pages/AuctionListPage/AuctionListPage.tsx
import React, { useState, useEffect } from 'react';
import auctionApi from '../../api/auctionApi';
import AuctionCard from '../../components/modules/AuctionCard/AuctionCard';
import './AuctionListPage.scss';

const AuctionListPage: React.FC = () => {
  const [auctions, setAuctions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    auctionApi.getActiveAuctions().then(res => {
      if (res.data.success) {
        setAuctions(res.data.data);
      }
    }).finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="auction-list-page container">
      <h1>Sàn đấu giá</h1>
      <p>Các sản phẩm hot nhất đang được đấu giá. Nhanh tay kẻo lỡ!</p>
      {isLoading ? <p>Đang tải...</p> : (
        <div className="auction-grid">
          {auctions.map(auction => (
            <AuctionCard key={auction._id} auction={auction} />
          ))}
        </div>
      )}
    </div>
  );
};
export default AuctionListPage;