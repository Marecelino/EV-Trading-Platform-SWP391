import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import auctionApi from "../../api/auctionApi";
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
  const fetchAuctionData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await auctionApi.getAuctionById(id);
      
      console.log("=== AUCTION DETAIL API RESPONSE ===");
      console.log("Full response:", res);
      console.log("Response data:", res.data);
      
      // Handle both res.data.success format and direct data format
      let auctionResponseData;
      if (res.data?.success && res.data?.data) {
        auctionResponseData = res.data.data;
      } else if (res.data) {
        auctionResponseData = res.data;
      } else {
        console.warn("AuctionDetailPage: Invalid response structure", res);
        setAuctionData(null);
        return;
      }

      // Check if backend returns flattened auction data (with title, images, etc. directly on auction)
      // Or nested listing object
      const hasNestedListing = auctionResponseData.listing && typeof auctionResponseData.listing === 'object';
      const hasFlattenedData = auctionResponseData.title || auctionResponseData.images;

      let listing: ListingData;
      let auction: Auction;

      if (hasNestedListing) {
        // Backend returns nested listing object
        const { listing: nestedListing, ...auctionDetails } = auctionResponseData;
        listing = nestedListing;
        auction = auctionDetails as Auction;
      } else if (hasFlattenedData) {
        // Backend returns flattened data - construct listing from auction data
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
          model_id: "" as any,
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
        
        // Extract auction details (exclude listing fields)
        const { title: _title, description: _desc, images: _images, category: _cat, 
                condition: _cond, location: _loc, brand_id: _brand, is_verified: _verified, 
                is_featured: _featured, evDetail: _evDetail, batteryDetail: _batteryDetail, ...auctionDetails } = auctionResponseData;
        auction = auctionDetails as Auction;
      } else {
        console.warn(
          "AuctionDetailPage: Missing listing data for auction",
          id,
          "Response:",
          auctionResponseData
        );
        setAuctionData(null);
        return;
      }

      setAuctionData({
        auction,
        listing,
      });
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu đấu giá:", error);
      setAuctionData(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);
  //...

  useEffect(() => {
    fetchAuctionData();
  }, [fetchAuctionData]);

  const handleBidPlaced = async (amount: number) => {
    if (!id) return;
    try {
      // CRITICAL FIX: placeBid expects { amount: number } object, not just number
      await auctionApi.placeBid(id, { amount });

      await fetchAuctionData(); // Tải lại để có giá mới nhất
    } catch (error) {
      await fetchAuctionData();
      throw error;
    }
  };

  const handleBuyNow = () => {
    if (window.confirm("Bạn có chắc muốn mua ngay sản phẩm này?")) {
      alert("Chức năng Mua ngay đang được phát triển!");
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
