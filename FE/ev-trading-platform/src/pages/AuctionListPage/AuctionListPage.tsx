// src/pages/AuctionListPage/AuctionListPage.tsx
import React, { useState, useEffect } from "react";
import auctionApi from "../../api/auctionApi";
import AuctionCard from "../../components/modules/AuctionCard/AuctionCard";
import "./AuctionListPage.scss";
import type { Auction } from "../../types";

const AuctionListPage: React.FC = () => {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    // CRITICAL FIX: Replace getActiveAuctions() with getAllAuctions('live')
    auctionApi
      .getAllAuctions('live')
      .then((res) => {
        // Handle both response.data and response.data.data structures
        let auctionsData: Auction[] = [];
        if (res.data?.success && res.data?.data) {
          auctionsData = res.data.data;
        } else if (res.data?.data) {
          auctionsData = res.data.data;
        } else if (Array.isArray(res.data)) {
          auctionsData = res.data;
        }
        setAuctions(Array.isArray(auctionsData) ? auctionsData : []);
      })
      .catch((error) => {
        console.error("Failed to fetch auctions:", error);
        setAuctions([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="auction-list-page container">
      <h1>Sàn đấu giá</h1>
      <p>Các sản phẩm hot nhất đang được đấu giá. Nhanh tay kẻo lỡ!</p>
      {isLoading ? (
        <p>Đang tải...</p>
      ) : (
        <div className="auction-grid">
          {auctions.map((auction) => (
            <AuctionCard key={auction._id} auction={auction} />
          ))}
        </div>
      )}
    </div>
  );
};
export default AuctionListPage;
