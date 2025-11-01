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
      .getAllAuctions('live', 1, 50) // Get first page with limit 50 for list view
      .then((res) => {
        console.log("=== AUCTION LIST API RESPONSE ===");
        console.log("Response data:", res.data);
        
        // Handle backend response structure: { data: [...], pagination: {...} }
        let auctionsData: Auction[] = [];
        
        if (res.data?.data && Array.isArray(res.data.data)) {
          // Standard format: { data: [...], pagination: {...} }
          auctionsData = res.data.data;
        } else if (res.data?.success && Array.isArray(res.data.data)) {
          // Wrapped format: { success: true, data: [...], pagination: {...} }
          auctionsData = res.data.data;
        } else if (Array.isArray(res.data)) {
          // Direct array format (fallback)
          auctionsData = res.data;
        }
        
        // Validate and filter valid auctions
        auctionsData = auctionsData.filter((auction): auction is Auction => {
          return auction && auction._id && auction.status === "live";
        });
        
        setAuctions(auctionsData);
        console.log(`Loaded ${auctionsData.length} live auctions`);
      })
      .catch((error) => {
        console.error("Failed to fetch auctions:", error);
        console.error("Error details:", error.response?.data || error.message);
        setAuctions([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="auction-list-page container">
      <h1>Sàn đấu giá</h1>
      <p>Các sản phẩm hot nhất đang được đấu giá. Nhanh tay kẻo lỡ!</p>
      {isLoading ? (
        <div className="loading-state" style={{ textAlign: "center", padding: "60px 20px" }}>
          <div className="loading-spinner" style={{ display: "inline-block", width: "40px", height: "40px", border: "4px solid #f3f3f3", borderTop: "4px solid #007bff", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
          <p style={{ marginTop: "20px", color: "#666" }}>Đang tải danh sách đấu giá...</p>
        </div>
      ) : auctions.length === 0 ? (
        <div className="empty-state" style={{ textAlign: "center", padding: "60px 20px" }}>
          <p style={{ fontSize: "18px", color: "#666", marginBottom: "10px" }}>
            Hiện tại không có phiên đấu giá nào đang diễn ra.
          </p>
          <p style={{ fontSize: "14px", color: "#999" }}>
            Hãy quay lại sau để xem các phiên đấu giá mới!
          </p>
        </div>
      ) : (
        <div className="auction-grid">
          {auctions.map((auction) => (
            <AuctionCard key={auction._id} auction={auction} />
          ))}
        </div>
      )}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
export default AuctionListPage;
