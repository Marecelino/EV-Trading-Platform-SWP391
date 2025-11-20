// src/components/modals/AuctionDetailsModal/AuctionDetailsModal.tsx
import React, { useEffect } from 'react';
import { X, Calendar, DollarSign, MapPin, Image as ImageIcon, Users, Battery, Car, Package } from 'lucide-react';
import type { Auction } from '../../../types';
import './AuctionDetailsModal.scss';

interface AuctionDetailsModalProps {
  auction: Auction;
  isOpen: boolean;
  onClose: () => void;
}

const AuctionDetailsModal: React.FC<AuctionDetailsModalProps> = ({
  auction,
  isOpen,
  onClose,
}) => {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Helper functions
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price?: number) => {
    if (!price) return 'N/A';
    return price.toLocaleString('vi-VN') + ' ₫';
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      draft: 'Bản nháp',
      pending: 'Chờ duyệt',
      scheduled: 'Sắp diễn ra',
      live: 'Đang diễn ra',
      ended: 'Đã kết thúc',
      cancelled: 'Đã hủy',
    };
    return statusMap[status] || status;
  };

  const getConditionLabel = (condition?: string) => {
    const conditionMap: Record<string, string> = {
      new: 'Mới',
      like_new: 'Như mới',
      excellent: 'Xuất sắc',
      good: 'Tốt',
      fair: 'Khá',
      poor: 'Kém',
    };
    return conditionMap[condition || ''] || condition || 'N/A';
  };

  const getCategoryLabel = (category?: string) => {
    return category === 'ev' ? 'Xe điện' : category === 'battery' ? 'Pin' : category || 'N/A';
  };

  // Extract seller info
  const seller = auction.seller_id && typeof auction.seller_id === 'object'
    ? auction.seller_id
    : null;

  const sellerName = seller
    ? (seller as any).name || (seller as any).full_name || 'N/A'
    : 'N/A';
  const sellerEmail = seller ? (seller as any).email || 'N/A' : 'N/A';
  const sellerPhone = seller ? (seller as any).phone || 'N/A' : 'N/A';

  return (
    <div className="auction-detail-modal-overlay" onClick={onClose}>
      <div className="auction-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="auction-detail-modal__header">
          <div className="auction-detail-modal__header-content">
            <h2>{auction.title || 'Không có tiêu đề'}</h2>
            <p className="auction-detail-modal__id">ID: {auction._id}</p>
          </div>
          <button className="auction-detail-modal__close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="auction-detail-modal__content">
          {/* Images Section */}
          {auction.images && auction.images.length > 0 && (
            <div className="auction-detail-modal__section">
              <h3 className="auction-detail-modal__section-title">
                <ImageIcon size={20} />
                Hình ảnh ({auction.images.length})
              </h3>
              <div className="auction-detail-modal__images">
                {auction.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${auction.title} - ${index + 1}`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="auction-detail-modal__section">
            <h3 className="auction-detail-modal__section-title">Thông tin cơ bản</h3>
            <div className="auction-detail-modal__grid">
              <div className="auction-detail-modal__field">
                <label>Tiêu đề</label>
                <span>{auction.title || 'N/A'}</span>
              </div>
              <div className="auction-detail-modal__field">
                <label>Mô tả</label>
                <span>{auction.description || 'N/A'}</span>
              </div>
              <div className="auction-detail-modal__field">
                <label>Danh mục</label>
                <span>{getCategoryLabel(auction.category)}</span>
              </div>
              <div className="auction-detail-modal__field">
                <label>Tình trạng</label>
                <span>{getConditionLabel(auction.condition)}</span>
              </div>
              <div className="auction-detail-modal__field">
                <label>Trạng thái</label>
                <span className={`status-badge status--${auction.status}`}>
                  {getStatusLabel(auction.status)}
                </span>
              </div>
              <div className="auction-detail-modal__field">
                <label>Trạng thái thanh toán</label>
                <span>
                  {auction.payment_status === 'completed' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                </span>
              </div>
              <div className="auction-detail-modal__field">
                <label>Đã xác minh</label>
                <span>{auction.is_verified ? 'Có' : 'Không'}</span>
              </div>
              <div className="auction-detail-modal__field">
                <label>Nổi bật</label>
                <span>{auction.is_featured ? 'Có' : 'Không'}</span>
              </div>
            </div>
          </div>

          {/* Pricing Information */}
          <div className="auction-detail-modal__section">
            <h3 className="auction-detail-modal__section-title">
              <DollarSign size={20} />
              Thông tin giá
            </h3>
            <div className="auction-detail-modal__grid">
              <div className="auction-detail-modal__field">
                <label>Giá khởi điểm</label>
                <span className="price-value">{formatPrice(auction.starting_price)}</span>
              </div>
              <div className="auction-detail-modal__field">
                <label>Giá hiện tại</label>
                <span className="price-value price-current">{formatPrice(auction.current_price)}</span>
              </div>
              <div className="auction-detail-modal__field">
                <label>Bước giá tối thiểu</label>
                <span className="price-value">{formatPrice(auction.min_increment)}</span>
              </div>
              {auction.buy_now_price && (
                <div className="auction-detail-modal__field">
                  <label>Giá mua ngay</label>
                  <span className="price-value price-buy-now">{formatPrice(auction.buy_now_price)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Timing Information */}
          <div className="auction-detail-modal__section">
            <h3 className="auction-detail-modal__section-title">
              <Calendar size={20} />
              Thông tin thời gian
            </h3>
            <div className="auction-detail-modal__grid">
              <div className="auction-detail-modal__field">
                <label>Thời gian bắt đầu</label>
                <span>{formatDate(auction.start_time)}</span>
              </div>
              <div className="auction-detail-modal__field">
                <label>Thời gian kết thúc</label>
                <span>{formatDate(auction.end_time)}</span>
              </div>
              <div className="auction-detail-modal__field">
                <label>Ngày tạo</label>
                <span>{formatDate(auction.createdAt)}</span>
              </div>
              <div className="auction-detail-modal__field">
                <label>Ngày cập nhật</label>
                <span>{formatDate(auction.updatedAt)}</span>
              </div>
            </div>
          </div>

          {/* Location */}
          {auction.location && (
            <div className="auction-detail-modal__section">
              <h3 className="auction-detail-modal__section-title">
                <MapPin size={20} />
                Địa điểm
              </h3>
              <div className="auction-detail-modal__field">
                <span>{auction.location}</span>
              </div>
            </div>
          )}

          {/* Seller Information */}
          <div className="auction-detail-modal__section">
            <h3 className="auction-detail-modal__section-title">
              <Users size={20} />
              Thông tin người bán
            </h3>
            <div className="auction-detail-modal__grid">
              <div className="auction-detail-modal__field">
                <label>Tên</label>
                <span>{sellerName}</span>
              </div>
              <div className="auction-detail-modal__field">
                <label>Email</label>
                <span>{sellerEmail}</span>
              </div>
              <div className="auction-detail-modal__field">
                <label>Số điện thoại</label>
                <span>{sellerPhone}</span>
              </div>
            </div>
          </div>

          {/* Category-specific Details */}
          {auction.category === 'ev' && auction.evDetail && (
            <div className="auction-detail-modal__section">
              <h3 className="auction-detail-modal__section-title">
                <Car size={20} />
                Chi tiết xe điện
              </h3>
              <div className="auction-detail-modal__grid">
                {auction.evDetail.battery_capacity_kwh && (
                  <div className="auction-detail-modal__field">
                    <label>Dung lượng pin (kWh)</label>
                    <span>{auction.evDetail.battery_capacity_kwh} kWh</span>
                  </div>
                )}
                {auction.evDetail.mileage_km && (
                  <div className="auction-detail-modal__field">
                    <label>Số km đã đi</label>
                    <span>{auction.evDetail.mileage_km.toLocaleString('vi-VN')} km</span>
                  </div>
                )}
                {auction.evDetail.range_km && (
                  <div className="auction-detail-modal__field">
                    <label>Quãng đường (km)</label>
                    <span>{auction.evDetail.range_km} km</span>
                  </div>
                )}
                {auction.evDetail.year && (
                  <div className="auction-detail-modal__field">
                    <label>Năm sản xuất</label>
                    <span>{auction.evDetail.year}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {auction.category === 'battery' && auction.batteryDetail && (
            <div className="auction-detail-modal__section">
              <h3 className="auction-detail-modal__section-title">
                <Battery size={20} />
                Chi tiết pin
              </h3>
              <div className="auction-detail-modal__grid">
                {auction.batteryDetail.capacity_kwh && (
                  <div className="auction-detail-modal__field">
                    <label>Dung lượng (kWh)</label>
                    <span>{auction.batteryDetail.capacity_kwh} kWh</span>
                  </div>
                )}
                {auction.batteryDetail.soh_percent !== undefined && (
                  <div className="auction-detail-modal__field">
                    <label>SOH (%)</label>
                    <span>{auction.batteryDetail.soh_percent}%</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bids Section */}
          <div className="auction-detail-modal__section">
            <h3 className="auction-detail-modal__section-title">
              <Package size={20} />
              Lịch sử đấu giá ({auction.bids?.length || 0})
            </h3>
            {auction.bids && auction.bids.length > 0 ? (
              <div className="auction-detail-modal__bids">
                <table className="bids-table">
                  <thead>
                    <tr>
                      <th>STT</th>
                      <th>Người đấu giá</th>
                      <th>Số tiền</th>
                      <th>Thời gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auction.bids
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((bid, index) => {
                        const bidder = bid.user_id && typeof bid.user_id === 'object'
                          ? bid.user_id
                          : null;
                        const bidderName = bidder
                          ? (bidder as any).name || (bidder as any).full_name || 'N/A'
                          : 'N/A';
                        const bidderEmail = bidder ? (bidder as any).email || 'N/A' : 'N/A';
                        const bidKey = (bid as any)._id || `bid-${index}-${bid.created_at}`;

                        return (
                          <tr key={bidKey}>
                            <td>{index + 1}</td>
                            <td>
                              <div>
                                <strong>{bidderName}</strong>
                                <br />
                                <small>{bidderEmail}</small>
                              </div>
                            </td>
                            <td className="bid-amount">{formatPrice(bid.amount)}</td>
                            <td>{formatDate(bid.created_at)}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="no-bids">Chưa có lượt đấu giá nào</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionDetailsModal;

