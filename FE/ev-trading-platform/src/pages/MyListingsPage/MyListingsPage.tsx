// src/pages/MyListingsPage/MyListingsPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle, X } from "lucide-react";
import listingApi from "../../api/listingApi";
import type { Product } from "../../types";
import { SearchListingsParams, PaginatedResponse } from "../../types/api";
import "./MyListingsPage.scss";
import MyListingItem from "../../components/modules/MyListingItem/MyListingItem";
import { useAuth } from "../../contexts/AuthContext";

type ListingStatus = "active" | "pending" | "rejected" | "expired" | "draft" | "sold";

const MyListingsPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ListingStatus>("active");
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const ITEMS_PER_PAGE = 10;

  // Map frontend tab to API status
  const mapTabToApiStatus = (tab: ListingStatus): 'draft' | 'pending' | 'active' | 'rejected' | 'sold' | 'expired' | undefined => {
    switch (tab) {
      case 'active':
        return 'active';
      case 'pending':
        return 'pending';
      case 'rejected':
        return 'rejected';
      case 'expired':
        return 'expired'; // Fixed: should be 'expired' not 'sold'
      case 'draft':
        return 'draft';
      case 'sold':
        return 'sold';
      default:
        return undefined;
    }
  };

  // Fetch listings with status filter from backend
  const fetchMyListings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const apiStatus = mapTabToApiStatus(activeTab);
      const params: SearchListingsParams = {
        status: apiStatus,
        page: pagination.currentPage,
        limit: ITEMS_PER_PAGE,
      };

      const response = await listingApi.getMyListings(params);
      
      console.log("=== MY LISTINGS API RESPONSE ===");
      console.log("Full response:", response);
      console.log("Response data:", response.data);
      
      // Handle response structure: { data: [...], meta: {...} }
      const responseData = response.data as Product[] | PaginatedResponse<Product>;
      
      let listingsData: Product[] = [];
      let paginationMeta = null;
      
      // Extract listings from response
      if (Array.isArray(responseData)) {
        // Direct array format (fallback)
        listingsData = responseData;
      } else if (responseData && typeof responseData === 'object') {
        // PaginatedResponse format: { data: Product[], meta: {...} } or { data: Product[], pagination: {...} }
        if ('data' in responseData && Array.isArray(responseData.data)) {
          listingsData = responseData.data;
          // Prefer 'meta' over 'pagination' (backend uses 'meta')
          paginationMeta = 'meta' in responseData && responseData.meta 
            ? responseData.meta 
            : 'pagination' in responseData && responseData.pagination
            ? responseData.pagination
            : null;
        }
      }
      
      // Validate listings
      listingsData = listingsData.filter((listing): listing is Product => {
        if (!listing || !listing._id) {
          console.warn("Invalid listing found:", listing);
          return false;
        }
        return true;
      });
      
      setListings(listingsData);
      console.log(`Loaded ${listingsData.length} listings with status ${activeTab}`);
      
      // Update pagination from backend meta or pagination
      if (paginationMeta && typeof paginationMeta === 'object') {
        const meta = paginationMeta as { page?: number; totalPages?: number; pages?: number; total?: number; limit?: number };
        setPagination({
          currentPage: meta.page || pagination.currentPage,
          totalPages: meta.totalPages || meta.pages || Math.ceil((meta.total || 0) / (meta.limit || ITEMS_PER_PAGE)) || 1,
        });
      } else {
        // Fallback: calculate from data length
        setPagination({
          currentPage: pagination.currentPage,
          totalPages: Math.ceil(listingsData.length / ITEMS_PER_PAGE) || 1,
        });
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { status?: number; data?: { message?: string } } };
      const errorMessage = 
        axiosError?.response?.status === 401
          ? "Bạn cần đăng nhập để xem tin đăng của mình."
          : axiosError?.response?.status === 404
          ? "Không tìm thấy tin đăng nào."
          : axiosError?.response?.data?.message || "Không thể tải danh sách tin đăng. Vui lòng thử lại sau.";
      console.error("Failed to fetch listings:", err);
      setError(errorMessage);
      setListings([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, pagination.currentPage]);

  useEffect(() => {
    if (user) {
      fetchMyListings();
    }
  }, [fetchMyListings, user]);

  // Check for payment success message from navigation state
  useEffect(() => {
    const state = location.state as { paymentSuccess?: boolean; message?: string } | null;
    if (state?.paymentSuccess && state?.message) {
      setSuccessMessage(state.message);
      // Clear state to prevent showing message on refresh
      navigate(location.pathname, { replace: true, state: {} });
      // Auto-hide message after 5 seconds
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [location.state, navigate, location.pathname]);

  const handleTabClick = (tab: ListingStatus) => {
    setActiveTab(tab);
    setPagination((p) => ({ ...p, currentPage: 1 })); // Reset to page 1 when changing tabs
  };

  if (!user) {
    return (
      <div className="my-listings-page container">
        <h1 className="page-title">Quản lý tin đăng</h1>
        <div className="error-message">
          <p>Bạn cần đăng nhập để xem tin đăng của mình.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-listings-page container">
      <h1 className="page-title">Quản lý tin đăng</h1>
      {successMessage && (
        <div className="success-notification">
          <CheckCircle size={20} />
          <span>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="close-notification"
            aria-label="Đóng thông báo"
          >
            <X size={16} />
          </button>
        </div>
      )}
      <div className="content-card">
        <div className="admin-tabs">
          <button
            className={activeTab === "active" ? "active" : ""}
            onClick={() => handleTabClick("active")}
          >
            Đang hiển thị
          </button>
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
            className={activeTab === "expired" ? "active" : ""}
            onClick={() => handleTabClick("expired")}
          >
            Hết hạn
          </button>
          <button
            className={activeTab === "sold" ? "active" : ""}
            onClick={() => handleTabClick("sold")}
          >
            Đã bán
          </button>
          <button
            className={activeTab === "rejected" ? "active" : ""}
            onClick={() => handleTabClick("rejected")}
          >
            Bị từ chối
          </button>
        </div>

        <div className="listings-list">
          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner">Đang tải...</div>
            </div>
          ) : error ? (
            <div className="error-message">
              <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>
              <button 
                onClick={() => fetchMyListings()}
                style={{ 
                  padding: '8px 16px', 
                  backgroundColor: '#007bff', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Thử lại
              </button>
            </div>
          ) : listings.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-title">Bạn chưa có tin đăng nào trong mục này.</p>
              <p className="empty-state-subtitle">Hãy thử chuyển sang tab khác hoặc tạo tin đăng mới.</p>
            </div>
          ) : (
            <>
              {listings.map((listing) => (
                <MyListingItem key={listing._id} product={listing} />
              ))}
              {pagination.totalPages > 1 && (
                <div className="pagination-wrapper">
                  <button
                    onClick={() => setPagination((p) => ({ ...p, currentPage: Math.max(1, p.currentPage - 1) }))}
                    disabled={pagination.currentPage === 1}
                    className="pagination-btn"
                  >
                    Trước
                  </button>
                  <span className="pagination-info">
                    Trang {pagination.currentPage} / {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPagination((p) => ({ ...p, currentPage: Math.min(p.totalPages, p.currentPage + 1) }))}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="pagination-btn"
                  >
                    Sau
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyListingsPage;
