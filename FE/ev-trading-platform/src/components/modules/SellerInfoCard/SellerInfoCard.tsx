// src/components/modules/SellerInfoCard/SellerInfoCard.tsx
import React, { useState } from 'react';
import { Phone, ShoppingCart, X, AlertCircle, Loader } from 'lucide-react';
import type { User, Product } from '../../../types';
import Button from '../../common/Button/Button';
import { useAuth } from '../../../contexts/AuthContext';
import paymentApi from '../../../api/paymentApi';
import './SellerInfoCard.scss';
import StarRating from '../../common/StarRating/StarRating'; 

interface SellerInfoCardProps {
  seller: User;
  product?: Product;
}

const SellerInfoCard: React.FC<SellerInfoCardProps> = ({ seller, product }) => {
  const { user } = useAuth();
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isBuying, setIsBuying] = useState(false);

  // Debug: Log product and button state
  React.useEffect(() => {
    console.log('=== SellerInfoCard Render ===');
    console.log('Product:', product);
    console.log('Product status:', product?.status);
    console.log('User:', user);
    const isDisabled = isBuying || !product || product.status !== 'active';
    console.log('Buy Now button disabled:', isDisabled);
    if (isDisabled) {
      console.log('Reason:', {
        isBuying,
        noProduct: !product,
        statusNotActive: product?.status !== 'active',
        currentStatus: product?.status
      });
    }
  }, [product, user, isBuying]);

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
  const handleBuyNow = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent event propagation
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    console.log('=== handleBuyNow called ===');
    console.log('User:', user);
    console.log('Product:', product);
    console.log('Product status:', product?.status);

    // Check if user is logged in
    if (!user) {
      console.log('User not logged in');
      setErrorMessage('Vui lòng đăng nhập để thực hiện mua hàng');
      setShowErrorModal(true);
      return;
    }

    // Check if product is available
    if (!product) {
      console.log('Product not available');
      setErrorMessage('Không tìm thấy thông tin sản phẩm');
      setShowErrorModal(true);
      return;
    }

    // Check if listing is active
    if (product.status !== 'active') {
      console.log('Product status is not active:', product.status);
      setErrorMessage('Sản phẩm không còn khả dụng để mua');
      setShowErrorModal(true);
      return;
    }

    // Check if buyer is not seller
    const sellerId = typeof product.seller_id === 'string' ? product.seller_id : product.seller_id._id;
    if (user._id === sellerId) {
      setErrorMessage('Bạn không thể mua sản phẩm của chính mình');
      setShowErrorModal(true);
      return;
    }

    // Create payment URL
    console.log('Creating payment URL for listing:', product._id);
    setIsBuying(true);
    try {
      const paymentData = {
        listing_id: product._id,
        amount: product.price,
        payment_method: 'VNPAY',
      };
      console.log('Payment request data:', paymentData);
      
      const response = await paymentApi.createListingPaymentUrl(paymentData);
      console.log('Payment API response:', response);

      const data = response.data;
      
      // Handle response structure
      let paymentUrl: string;
      if (typeof data === 'object' && data !== null) {
        if ('data' in data && data.data && typeof data.data === 'object') {
          paymentUrl = (data.data as { paymentUrl?: string }).paymentUrl || '';
        } else if ('paymentUrl' in data) {
          paymentUrl = (data as { paymentUrl: string }).paymentUrl;
        } else {
          throw new Error('Invalid response format');
        }
      } else {
        throw new Error('Invalid response format');
      }

      if (!paymentUrl) {
        throw new Error('Không nhận được link thanh toán');
      }

      console.log('Payment URL received, redirecting to:', paymentUrl);
      // Redirect to VNPay
      window.location.href = paymentUrl;
    } catch (error: unknown) {
      console.error('Error creating payment:', error);
      setIsBuying(false);
      
      // Handle specific error cases
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { message?: string; error?: string } } };
        const status = axiosError.response?.status;
        const message = axiosError.response?.data?.message || axiosError.response?.data?.error || 'Có lỗi xảy ra khi tạo thanh toán';
        
        if (status === 401) {
          setErrorMessage('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại');
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } else if (status === 404) {
          setErrorMessage('Không tìm thấy sản phẩm');
        } else if (status === 400) {
          setErrorMessage(message || 'Dữ liệu không hợp lệ. Vui lòng thử lại');
        } else {
          setErrorMessage(message || 'Có lỗi xảy ra. Vui lòng thử lại sau');
        }
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Không thể kết nối đến server. Vui lòng thử lại sau';
        setErrorMessage(errorMessage);
      }
      
      setShowErrorModal(true);
    }
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
            onClick={(e) => {
              console.log('Buy Now button clicked');
              console.log('Button disabled state:', isBuying || !product || product?.status !== 'active');
              console.log('isBuying:', isBuying);
              console.log('product:', product);
              console.log('product.status:', product?.status);
              handleBuyNow(e);
            }}
            className="buy-now-btn"
            disabled={isBuying || !product || product.status !== 'active'}
            title={!product ? 'Sản phẩm không có sẵn' : product.status !== 'active' ? `Trạng thái: ${product.status}` : 'Mua ngay'}
          >
            {isBuying ? (
              <>
                <Loader size={18} className="spinner" /> Đang xử lý...
              </>
            ) : (
              <>
                <ShoppingCart size={18} /> Mua ngay
              </>
            )}
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

      {/* Error Modal - Show when buy now fails */}
      {showErrorModal && (
        <div className="phone-modal-overlay" onClick={() => setShowErrorModal(false)}>
          <div className="phone-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="phone-modal-header">
              <h3>Lỗi</h3>
              <button 
                className="phone-modal-close" 
                onClick={() => setShowErrorModal(false)}
                aria-label="Đóng"
              >
                <X size={20} />
              </button>
            </div>
            <div className="phone-modal-body">
              <div className="login-prompt">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <AlertCircle size={24} style={{ color: '#ef4444' }} />
                  <p className="login-message" style={{ margin: 0 }}>
                    {errorMessage}
                  </p>
                </div>
                <div className="login-actions">
                  <Button 
                    variant="primary"
                    onClick={() => setShowErrorModal(false)}
                  >
                    Đóng
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