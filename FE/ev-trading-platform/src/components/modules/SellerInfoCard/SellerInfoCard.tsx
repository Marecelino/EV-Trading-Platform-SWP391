// src/components/modules/SellerInfoCard/SellerInfoCard.tsx
import React, { useState } from 'react';
import { Phone, ShoppingCart, X } from 'lucide-react';
import type { User } from '../../../types';
import Button from '../../common/Button/Button';
import { useAuth } from '../../../contexts/AuthContext';
import './SellerInfoCard.scss';
import StarRating from '../../common/StarRating/StarRating'; 

interface SellerInfoCardProps {
  seller: User;
}

const SellerInfoCard: React.FC<SellerInfoCardProps> = ({ seller }) => {
  const { user } = useAuth();
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Format phone number: Show first 3 digits, then "..." 
  const getMaskedPhone = (phone?: string): string => {
    if (!phone) return 'Chưa cập nhật';
    if (phone.length <= 6) return phone;
    return `${phone.substring(0, 3)}...`;
  };

  // Handle show phone button click
  const handleShowPhone = () => {
    if (!user) {
      // User not logged in - show login prompt modal
      setShowLoginModal(true);
      return;
    }

    // User is logged in - show phone number modal
    setShowPhoneModal(true);
  };

  // Handle buy now action
  const handleBuyNow = () => {
    // TODO: Implement buy now functionality
    // This could redirect to checkout or open a purchase modal
    alert('Tính năng "Mua ngay" sẽ được triển khai sớm!');
  };

  return (
    <>
      <div className="seller-card content-card">
        <div className="seller-card__header">
          <img src={seller.avatar_url || 'https://i.pravatar.cc/150'} alt={seller.full_name} className="seller-card__avatar" />
          <div className="seller-card__info">
            <span className="seller-card__name">{seller.full_name}</span>
            <span className="seller-card__status">Cá nhân</span>
          </div>
        </div>
        <div className="seller-card__rating">
          {seller.rating ? (
            <StarRating rating={seller.rating.average} count={seller.rating.count} />
          ) : (
            <p className="no-rating">Người bán chưa có đánh giá</p>
          )}
        </div>
        <div className="seller-card__actions">
          <Button 
            variant="primary" 
            style={{ flex: 1 }}
            onClick={handleShowPhone}
            className="show-phone-btn"
          >
            <Phone size={18} /> {getMaskedPhone(seller.phone)} Hiện số
          </Button>
          <Button 
            variant="outline" 
            style={{ flex: 1 }}
            onClick={handleBuyNow}
            className="buy-now-btn"
          >
            <ShoppingCart size={18} /> Mua ngay
          </Button>
        </div>
      </div>

      {/* Phone Number Modal - Show when user is logged in */}
      {showPhoneModal && (
        <div className="phone-modal-overlay" onClick={() => setShowPhoneModal(false)}>
          <div className="phone-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="phone-modal-header">
              <h3>Số điện thoại người bán</h3>
              <button 
                className="phone-modal-close" 
                onClick={() => setShowPhoneModal(false)}
                aria-label="Đóng"
              >
                <X size={20} />
              </button>
            </div>
            <div className="phone-modal-body">
              <div className="phone-number-display">
                <Phone size={32} className="phone-icon" />
                <div className="phone-number">
                  {seller.phone ? (
                    <>
                      <span className="phone-value">{seller.phone}</span>
                      <a 
                        href={`tel:${seller.phone}`} 
                        className="phone-call-link"
                        onClick={() => setShowPhoneModal(false)}
                      >
                        Gọi ngay
                      </a>
                    </>
                  ) : (
                    <span className="phone-empty">Người bán chưa cập nhật số điện thoại</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Login Required Modal - Show when user is not logged in */}
      {showLoginModal && (
        <div className="phone-modal-overlay" onClick={() => setShowLoginModal(false)}>
          <div className="phone-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="phone-modal-header">
              <h3>Yêu cầu đăng nhập</h3>
              <button 
                className="phone-modal-close" 
                onClick={() => setShowLoginModal(false)}
                aria-label="Đóng"
              >
                <X size={20} />
              </button>
            </div>
            <div className="phone-modal-body">
              <div className="login-prompt">
                <p className="login-message">
                  Vui lòng đăng nhập để xem SĐT của người bán
                </p>
                <div className="login-actions">
                  <Button 
                    variant="primary"
                    onClick={() => {
                      setShowLoginModal(false);
                      window.location.href = '/login';
                    }}
                  >
                    Đăng nhập
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowLoginModal(false)}
                  >
                    Hủy
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SellerInfoCard;