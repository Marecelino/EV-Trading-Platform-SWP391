// src/components/modals/PaymentModal/PaymentModal.tsx
import React, { useState } from 'react';
import { CreditCard, X } from 'lucide-react';
import Button from '../../common/Button/Button';
import './PaymentModal.scss';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  feeInfo: {
    listing_fee_id: string;
    amount_due: number;
  };
  onPaymentSuccess: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, feeInfo, onPaymentSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    setIsLoading(true);
    // Gọi API để xử lý thanh toán
    try {
        // Tạm thời, chúng ta sẽ tạo một API service cho payment
        // const response = await paymentApi.processListingFee(feeInfo.listing_fee_id);
        
        // Mô phỏng API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        alert("Thanh toán thành công!");
        onPaymentSuccess();
    } catch (error) {
        alert("Thanh toán thất bại!");
    } finally {
        setIsLoading(false);
    }
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
          <p>Để hoàn tất đăng tin, bạn cần thanh toán một khoản phí.</p>
          <div className="fee-details">
            <span>Phí đăng tin</span>
            <span className="amount">{feeInfo.amount_due.toLocaleString('vi-VN')} ₫</span>
          </div>
          <div className="payment-methods">
            {/* Trong tương lai có thể thêm các phương thức thanh toán khác ở đây */}
          </div>
        </div>
        <div className="modal-footer">
          <Button variant="primary" onClick={handlePayment} disabled={isLoading}>
            <CreditCard size={18} />
            {isLoading ? 'Đang xử lý...' : `Thanh toán ${feeInfo.amount_due.toLocaleString('vi-VN')} ₫`}
          </Button>
        </div>
      </div>
    </div>
  );
};
export default PaymentModal;