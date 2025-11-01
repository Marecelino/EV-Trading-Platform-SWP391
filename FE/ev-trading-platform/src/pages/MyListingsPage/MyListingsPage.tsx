// src/pages/MyListingsPage/MyListingsPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import listingApi from "../../api/listingApi";
import type { Product } from "../../types";
import "./MyListingsPage.scss";
import MyListingItem from "../../components/modules/MyListingItem/MyListingItem";
import { useAuth } from "../../contexts/AuthContext";

type ListingStatus = "active" | "pending" | "rejected" | "expired";

const MyListingsPage: React.FC = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ListingStatus>("active");
  const [error, setError] = useState<string | null>(null);

  // Helper function to extract listings from response
  const extractListings = (responseData: unknown): Product[] => {
    if (Array.isArray(responseData)) {
      return responseData;
    } else if (responseData && typeof responseData === 'object' && 'data' in responseData && Array.isArray(responseData.data)) {
      return responseData.data;
    }
    return [];
  };

  // Helper function to filter listings by status
  const filterListingsByStatus = (listings: Product[], status: ListingStatus): Product[] => {
    const statusMap: Record<ListingStatus, Product["status"] | null> = {
      active: 'active',
      pending: 'pending',
      rejected: 'rejected',
      expired: null
    };
    
    const apiStatus = statusMap[status];
    return listings.filter((listing: Product) => {
      if (status === 'expired') {
        return listing.status === 'sold';
      }
      if (apiStatus === null) {
        return false;
      }
      return listing.status === apiStatus;
    });
  };

  const fetchMyListings = useCallback(async (status: ListingStatus) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Try primary endpoint first
      let fetchedListings: Product[] = [];
      
      try {
        const response = await listingApi.getMyListings();
        fetchedListings = extractListings(response.data);
      } catch (primaryError: unknown) {
        // Check if it's a 500 error and we have user ID for fallback
        const axiosError = primaryError as { response?: { status?: number } };
        const is500Error = axiosError?.response?.status === 500;
        
        if (is500Error && user?._id) {
          // Fallback to getListingsBySeller
          console.warn("getMyListings failed with 500, trying fallback getListingsBySeller");
          try {
            const fallbackResponse = await listingApi.getListingsBySeller(user._id);
            fetchedListings = extractListings(fallbackResponse.data);
          } catch (fallbackError) {
            console.error("Fallback also failed:", fallbackError);
            throw new Error("Không thể tải danh sách tin đăng. Vui lòng thử lại sau.");
          }
        } else {
          // For non-500 errors or when no user ID, throw appropriate error
          const errorMessage = 
            axiosError?.response?.status === 401 
              ? "Bạn cần đăng nhập để xem tin đăng của mình."
              : axiosError?.response?.status === 404
              ? "Không tìm thấy tin đăng nào."
              : "Không thể tải danh sách tin đăng. Vui lòng thử lại sau.";
          throw new Error(errorMessage);
        }
      }
      
      // Filter client-side by status
      const filtered = filterListingsByStatus(fetchedListings, status);
      setListings(filtered);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Đã có lỗi xảy ra khi tải danh sách tin đăng.";
      console.error("Failed to fetch listings:", err);
      setError(errorMessage);
      setListings([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMyListings(activeTab);
  }, [activeTab, fetchMyListings]);

  return (
    <div className="my-listings-page container">
      <h1 className="page-title">Quản lý tin đăng</h1>
      <div className="content-card">
        <div className="admin-tabs">
          <button
            className={activeTab === "active" ? "active" : ""}
            onClick={() => setActiveTab("active")}
          >
            Đang hiển thị
          </button>
          <button
            className={activeTab === "pending" ? "active" : ""}
            onClick={() => setActiveTab("pending")}
          >
            Chờ duyệt
          </button>
          <button
            className={activeTab === "expired" ? "active" : ""}
            onClick={() => setActiveTab("expired")}
          >
            Hết hạn
          </button>
          <button
            className={activeTab === "rejected" ? "active" : ""}
            onClick={() => setActiveTab("rejected")}
          >
            Bị từ chối
          </button>
        </div>

        <div className="listings-list">
          {isLoading ? (
            <p>Đang tải...</p>
          ) : error ? (
            <div className="error-message">
              <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>
              <button 
                onClick={() => fetchMyListings(activeTab)}
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
            <p>Bạn chưa có tin đăng nào trong mục này.</p>
          ) : (
            listings.map((listing) => (
              <MyListingItem key={listing._id} product={listing} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MyListingsPage;
