// src/pages/AdminAuctionManagementPage/AdminAuctionManagementPage.tsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { Gavel, Clock, CheckCircle, XCircle, AlertCircle, TrendingUp } from "lucide-react";
import auctionApi from "../../api/auctionApi";
import type { Auction } from "../../types";
import { UpdateAuctionStatusDto } from "../../types/api";
import Pagination from "../../components/common/Pagination/Pagination";
import "./AdminAuctionManagementPage.scss";

type AuctionStatus = "pending" | "draft" | "scheduled" | "live" | "ended" | "cancelled";

const AdminAuctionManagementPage: React.FC = () => {
  const [allAuctions, setAllAuctions] = useState<Auction[]>([]);
  const [allAuctionsForStats, setAllAuctionsForStats] = useState<Auction[]>([]); // Store all auctions for stats
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AuctionStatus>("pending");
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

  // Calculate stats from all auctions
  const auctionStats = useMemo(() => {
    const total = allAuctionsForStats.length;
    const live = allAuctionsForStats.filter(a => a.status === "live").length;
    const pending = allAuctionsForStats.filter(a => a.status === "pending").length;
    const ended = allAuctionsForStats.filter(a => a.status === "ended").length;
    
    return { total, live, pending, ended };
  }, [allAuctionsForStats]);

  // Fetch all auctions for stats (once on mount)
  const fetchAllAuctionsForStats = useCallback(() => {
    // Fetch all auctions without status filter for stats
    Promise.all([
      auctionApi.getAllAuctions("pending", 1, 100),
      auctionApi.getAllAuctions("live", 1, 100),
      auctionApi.getAllAuctions("ended", 1, 100),
      auctionApi.getAllAuctions("scheduled", 1, 100),
      auctionApi.getAllAuctions("draft", 1, 100),
      auctionApi.getAllAuctions("cancelled", 1, 100),
    ])
      .then((responses) => {
        let allAuctionsData: Auction[] = [];
        
        responses.forEach((response) => {
          let auctionsData: Auction[] = [];
          
          if (response.data?.data && Array.isArray(response.data.data)) {
            auctionsData = response.data.data;
          } else if (response.data?.success && Array.isArray(response.data.data)) {
            auctionsData = response.data.data;
          } else if (Array.isArray(response.data)) {
            auctionsData = response.data;
          }
          
          auctionsData = auctionsData.filter((auction): auction is Auction => {
            return !!(auction && auction._id);
          });
          
          allAuctionsData = [...allAuctionsData, ...auctionsData];
        });
        
        setAllAuctionsForStats(allAuctionsData);
      })
      .catch(error => {
        console.error("Error fetching all auctions for stats:", error);
      });
  }, []);

  useEffect(() => {
    fetchAllAuctionsForStats();
  }, [fetchAllAuctionsForStats]);

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
        
        // Refresh stats after fetching
        fetchAllAuctionsForStats();
      })
      .catch(error => {
        console.error("Error fetching auctions:", error);
        console.error("Error details:", error.response?.data || error.message);
        setAllAuctions([]);
      })
      .finally(() => setIsLoading(false));
  }, [fetchAllAuctionsForStats]);

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
      draft: "Bản nháp",
      pending: "Chờ duyệt",
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

  // Handler: Schedule auction (pending → scheduled)
  const handleScheduleAuction = (auctionId: string) => {
    if (!window.confirm("Bạn có chắc muốn lên lịch phiên đấu giá này?")) return;

    const statusDto: UpdateAuctionStatusDto = { status: 'scheduled' };
    auctionApi.updateAuctionStatus(auctionId, statusDto).then((response) => {
      const isSuccess = response.status === 200 || 
                       (response.data && typeof response.data === 'object' && '_id' in response.data);
      
      if (isSuccess) {
        alert("Đã lên lịch phiên đấu giá thành công.");
        fetchAuctions(activeTab);
      } else {
        alert("Có lỗi xảy ra, vui lòng thử lại.");
      }
    }).catch(error => {
      console.error("Error scheduling auction:", error);
      const errorMessage = error.response?.data?.message || error.message || "Có lỗi xảy ra khi lên lịch phiên đấu giá.";
      alert(errorMessage);
    });
  };

  // Handler: Activate auction immediately (pending/scheduled → live)
  const handleActivateAuction = (auctionId: string) => {
    if (!window.confirm("Bạn có chắc muốn kích hoạt ngay phiên đấu giá này?")) return;

    auctionApi.activateAuction(auctionId).then((response) => {
      const isSuccess = response.status === 200 || 
                       (response.data && typeof response.data === 'object' && '_id' in response.data);
      
      if (isSuccess) {
        alert("Kích hoạt thành công! Phiên đấu giá đã được bắt đầu ngay.");
        fetchAuctions(activeTab);
      } else {
        alert("Có lỗi xảy ra, vui lòng thử lại.");
      }
    }).catch(error => {
      console.error("Error activating auction:", error);
      const errorMessage = error.response?.data?.message || error.message || "Có lỗi xảy ra khi kích hoạt phiên đấu giá.";
      alert(errorMessage);
    });
  };

  // Handler: Approve and start auction (deprecated - use handleActivateAuction or handleScheduleAuction)
  const handleApproveAuction = handleActivateAuction;

  // Handler: Cancel auction (set status to cancelled)
  const handleCancelAuction = (auctionId: string, auctionTitle?: string) => {
    const title = auctionTitle || "phiên đấu giá này";
    if (
      !window.confirm(
        `Bạn có chắc muốn hủy ${title}? Hành động này không thể hoàn tác.`
      )
    )
      return;

    const statusDto: UpdateAuctionStatusDto = { status: 'cancelled' };
    auctionApi.updateAuctionStatus(auctionId, statusDto).then((response) => {
      const isSuccess = response.status === 200 || 
                       (response.data && typeof response.data === 'object' && '_id' in response.data);
      
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

      {/* Stats Cards */}
      <div className="stats-cards">
        <div className="stat-card stat-card--total">
          <div className="stat-card__icon">
            <Gavel size={24} />
          </div>
          <div className="stat-card__content">
            <h3 className="stat-card__label">Tổng đấu giá</h3>
            <p className="stat-card__value">{auctionStats.total.toLocaleString('vi-VN')}</p>
          </div>
        </div>

        <div className="stat-card stat-card--live">
          <div className="stat-card__icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-card__content">
            <h3 className="stat-card__label">Đang diễn ra</h3>
            <p className="stat-card__value">{auctionStats.live.toLocaleString('vi-VN')}</p>
          </div>
        </div>

        <div className="stat-card stat-card--pending">
          <div className="stat-card__icon">
            <Clock size={24} />
          </div>
          <div className="stat-card__content">
            <h3 className="stat-card__label">Chờ duyệt</h3>
            <p className="stat-card__value">{auctionStats.pending.toLocaleString('vi-VN')}</p>
          </div>
        </div>

        <div className="stat-card stat-card--ended">
          <div className="stat-card__icon">
            <CheckCircle size={24} />
          </div>
          <div className="stat-card__content">
            <h3 className="stat-card__label">Đã kết thúc</h3>
            <p className="stat-card__value">{auctionStats.ended.toLocaleString('vi-VN')}</p>
          </div>
        </div>
      </div>

      <div className="admin-tabs">
        <button
          className={activeTab === "pending" ? "active" : ""}
          onClick={() => handleTabClick("pending")}
        >
          Chờ duyệt
        </button>
        <button
          className={activeTab === "draft" ? "active" : ""}
          onClick={() => handleTabClick("draft")}
        >
          Bản nháp
        </button>
        <button
          className={activeTab === "scheduled" ? "active" : ""}
          onClick={() => handleTabClick("scheduled")}
        >
          Sắp diễn ra
        </button>
        <button
          className={activeTab === "live" ? "active" : ""}
          onClick={() => handleTabClick("live")}
        >
          Đang diễn ra
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
                      {activeTab === "pending" && (
                        <>
                          <button
                            className="action-btn btn--approve"
                            onClick={() => handleScheduleAuction(auction._id)}
                            title="Lên lịch phiên đấu giá"
                          >
                            Lên lịch
                          </button>
                          <button
                            className="action-btn btn--approve"
                            onClick={() => handleActivateAuction(auction._id)}
                            title="Kích hoạt ngay phiên đấu giá"
                          >
                            Kích hoạt ngay
                          </button>
                          <button
                            className="action-btn btn--reject"
                            onClick={() => handleCancelAuction(auction._id, title)}
                            title="Hủy phiên đấu giá"
                          >
                            Hủy
                          </button>
                        </>
                      )}
                      {activeTab === "scheduled" && (
                        <>
                          <button
                            className="action-btn btn--approve"
                            onClick={() => handleActivateAuction(auction._id)}
                            title="Kích hoạt ngay phiên đấu giá"
                          >
                            Kích hoạt ngay
                          </button>
                          <button
                            className="action-btn btn--reject"
                            onClick={() => handleCancelAuction(auction._id, title)}
                            title="Hủy phiên đấu giá"
                          >
                            Hủy
                          </button>
                        </>
                      )}
                      {activeTab === "live" && !isEnded && (
                        <>
                          <button
                            className="action-btn btn--end"
                            onClick={() => handleEndAuction(auction._id, title)}
                            title="Kết thúc phiên đấu giá sớm"
                          >
                            Kết thúc
                          </button>
                          <button
                            className="action-btn btn--reject"
                            onClick={() => handleCancelAuction(auction._id, title)}
                            title="Hủy phiên đấu giá"
                          >
                            Hủy
                          </button>
                        </>
                      )}
                      {(activeTab === "ended" || activeTab === "cancelled" || activeTab === "draft") && (
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
