import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import auctionApi from "../../api/auctionApi";
import paymentApi from "../../api/paymentApi";
import type { Auction, Product as ListingData } from "../../types";

// Import các component cần thiết
import ImageGallery from "../../components/modules/ImageGallery/ImageGallery";
import SpecificationTable from "../../components/modules/SpecificationTable/SpecificationTable";
import SellerInfoCard from "../../components/modules/SellerInfoCard/SellerInfoCard";
import AuctionStatusPanel from "../../components/modules/AuctionStatusPanel/AuctionStatusPanel";
import BidHistory from "../../components/modules/BidHistory/BidHistory";

import "./AuctionDetailPage.scss";

interface AuctionPageData {
  listing: ListingData;
  auction: Auction;
}

const AuctionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [auctionData, setAuctionData] = useState<AuctionPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  //...
  // Use useRef to prevent multiple simultaneous fetches
  const isFetchingRef = useRef(false);

  // Add isInitialLoad parameter to control loading state
  // Only show loading spinner on initial load, not during polling (silent background updates)
  const fetchAuctionData = useCallback(async (isInitialLoad = false) => {
    if (!id) return;
    
    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) {
      return;
    }
    
    isFetchingRef.current = true;
    
    // CHỈ set loading cho lần tải đầu tiên
    // Polling sẽ cập nhật dữ liệu trong nền mà không hiển thị spinner
    if (isInitialLoad) {
      setIsLoading(true);
    }
    try {
      const res = await auctionApi.getAuctionById(id);
      
      console.log("=== AUCTION DETAIL API RESPONSE ===");
      console.log("Full response:", res);
      console.log("Response data:", res.data);
      console.log("Response data.data:", (res.data as { data?: unknown })?.data);
      
      // Handle various response structures from backend
      // Response formats:
      // 1. { success: true, data: {...auction...} }
      // 2. { data: {...auction...} }
      // 3. Direct auction object
      let auctionResponseData: Record<string, unknown> | null = null;
      
      const responseData = res.data as 
        | { success?: boolean; data?: Record<string, unknown> }
        | { data?: Record<string, unknown> }
        | Record<string, unknown>
        | null;
      
      if (!responseData || typeof responseData !== 'object') {
        console.warn("AuctionDetailPage: Invalid response data", res.data);
        setAuctionData(null);
        return;
      }
      
      // Try to extract auction data
      if ('success' in responseData && responseData.success && 'data' in responseData && responseData.data && typeof responseData.data === 'object') {
        // Format: { success: true, data: {...} }
        auctionResponseData = responseData.data as Record<string, unknown>;
      } else if ('data' in responseData && responseData.data && typeof responseData.data === 'object' && responseData.data !== null) {
        // Format: { data: {...} }
        auctionResponseData = responseData.data as Record<string, unknown>;
      } else {
        // Format: direct auction object (res.data is the auction itself)
        auctionResponseData = responseData as Record<string, unknown>;
      }

      // Validate that we have required fields
      if (!auctionResponseData || typeof auctionResponseData._id !== 'string') {
        console.warn("AuctionDetailPage: Missing required auction fields (_id)", {
          auctionResponseData,
          hasId: !!auctionResponseData?._id,
          idType: typeof auctionResponseData?._id
        });
        setAuctionData(null);
        return;
      }
      
      console.log("AuctionDetailPage: Extracted auction data:", {
        _id: auctionResponseData._id,
        title: auctionResponseData.title,
        hasTitle: !!auctionResponseData.title,
        hasImages: !!auctionResponseData.images,
        hasDescription: !!auctionResponseData.description
      });

      // Check if backend returns flattened auction data (with title, images, etc. directly on auction)
      // Or nested listing object
      const hasNestedListing = auctionResponseData.listing && typeof auctionResponseData.listing === 'object';
      // Check for flattened data - backend returns title, images, description directly on auction object
      const hasFlattenedData = !!(
        auctionResponseData.title || 
        auctionResponseData.images || 
        auctionResponseData.description ||
        auctionResponseData.category
      );
      
      console.log("AuctionDetailPage: hasNestedListing =", hasNestedListing, "hasFlattenedData =", hasFlattenedData);

      let listing: ListingData;
      let auction: Auction;

      if (hasNestedListing) {
        // Backend returns nested listing object
        const nestedListing = auctionResponseData.listing as Record<string, unknown>;
        // Extract auction details excluding listing
        const auctionDetails = { ...auctionResponseData };
        delete auctionDetails.listing;
        listing = nestedListing as unknown as ListingData;
        auction = {
          ...auctionDetails,
          _id: String(auctionDetails._id || ''),
          seller_id: auctionDetails.seller_id || null,
          start_time: String(auctionDetails.start_time || ''),
          end_time: String(auctionDetails.end_time || ''),
          starting_price: Number(auctionDetails.starting_price || 0),
          current_price: Number(auctionDetails.current_price || 0),
          min_increment: Number(auctionDetails.min_increment || 0),
          status: (auctionDetails.status as Auction['status']) || 'draft',
          bids: (Array.isArray(auctionDetails.bids) ? auctionDetails.bids : []) as Auction['bids'],
        } as Auction;
      } else if (hasFlattenedData) {
        // Backend returns flattened data - construct listing from auction data
        // Based on user's console output, all fields are present in auctionResponseData
        const images = Array.isArray(auctionResponseData.images) 
          ? auctionResponseData.images as string[]
          : (typeof auctionResponseData.images === 'string' ? [auctionResponseData.images] : []);
        
        listing = {
          _id: String(auctionResponseData._id),
          title: (auctionResponseData.title as string) || "Không có tiêu đề",
          description: (auctionResponseData.description as string) || "",
          images: images,
          price: Number(auctionResponseData.current_price || auctionResponseData.starting_price || 0),
          condition: (auctionResponseData.condition as ListingData['condition']) || "new",
          status: "active" as const,
          category: (auctionResponseData.category as ListingData['category']) || "ev",
          location: (auctionResponseData.location as string) || "",
          seller_id: auctionResponseData.seller_id || "",
          brand_id: auctionResponseData.brand_id || "",
          model_id: "",
          views: 0,
          is_verified: Boolean(auctionResponseData.is_verified),
          is_featured: Boolean(auctionResponseData.is_featured),
          listing_type: "auction" as const,
          auction_id: String(auctionResponseData._id),
          ev_details: auctionResponseData.evDetail as ListingData['ev_details'],
          evDetail: auctionResponseData.evDetail as ListingData['evDetail'],
          battery_details: auctionResponseData.batteryDetail as ListingData['battery_details'],
          batteryDetail: auctionResponseData.batteryDetail as ListingData['batteryDetail'],
        } as ListingData;
        
        // Extract auction details (exclude listing fields to avoid duplicates)
        // We destructure listing fields to exclude them, then construct auction from remaining fields
        const listingFields = { title: true, description: true, images: true, category: true, condition: true, location: true, brand_id: true, is_verified: true, is_featured: true, evDetail: true, batteryDetail: true };
        const auctionDetails = { ...auctionResponseData };
        // Remove listing fields from auctionDetails
        Object.keys(listingFields).forEach(key => {
          delete auctionDetails[key as keyof typeof auctionDetails];
        });
        // Create auction object with proper type casting
        auction = {
          ...auctionDetails,
          // Ensure required Auction fields are present with correct types
          _id: String(auctionResponseData._id || ''),
          seller_id: auctionResponseData.seller_id || null,
          start_time: String(auctionResponseData.start_time || ''),
          end_time: String(auctionResponseData.end_time || ''),
          starting_price: Number(auctionResponseData.starting_price || 0),
          current_price: Number(auctionResponseData.current_price || 0),
          min_increment: Number(auctionResponseData.min_increment || 0),
          buy_now_price: auctionResponseData.buy_now_price ? Number(auctionResponseData.buy_now_price) : undefined,
          status: (auctionResponseData.status as Auction['status']) || 'draft',
          payment_status: auctionResponseData.payment_status as Auction['payment_status'],
          bids: (Array.isArray(auctionResponseData.bids) ? auctionResponseData.bids : []) as Auction['bids'],
          winner_id: auctionResponseData.winner_id ? String(auctionResponseData.winner_id) : undefined,
          // Include flattened fields for backward compatibility
          title: auctionResponseData.title as string,
          description: auctionResponseData.description as string,
          images: Array.isArray(auctionResponseData.images) ? auctionResponseData.images as string[] : [],
          category: auctionResponseData.category as Auction['category'],
          condition: auctionResponseData.condition as Auction['condition'],
          location: auctionResponseData.location as string,
          brand_id: auctionResponseData.brand_id,
          evDetail: auctionResponseData.evDetail as Auction['evDetail'],
          batteryDetail: auctionResponseData.batteryDetail as Auction['batteryDetail'],
          is_verified: Boolean(auctionResponseData.is_verified),
          is_featured: Boolean(auctionResponseData.is_featured),
          createdAt: auctionResponseData.createdAt as string,
          updatedAt: auctionResponseData.updatedAt as string,
        } as Auction;
      } else {
        // If no title/images/description, construct minimal listing from available auction data
        console.warn(
          "AuctionDetailPage: No explicit listing fields found, constructing from auction data",
          id
        );
        listing = {
          _id: auctionResponseData._id,
          title: auctionResponseData.title || "Không có tiêu đề",
          description: auctionResponseData.description || "",
          images: auctionResponseData.images || [],
          price: auctionResponseData.current_price || auctionResponseData.starting_price || 0,
          condition: auctionResponseData.condition || "new",
          status: "active",
          category: auctionResponseData.category || "ev",
          location: auctionResponseData.location || "",
          seller_id: auctionResponseData.seller_id || "",
          brand_id: auctionResponseData.brand_id || "",
          model_id: "",
          views: 0,
          is_verified: auctionResponseData.is_verified || false,
          is_featured: auctionResponseData.is_featured || false,
          listing_type: "auction",
          auction_id: auctionResponseData._id,
          ev_details: auctionResponseData.evDetail || undefined,
          evDetail: auctionResponseData.evDetail || undefined,
          battery_details: auctionResponseData.batteryDetail || undefined,
          batteryDetail: auctionResponseData.batteryDetail || undefined,
        } as ListingData;
        
        // Create auction object from response data
        auction = {
          _id: auctionResponseData._id || '',
          seller_id: auctionResponseData.seller_id || null,
          start_time: auctionResponseData.start_time || '',
          end_time: auctionResponseData.end_time || '',
          starting_price: auctionResponseData.starting_price || 0,
          current_price: auctionResponseData.current_price || 0,
          min_increment: auctionResponseData.min_increment || 0,
          buy_now_price: auctionResponseData.buy_now_price,
          status: auctionResponseData.status || 'draft',
          payment_status: auctionResponseData.payment_status,
          bids: auctionResponseData.bids || [],
          winner_id: auctionResponseData.winner_id,
          // Include flattened fields
          title: auctionResponseData.title,
          description: auctionResponseData.description,
          images: auctionResponseData.images,
          category: auctionResponseData.category,
          condition: auctionResponseData.condition,
          location: auctionResponseData.location,
          brand_id: auctionResponseData.brand_id,
          evDetail: auctionResponseData.evDetail,
          batteryDetail: auctionResponseData.batteryDetail,
          is_verified: auctionResponseData.is_verified,
          is_featured: auctionResponseData.is_featured,
          createdAt: auctionResponseData.createdAt,
          updatedAt: auctionResponseData.updatedAt,
        } as Auction;
      }

      setAuctionData({
        auction,
        listing,
      });
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu đấu giá:", error);
      setAuctionData(null);
    } finally {
      // CHỈ tắt loading cho lần tải đầu tiên
      if (isInitialLoad) {
        setIsLoading(false);
      }
      isFetchingRef.current = false;
    }
  }, [id]); // Only depend on id to prevent recreation
  //...

  // Initial fetch when id changes
  // Truyền 'true' để báo cho fetchAuctionData biết đây là lần tải đầu tiên
  useEffect(() => {
    if (id) {
      fetchAuctionData(true); // Truyền 'true' cho lần tải đầu tiên -> sẽ hiển thị loading spinner
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // fetchAuctionData is stable (only depends on id), so safe to omit

  // Polling for live auctions - refresh every 5 seconds
  const pollingIntervalRef = useRef<number | null>(null);
  const fetchAuctionDataRef = useRef(fetchAuctionData);
  
  // Keep ref updated with latest fetchAuctionData function
  useEffect(() => {
    fetchAuctionDataRef.current = fetchAuctionData;
  }, [fetchAuctionData]);
  
  useEffect(() => {
    // Only poll if auction is live and we have an id
    if (auctionData?.auction.status === 'live' && id) {
      // Clear any existing interval first
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      
      // Start polling using ref to access latest function without adding to dependencies
      // Gọi bình thường (sẽ không truyền tham số = isInitialLoad = false mặc định)
      // -> Cập nhật dữ liệu trong nền mà không hiển thị loading spinner
      pollingIntervalRef.current = window.setInterval(() => {
        fetchAuctionDataRef.current(); // Không truyền tham số = isInitialLoad = false (mặc định)
      }, 5000); // Poll every 5 seconds
    } else {
      // Stop polling for non-live auctions
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [auctionData?.auction.status, id]); // Depend on status and id only

  const handleBidPlaced = async (amount: number, userId: string) => {
    if (!id) return;
    try {
      // Backend requires user_id in body
      await auctionApi.placeBid(id, { user_id: userId, amount });

      await fetchAuctionData(); // Tải lại để có giá mới nhất
    } catch (error) {
      await fetchAuctionData();
      throw error;
    }
  };

  // handleBuyNow is now handled by AuctionStatusPanel component
  const handleBuyNow = () => {
    // This is a placeholder - actual implementation is in AuctionStatusPanel
    // where it has access to user context
  };

  // Handle payment for winner after auction ended
  // According to backend: POST /api/payment/auction/create-payment-url
  // Requires: auction_id (required), amount? (must match current_price if provided), payment_method?, user_id?
  const handlePayment = async () => {
    if (!id || !auctionData?.auction) return;
    
    // Validate auction status
    if (auctionData.auction.status !== 'ended') {
      alert("Phiên đấu giá chưa kết thúc, không thể thanh toán.");
      return;
    }
    
    const amount = auctionData.auction.current_price;
    if (!amount || amount <= 0) {
      alert("Không thể xác định số tiền thanh toán. Vui lòng thử lại.");
      return;
    }
    
    try {
      const response = await paymentApi.createAuctionPaymentUrl({
        auction_id: id,
        amount: amount, // Amount must match auction.current_price
        payment_method: "VNPAY",
      });
      
      if (response.data?.paymentUrl) {
        // Redirect to payment URL (VNPay gateway)
        window.location.href = response.data.paymentUrl;
      } else {
        alert("Không thể tạo link thanh toán. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Error creating payment URL:", error);
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(errorMessage || "Đã có lỗi xảy ra khi tạo link thanh toán. Vui lòng thử lại.");
    }
  };

  if (isLoading)
    return (
      <div className="page-loading container">Đang tải phiên đấu giá...</div>
    );
  if (!auctionData)
    return (
      <div className="page-loading container">
        Không tìm thấy phiên đấu giá.
      </div>
    );

  const { listing, auction } = auctionData;
  const details = listing.ev_details || listing.battery_details;

  return (
    <div className="auction-detail-page container">
      <div className="main-content">
        <div className="content-card header-card">
          <h1>{listing.title}</h1>
          <span className="auction-label">Sản phẩm đang được đấu giá</span>
        </div>
        <div className="content-card">
          {listing.images && listing.images.length > 0 ? (
            <ImageGallery images={listing.images} />
          ) : (
            <div className="no-images">
              <p>Không có hình ảnh sản phẩm</p>
            </div>
          )}
        </div>
        <div className="content-card">
          <h2>Mô tả chi tiết</h2>
          <p style={{ whiteSpace: "pre-wrap" }}>{listing.description}</p>
        </div>
        {details && (
          <div className="content-card">
            <SpecificationTable details={details} />
          </div>
        )}
      </div>
      <aside className="sidebar">
        <AuctionStatusPanel
          auction={auction}
          onBidPlaced={handleBidPlaced}
          onBuyNow={handleBuyNow}
          onPayment={handlePayment}
        />
        <BidHistory bids={auction.bids} />
        {/* Đảm bảo seller_id đã được populate thành object User */}
        {typeof listing.seller_id === "object" && (
          <SellerInfoCard seller={listing.seller_id} />
        )}
      </aside>
    </div>
  );
};

export default AuctionDetailPage;
