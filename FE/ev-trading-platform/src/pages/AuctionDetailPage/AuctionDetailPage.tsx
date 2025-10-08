// src/pages/AuctionDetailPage/AuctionDetailPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import auctionApi from '../../api/auctionApi';
import type { Auction, Product as ListingData } from '../../types';

// Import các component cần thiết
import ImageGallery from '../../components/modules/ImageGallery/ImageGallery';
import SpecificationTable from '../../components/modules/SpecificationTable/SpecificationTable';
import SellerInfoCard from '../../components/modules/SellerInfoCard/SellerInfoCard';
import AuctionStatusPanel from '../../components/modules/AuctionStatusPanel/AuctionStatusPanel';
import BidHistory from '../../components/modules/BidHistory/BidHistory';

import './AuctionDetailPage.scss';

interface AuctionData {
  listing: ListingData;
  auction: Auction;
}

const AuctionDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [auctionData, setAuctionData] = useState<AuctionData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchAuctionData = useCallback(async () => {
        if (!id) return;
        try {
            const res = await auctionApi.getAuctionById(id);
            if (res.data.success) {
                setAuctionData({
                    auction: res.data.data,
                    listing: res.data.data.listing, // API mock trả về listing lồng trong auction
                });
            }
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu đấu giá:", error);
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchAuctionData();
    }, [fetchAuctionData]);

    const handleBidPlaced = async (amount: number) => {
        if (!id) return;
        try {
            await auctionApi.placeBid(id, amount);
            // Sau khi đặt giá thành công, tải lại toàn bộ dữ liệu để cập nhật
            alert('Đặt giá thành công!');
            fetchAuctionData();
        } catch (error) {
            alert('Đặt giá thất bại, giá có thể đã thay đổi.');
        }
    };
    
    const handleBuyNow = () => {
        alert('Chức năng Mua ngay đang được phát triển!');
    };

    if (isLoading) return <div className="page-loading container">Đang tải phiên đấu giá...</div>;
    if (!auctionData) return <div className="page-loading container">Không tìm thấy phiên đấu giá.</div>;

    const { listing, auction } = auctionData;
    const details = listing.ev_details || listing.battery_details;

    return (
        <div className="auction-detail-page container">
            <div className="main-content">
                <div className="content-card">
                    <h1>{listing.title}</h1>
                    <span className="auction-label">Sản phẩm đang được đấu giá</span>
                </div>
                <ImageGallery images={listing.images} />
                <div className="content-card">
                    <h2>Mô tả chi tiết</h2>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{listing.description}</p>
                </div>
                {details && (
                    <div className="content-card">
                        <SpecificationTable details={details} />
                    </div>
                )}
            </div>
            <aside className="sidebar">
                <AuctionStatusPanel auction={auction} onBidPlaced={handleBidPlaced} onBuyNow={handleBuyNow} />
                <BidHistory bids={auction.bids} />
                {typeof listing.seller_id === 'object' && <SellerInfoCard seller={listing.seller_id} />}
            </aside>
        </div>
    );
};

export default AuctionDetailPage;