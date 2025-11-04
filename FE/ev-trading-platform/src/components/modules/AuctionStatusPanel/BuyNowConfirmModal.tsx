// src/components/modules/AuctionStatusPanel/BuyNowConfirmModal.tsx
import React, { useEffect } from 'react';
import { X, ShoppingCart, AlertCircle } from 'lucide-react';
import Button from '../../common/Button/Button';
import './BuyNowConfirmModal.scss';

interface BuyNowConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  buyNowPrice: number;
  isLoading?: boolean;
}

const BuyNowConfirmModal: React.FC<BuyNowConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  buyNowPrice,
  isLoading = false,
}) => {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isLoading, onClose]);

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

  return (
    <div className="buy-now-confirm-modal-overlay" onClick={onClose}>
      <div className="buy-now-confirm-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="buy-now-confirm-modal-header">
          <h3>
            <ShoppingCart size={24} />
            Xác nhận mua ngay
          </h3>
          <button
            onClick={onClose}
            className="buy-now-confirm-modal-close"
            disabled={isLoading}
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        <div className="buy-now-confirm-modal-body">
          <div className="confirm-message">
            <p className="question">
              Bạn muốn mua sản phẩm với giá{' '}
              <span className="price-highlight">
                {buyNowPrice.toLocaleString('vi-VN')} ₫
              </span>{' '}
              phải không?
            </p>
            <div className="warning-info">
              <AlertCircle size={18} />
              <span>
                Sau khi xác nhận, phiên đấu giá sẽ kết thúc ngay lập tức và bạn sẽ được chuyển đến trang thanh toán.
              </span>
            </div>
          </div>

          <div className="price-display">
            <div className="price-label">Giá mua ngay</div>
            <div className="price-value">{buyNowPrice.toLocaleString('vi-VN')} ₫</div>
          </div>
        </div>

        <div className="buy-now-confirm-modal-footer">
          <Button
            variant="primary"
            onClick={onConfirm}
            disabled={isLoading}
            className="confirm-btn"
          >
            {isLoading ? (
              <>
                <span className="spinner" /> Đang xử lý...
              </>
            ) : (
              <>
                <ShoppingCart size={18} /> Có, mua ngay
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="cancel-btn"
          >
            Không, hủy bỏ
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BuyNowConfirmModal;

