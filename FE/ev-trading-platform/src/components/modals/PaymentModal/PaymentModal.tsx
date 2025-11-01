// src/components/modals/PaymentModal/PaymentModal.tsx
import React, { useState } from 'react';
import { CreditCard, X } from 'lucide-react';
import Button from '../../common/Button/Button';
import './PaymentModal.scss';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  feeInfo: {
    paymentId: string;
    amount: number;
    paymentUrl: string;
  };
  onPaymentSuccess?: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, feeInfo, onPaymentSuccess }) => {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handlePayment = () => {
    if (!feeInfo.paymentUrl) {
      alert("Không tìm thấy link thanh toán. Vui lòng thử lại.");
      return;
    }

    // Set redirecting state
    setIsRedirecting(true);
    
    // Redirect to VNPay payment URL
    // VNPay will handle the payment and redirect back to our callback URL
    window.location.href = feeInfo.paymentUrl;
    
    // Note: onPaymentSuccess will be called from PaymentCallbackPage after payment
    // This modal will close when user redirects to VNPay
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content payment-modal">
        <div className="modal-header">
          <h3>Xác nhận thanh toán</h3>
          <button onClick={onClose} className="close-btn"><X /></button>
        </div>
        <div className="modal-body">
          <p>Để hoàn tất đăng tin, bạn cần thanh toán phí đăng tin. Sau khi thanh toán thành công, tin đăng của bạn sẽ được kích hoạt.</p>
          <div className="fee-details">
            <div className="fee-row">
              <span className="label">Phí đăng tin</span>
              <span className="amount">{feeInfo.amount.toLocaleString('vi-VN')} ₫</span>
            </div>
          </div>
          <div className="payment-methods">
            <h4>Phương thức thanh toán</h4>
            <div className="method-list">
              <div className="method-item selected">
                <div className="method-icon">🏦</div>
                <div className="method-info">
                  <div className="method-name">VNPay</div>
                  <div className="method-desc">Thanh toán qua cổng VNPay (ngân hàng, ví điện tử)</div>
                </div>
                <div className="radio-indicator"></div>
              </div>
            </div>
          </div>
          <div className="security-notice">
            <p>🔒 Thanh toán được bảo mật bởi VNPay. Thông tin thanh toán của bạn được mã hóa và an toàn.</p>
          </div>
        </div>
        <div className="modal-footer">
          <Button variant="primary" onClick={handlePayment} disabled={isRedirecting || !feeInfo.paymentUrl}>
            <CreditCard size={18} />
            {isRedirecting ? 'Đang chuyển hướng...' : `Thanh toán ${feeInfo.amount.toLocaleString('vi-VN')} ₫`}
          </Button>
          {!isRedirecting && (
            <button type="button" onClick={onClose} className="cancel-btn">
              Thanh toán sau
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
export default PaymentModal;