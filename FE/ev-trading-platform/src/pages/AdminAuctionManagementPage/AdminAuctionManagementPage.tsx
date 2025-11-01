// src/pages/AdminAuctionManagementPage/AdminAuctionManagementPage.tsx
import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import auctionApi from "../../api/auctionApi";
import type { Auction, Product } from "../../types";
import Pagination from "../../components/common/Pagination/Pagination";
import "./AdminAuctionManagementPage.scss"; // Sẽ tạo file style này

type AuctionStatus = "scheduled" | "live" | "ended" | "cancelled";

const AdminAuctionManagementPage: React.FC = () => {
  const [auctions, setAuctions] = useState<(Auction & { listing?: Product })[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AuctionStatus>("live");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
  });

  // CRITICAL FIX: Verify getAllAuctions response structure handling
  const fetchAuctions = useCallback((status: AuctionStatus, page: number) => {
    setIsLoading(true);
    auctionApi
      .getAllAuctions(status, page)
      .then((response) => {
        // Handle both response.data.success format and direct data format
        let auctionsData: (Auction & { listing?: Product })[] = [];
        if (response.data?.success && response.data?.data) {
          auctionsData = response.data.data;
        } else if (Array.isArray(response.data?.data)) {
          auctionsData = response.data.data;
        } else if (Array.isArray(response.data)) {
          auctionsData = response.data;
        }
        
        setAuctions(auctionsData);
        
        // Handle pagination
        if (response.data?.pagination) {
          setPagination({
            currentPage: response.data.pagination.page ?? page,
            totalPages: response.data.pagination.pages ?? 1,
          });
        } else {
          // If no pagination, calculate from data length
          setPagination({
            currentPage: page,
            totalPages: Math.ceil(auctionsData.length / 10) || 1,
          });
        }
      })
      .catch(error => {
        console.error("Error fetching auctions:", error);
        setAuctions([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    fetchAuctions(activeTab, pagination.currentPage);
  }, [activeTab, pagination.currentPage, fetchAuctions]);

  const handleTabClick = (tab: AuctionStatus) => {
    setActiveTab(tab);
    setPagination((p) => ({ ...p, currentPage: 1 }));
  };

  // CRITICAL FIX: Replace approveAuction with startAuction
  const handleApproveAuction = (auctionId: string) => {
    if (
      !window.confirm(
        "Bạn có chắc muốn duyệt và bắt đầu phiên đấu giá này không?"
      )
    )
      return;

    auctionApi.startAuction(auctionId).then((response) => {
      // Handle response structure - may be nested or direct
      const isSuccess = response.data?.success || 
                       (response.data && typeof response.data === 'object' && 'status' in response.data) ||
                       response.status === 200;
      
      if (isSuccess) {
        alert("Duyệt thành công!");
        // Refresh auctions list instead of just filtering
        fetchAuctions(activeTab, pagination.currentPage);
      } else {
        alert("Có lỗi xảy ra, vui lòng thử lại.");
      }
    }).catch(error => {
      console.error("Error starting auction:", error);
      alert("Có lỗi xảy ra, vui lòng thử lại.");
    });
  };
  return (
    <div className="admin-page">
      <h1>Quản lý Đấu giá</h1>

      <div className="admin-tabs">
        <button
          className={activeTab === "live" ? "active" : ""}
          onClick={() => handleTabClick("live")}
        >
          Đang diễn ra
        </button>
        <button
          className={activeTab === "scheduled" ? "active" : ""}
          onClick={() => handleTabClick("scheduled")}
        >
          Sắp diễn ra
        </button>
        <button
          className={activeTab === "ended" ? "active" : ""}
          onClick={() => handleTabClick("ended")}
        >
          Đã kết thúc
        </button>
        <button
          className={activeTab === "cancelled" ? "active" : ""}
          onClick={() => handleTabClick("cancelled")}
        >
          Đã hủy
        </button>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>Giá hiện tại</th>
              <th>Thời gian kết thúc</th>
              <th>Số lượt giá</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center" }}>
                  Đang tải...
                </td>
              </tr>
            ) : (
              auctions.map((auction) => {
                if (!auction.listing) {
                  return (
                    <tr key={auction._id}>
                      <td colSpan={6}>
                        Không tìm thấy thông tin sản phẩm cho phiên đấu giá này.
                      </td>
                    </tr>
                  );
                }

                const listing = auction.listing;

                return (
                  <tr key={auction._id}>
                    <td>
                      <div className="product-cell">
                        <img src={listing.images[0]} alt={listing.title} />
                        <div className="product-info">
                          <Link to={`/auctions/${auction._id}`} target="_blank">
                            {listing.title}
                          </Link>
                          <span>
                            Người bán:{" "}
                            {(listing.seller_id as any)?.full_name || "N/A"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>{auction.current_price.toLocaleString("vi-VN")} ₫</td>
                    <td>
                      {new Date(auction.end_time).toLocaleString("vi-VN")}
                    </td>
                    <td>{auction.bids.length}</td>
                    <td>
                      <span
                        className={`status-badge status--${auction.status}`}
                      >
                        {auction.status}
                      </span>
                    </td>
                    <td className="actions-cell">
                      {activeTab === "scheduled" && (
                        <button
                          className="action-btn btn--approve"
                          onClick={() => handleApproveAuction(auction._id)}
                        >
                          Duyệt
                        </button>
                      )}
                      <button className="action-btn btn--reject">
                        Hủy phiên
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onPageChange={(page) =>
          setPagination((p) => ({ ...p, currentPage: page }))
        }
      />
    </div>
  );
};
export default AdminAuctionManagementPage;
