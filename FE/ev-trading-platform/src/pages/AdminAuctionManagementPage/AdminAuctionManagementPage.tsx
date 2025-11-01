// src/pages/AdminAuctionManagementPage/AdminAuctionManagementPage.tsx
import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import auctionApi from "../../api/auctionApi";
import type { Auction } from "../../types";
import Pagination from "../../components/common/Pagination/Pagination";
import "./AdminAuctionManagementPage.scss";

type AuctionStatus = "scheduled" | "live" | "ended" | "cancelled";

const AdminAuctionManagementPage: React.FC = () => {
  const [allAuctions, setAllAuctions] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AuctionStatus>("live");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
  });
  const ITEMS_PER_PAGE = 3;

  // Calculate paginated auctions
  const totalPages = Math.ceil(allAuctions.length / ITEMS_PER_PAGE);
  const startIndex = (pagination.currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedAuctions = allAuctions.slice(startIndex, endIndex);

  // CRITICAL FIX: Handle backend response structure: { data: [...], pagination: {...} }
  const fetchAuctions = useCallback((status: AuctionStatus) => {
    setIsLoading(true);
    console.log("=== FETCHING AUCTIONS ===");
    console.log("Status:", status);
    
    auctionApi
      .getAllAuctions(status, 1, 100) // Get enough for client-side pagination
      .then((response) => {
        console.log("=== AUCTIONS API RESPONSE ===");
        console.log("Full response:", response);
        console.log("Response data:", response.data);
        
        // Backend returns: { data: Auction[], pagination: {...} }
        let auctionsData: Auction[] = [];
        
        if (response.data?.data && Array.isArray(response.data.data)) {
          // Standard format: { data: [...], pagination: {...} }
          auctionsData = response.data.data;
          console.log("Extracted auctions from response.data.data:", auctionsData.length);
        } else if (response.data?.success && Array.isArray(response.data.data)) {
          // Wrapped format: { success: true, data: [...], pagination: {...} }
          auctionsData = response.data.data;
          console.log("Extracted auctions from response.data.success.data:", auctionsData.length);
        } else if (Array.isArray(response.data)) {
          // Direct array format (fallback)
          auctionsData = response.data;
          console.log("Extracted auctions from direct array:", auctionsData.length);
        } else {
          console.warn("Unknown response structure:", response.data);
        }
        
        // Validate auctions data
        auctionsData = auctionsData.filter((auction): auction is Auction => {
          if (!auction || !auction._id) {
            console.warn("Invalid auction found:", auction);
            return false;
          }
          return true;
        });
        
        setAllAuctions(auctionsData);
        
        // Update pagination based on client-side pagination
        const calculatedTotalPages = Math.ceil(auctionsData.length / ITEMS_PER_PAGE) || 1;
        setPagination((prev) => ({
          currentPage: prev.currentPage > calculatedTotalPages ? 1 : prev.currentPage,
          totalPages: calculatedTotalPages,
        }));
        console.log(`Loaded ${auctionsData.length} auctions. Total pages: ${calculatedTotalPages}`);
      })
      .catch(error => {
        console.error("Error fetching auctions:", error);
        console.error("Error details:", error.response?.data || error.message);
        setAllAuctions([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    fetchAuctions(activeTab);
  }, [activeTab, fetchAuctions]);

  // Update pagination when filtered auctions change
  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      totalPages: totalPages,
      currentPage: prev.currentPage > totalPages ? 1 : prev.currentPage,
    }));
  }, [totalPages]);

  const handleTabClick = (tab: AuctionStatus) => {
    setActiveTab(tab);
    setPagination((p) => ({ ...p, currentPage: 1 }));
  };

  // Helper function to get Vietnamese status translation
  const getStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
      scheduled: "Sắp diễn ra",
      live: "Đang diễn ra",
      ended: "Đã kết thúc",
      cancelled: "Đã hủy",
    };
    return statusMap[status] || status;
  };

  // Helper function to calculate time remaining
  const getTimeRemaining = (endTime: string): string => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) {
      return "Đã kết thúc";
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days} ngày ${hours} giờ`;
    } else if (hours > 0) {
      return `${hours} giờ ${minutes} phút`;
    } else {
      return `${minutes} phút`;
    }
  };

  // Handler: Approve and start auction (scheduled → live)
  const handleApproveAuction = (auctionId: string) => {
    if (
      !window.confirm(
        "Bạn có chắc muốn duyệt và bắt đầu phiên đấu giá này không?"
      )
    )
      return;

    auctionApi.startAuction(auctionId).then((response) => {
      const isSuccess = response.data?.success || 
                       (response.data && typeof response.data === 'object' && 'status' in response.data) ||
                       response.status === 200;
      
      if (isSuccess) {
        alert("Duyệt thành công! Phiên đấu giá đã được kích hoạt.");
        fetchAuctions(activeTab);
      } else {
        alert("Có lỗi xảy ra, vui lòng thử lại.");
      }
    }).catch(error => {
      console.error("Error starting auction:", error);
      const errorMessage = error.response?.data?.message || error.message || "Có lỗi xảy ra khi duyệt phiên đấu giá.";
      alert(errorMessage);
    });
  };

  // Handler: Cancel auction
  const handleCancelAuction = (auctionId: string, auctionTitle?: string) => {
    const title = auctionTitle || "phiên đấu giá này";
    if (
      !window.confirm(
        `Bạn có chắc muốn hủy ${title}? Hành động này không thể hoàn tác.`
      )
    )
      return;

    auctionApi.cancelAuction(auctionId).then((response) => {
      const isSuccess = response.data?.success || 
                       (response.data && typeof response.data === 'object' && 'status' in response.data) ||
                       response.status === 200;
      
      if (isSuccess) {
        alert("Đã hủy phiên đấu giá thành công.");
        fetchAuctions(activeTab);
      } else {
        alert("Có lỗi xảy ra, vui lòng thử lại.");
      }
    }).catch(error => {
      console.error("Error cancelling auction:", error);
      const errorMessage = error.response?.data?.message || error.message || "Có lỗi xảy ra khi hủy phiên đấu giá.";
      alert(errorMessage);
    });
  };

  // Handler: End auction manually (live → ended)
  const handleEndAuction = (auctionId: string, auctionTitle?: string) => {
    const title = auctionTitle || "phiên đấu giá này";
    if (
      !window.confirm(
        `Bạn có chắc muốn kết thúc sớm ${title}? Phiên đấu giá sẽ kết thúc ngay lập tức.`
      )
    )
      return;

    auctionApi.endAuction(auctionId).then((response) => {
      const isSuccess = response.data?.success || 
                       (response.data && typeof response.data === 'object' && 'status' in response.data) ||
                       response.status === 200;
      
      if (isSuccess) {
        alert("Đã kết thúc phiên đấu giá thành công.");
        fetchAuctions(activeTab);
      } else {
        alert("Có lỗi xảy ra, vui lòng thử lại.");
      }
    }).catch(error => {
      console.error("Error ending auction:", error);
      const errorMessage = error.response?.data?.message || error.message || "Có lỗi xảy ra khi kết thúc phiên đấu giá.";
      alert(errorMessage);
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
              <th>Thời gian bắt đầu</th>
              <th>Thời gian kết thúc</th>
              <th>Thời gian còn lại</th>
              <th>Số lượt giá</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="empty-cell">
                  <div className="loading-spinner">Đang tải dữ liệu...</div>
                </td>
              </tr>
            ) : paginatedAuctions.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-cell">
                  <div className="empty-state">
                    <p className="empty-state-title">
                      Không có phiên đấu giá nào trong mục này.
                    </p>
                    <p className="empty-state-subtitle">
                      Hãy thử chuyển sang tab khác hoặc tạo phiên đấu giá mới.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedAuctions.map((auction) => {
                // Use auction data directly (flattened structure from backend)
                const title = auction.title || "Không có tiêu đề";
                const images = auction.images || [];
                const firstImage = images[0] || "/placeholder-image.jpg";
                
                // Handle seller_id: can be null, string, or User object
                const sellerName = auction.seller_id && typeof auction.seller_id === 'object' 
                  ? (auction.seller_id as any)?.full_name || "N/A"
                  : "N/A";

                // Calculate time remaining
                const timeRemaining = auction.end_time ? getTimeRemaining(auction.end_time) : "N/A";
                const isEnded = auction.status === "ended" || auction.status === "cancelled";

                return (
                  <tr key={auction._id}>
                    <td>
                      <div className="product-cell">
                        <img 
                          src={firstImage} 
                          alt={title}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/placeholder-image.jpg";
                          }}
                        />
                        <div className="product-info">
                          <Link to={`/auctions/${auction._id}`} target="_blank">
                            {title}
                          </Link>
                          <span>
                            Người bán: {sellerName}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong style={{ color: "#007bff" }}>
                        {auction.current_price ? auction.current_price.toLocaleString("vi-VN") + " ₫" : "N/A"}
                      </strong>
                    </td>
                    <td>
                      {auction.start_time 
                        ? new Date(auction.start_time).toLocaleString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })
                        : "N/A"
                      }
                    </td>
                    <td>
                      {auction.end_time 
                        ? new Date(auction.end_time).toLocaleString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })
                        : "N/A"
                      }
                    </td>
                    <td>
                      <span className={isEnded ? "time-ended" : "time-remaining"}>
                        {timeRemaining}
                      </span>
                    </td>
                    <td>
                      <span className="bids-count">
                        {auction.bids ? auction.bids.length : 0}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`status-badge status--${auction.status}`}
                        title={getStatusLabel(auction.status)}
                      >
                        {getStatusLabel(auction.status)}
                      </span>
                    </td>
                    <td className="actions-cell">
                      {activeTab === "scheduled" && (
                        <button
                          className="action-btn btn--approve"
                          onClick={() => handleApproveAuction(auction._id)}
                          title="Duyệt và bắt đầu phiên đấu giá"
                        >
                          Duyệt
                        </button>
                      )}
                      {activeTab === "live" && !isEnded && (
                        <button
                          className="action-btn btn--end"
                          onClick={() => handleEndAuction(auction._id, title)}
                          title="Kết thúc phiên đấu giá sớm"
                        >
                          Kết thúc
                        </button>
                      )}
                      {!isEnded && (
                        <button
                          className="action-btn btn--reject"
                          onClick={() => handleCancelAuction(auction._id, title)}
                          title="Hủy phiên đấu giá"
                        >
                          Hủy
                        </button>
                      )}
                      {isEnded && (
                        <span className="no-actions" style={{ color: "#999", fontStyle: "italic" }}>
                          Không có hành động
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {!isLoading && paginatedAuctions.length > 0 && (
        <div className="pagination-wrapper">
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={(page) =>
              setPagination((p) => ({ ...p, currentPage: page }))
            }
          />
          <div className="pagination-info">
            Trang {pagination.currentPage} / {pagination.totalPages}
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminAuctionManagementPage;
