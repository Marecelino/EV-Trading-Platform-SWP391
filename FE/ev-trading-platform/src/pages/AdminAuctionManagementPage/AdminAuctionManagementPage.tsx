// src/pages/AdminAuctionManagementPage/AdminAuctionManagementPage.tsx
import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import auctionApi from "../../api/auctionApi";
import type { Auction, Product } from "../../types";
import Pagination from "../../components/common/Pagination/Pagination";
import "./AdminAuctionManagementPage.scss"; // Sẽ tạo file style này

type AuctionStatus = "scheduled" | "live" | "ended" | "cancelled";

const AdminAuctionManagementPage: React.FC = () => {
  const [auctions, setAuctions] = useState<(Auction & { listing: Product })[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AuctionStatus>("live");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
  });

  const fetchAuctions = useCallback((status: AuctionStatus, page: number) => {
    setIsLoading(true);
    auctionApi
      .getAllAuctions(status, page)
      .then((response) => {
        if (response.data.success) {
          setAuctions(response.data.data);
          setPagination({
            currentPage: response.data.pagination.page,
            totalPages: response.data.pagination.pages,
          });
        }
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


  const handleApproveAuction = (auctionId: string) => {
    if (!window.confirm("Bạn có chắc muốn duyệt và bắt đầu phiên đấu giá này không?")) return;

    auctionApi.approveAuction(auctionId).then(response => {
      if (response.data.success) {
        alert('Duyệt thành công!');
        setAuctions(prev => prev.filter(a => a._id !== auctionId));
      } else {
        alert('Có lỗi xảy ra, vui lòng thử lại.');
      }
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
              auctions.map((auction) => (
                <tr key={auction._id}>
                  <td>
                    <div className="product-cell">
                      {/* Truy cập listing qua auction.listing */}
                      <img
                        src={auction.listing.images[0]}
                        alt={auction.listing.title}
                      />
                      <div className="product-info">
                        <Link to={`/auctions/${auction._id}`} target="_blank">
                          {auction.listing.title}
                        </Link>
                        {/* Đảm bảo seller_id được populate */}
                        <span>
                          Người bán:{" "}
                          {(auction.listing.seller_id as any)?.full_name ||
                            "N/A"}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>{auction.current_price.toLocaleString("vi-VN")} ₫</td>
                  <td>{new Date(auction.end_time).toLocaleString("vi-VN")}</td>
                  <td>{auction.bids.length}</td>
                  <td>
                    <span className={`status-badge status--${auction.status}`}>
                      {auction.status}
                    </span>
                  </td>
                  <td className="actions-cell">
                    {activeTab === 'scheduled' && (
                        <button 
                            className="action-btn btn--approve" 
                            onClick={() => handleApproveAuction(auctionItem._id)}
                        >
                            Duyệt
                        </button>
                    )}
                    <button className="action-btn btn--reject">
                      Hủy phiên
                    </button>
                  </td>
                </tr>
              ))
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
