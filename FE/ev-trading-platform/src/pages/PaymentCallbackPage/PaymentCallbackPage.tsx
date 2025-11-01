// src/pages/PaymentCallbackPage/PaymentCallbackPage.tsx
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Loader } from "lucide-react";
import paymentApi from "../../api/paymentApi";
import "./PaymentCallbackPage.scss";

type StatusState = "loading" | "success" | "failed" | "pending";

const statusMessages = {
  loading: "Đang xử lý thanh toán...",
  success: "Thanh toán thành công! Tin đăng của bạn đã được kích hoạt.",
  failed: "Thanh toán thất bại. Vui lòng thử lại.",
  pending: "Đang chờ xác nhận thanh toán...",
};

const PaymentCallbackPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<StatusState>("loading");
  const [message, setMessage] = useState(statusMessages.loading);
  const [paymentDetails, setPaymentDetails] = useState<{
    amount?: number;
    transactionId?: string;
  } | null>(null);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    // Extract query parameters from URL
    const params = new URLSearchParams(location.search);
    const vnp_ResponseCode = params.get("vnp_ResponseCode");
    const vnp_TxnRef = params.get("vnp_TxnRef");
    const vnp_Amount = params.get("vnp_Amount");
    const rspCode = params.get("rspCode"); // Backend response code
    const orderId = params.get("orderId"); // Backend order ID
    const message = params.get("message"); // Backend message

    // Check if we have backend response directly (from backend redirect)
    if (rspCode && orderId) {
      const amount = vnp_Amount ? parseInt(vnp_Amount) / 100 : undefined;
      
      setPaymentDetails({
        amount,
        transactionId: orderId,
      });

      // Backend already processed the payment
      if (rspCode === "00") {
        // Payment successful
        setStatus("success");
        setMessage(message || "Đã thanh toán thành công, tin đăng của bạn sẽ được duyệt trong chốc lát");
        // Redirect immediately to my-listings with success message
        const timerId = window.setTimeout(
          () => navigate("/dashboard/my-listings", { 
            replace: true,
            state: { 
              paymentSuccess: true,
              message: "Đã thanh toán thành công, tin đăng của bạn sẽ được duyệt trong chốc lát"
            }
          }),
          2000
        );
        timersRef.current.push(timerId);
      } else {
        // Payment failed
        setStatus("failed");
        setMessage(message || statusMessages.failed);
        const timerId = window.setTimeout(
          () => navigate("/dashboard/my-listings", { replace: true }),
          3000
        );
        timersRef.current.push(timerId);
      }

      return () => {
        timersRef.current.forEach((id) => window.clearTimeout(id));
        timersRef.current = [];
      };
    }

    // Handle VNPay direct callback (from frontend redirect URL)
    // Validate required parameters
    if (!vnp_TxnRef) {
      setStatus("failed");
      setMessage("Thiếu thông tin giao dịch. Vui lòng thử lại.");
      const timerId = window.setTimeout(
        () => navigate("/dashboard/my-listings"),
        3000
      );
      timersRef.current.push(timerId);
      return;
    }

    // Convert amount from VNPay format (amount * 100) to actual amount
    const amount = vnp_Amount ? parseInt(vnp_Amount) / 100 : undefined;

    setPaymentDetails({
      amount,
      transactionId: vnp_TxnRef,
    });

    // Prepare query params for backend
    const queryParams: Record<string, string> = {};
    params.forEach((value, key) => {
      queryParams[key] = value;
    });

    let cancelled = false;

    // Call backend to verify and process payment
    // Backend will verify signature, update payment status, and finalize if needed
    paymentApi
      .handleVNPayReturn(queryParams)
      .then((response) => {
        if (cancelled) return;

        const responseData = response.data as {
          success?: boolean;
          message?: string;
          rspCode?: string;
          orderId?: string;
          payment?: {
            status: string;
            amount: number;
          };
          status?: string;
        };

        // Check payment status - prioritize backend response code
        const successCode = responseData?.rspCode === "00" || vnp_ResponseCode === "00";
        
        if (successCode) {
          // Payment successful - backend should have updated payment status to COMPLETED
          setStatus("success");
          setMessage(responseData?.message || "Đã thanh toán thành công, tin đăng của bạn sẽ được duyệt trong chốc lát");
          // Redirect to my-listings with success message
          const timerId = window.setTimeout(
            () => navigate("/dashboard/my-listings", { 
              replace: true,
              state: { 
                paymentSuccess: true,
                message: "Đã thanh toán thành công, tin đăng của bạn sẽ được duyệt trong chốc lát"
              }
            }),
            2000
          );
          timersRef.current.push(timerId);
        } else {
          // Payment failed or cancelled
          setStatus("failed");
          const errorMessage =
            responseData?.message ||
            getVNPayErrorMessage(vnp_ResponseCode) ||
            statusMessages.failed;
          setMessage(errorMessage);
          // Auto-redirect after 3 seconds
          const timerId = window.setTimeout(
            () => navigate("/dashboard/my-listings", { replace: true }),
            3000
          );
          timersRef.current.push(timerId);
        }
      })
      .catch((error: Error) => {
        if (cancelled) return;

        console.error("Payment verification error:", error);
        setStatus("failed");
        setMessage(
          error.message || "Không thể xác minh thanh toán. Vui lòng liên hệ hỗ trợ."
        );
        // Auto-redirect after 3 seconds
        const timerId = window.setTimeout(
          () => navigate("/dashboard/my-listings", { replace: true }),
          3000
        );
        timersRef.current.push(timerId);
      });

    return () => {
      cancelled = true;
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    };
  }, [location.search, navigate]);

  const getVNPayErrorMessage = (code: string | null): string => {
    if (!code) return statusMessages.failed;

    const errorMap: Record<string, string> = {
      "07": "Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).",
      "09": "Thẻ/Tài khoản chưa đăng ký dịch vụ Internet Banking",
      "10": "Xác thực thông tin thẻ/tài khoản không đúng. Vui lòng thử lại quá 3 lần",
      "11": "Đã hết hạn chờ thanh toán. Vui lòng vui lòng thử lại.",
      "12": "Thẻ/Tài khoản bị khóa.",
      "13": "Nhập sai mật khẩu xác thực (OTP). Vui lòng thử lại.",
      "51": "Tài khoản không đủ số dư để thực hiện giao dịch.",
      "65": "Tài khoản đã vượt quá hạn mức giao dịch trong ngày.",
      "75": "Ngân hàng thanh toán đang bảo trì.",
      "79": "Nhập sai mật khẩu thanh toán quá số lần quy định.",
    };

    return errorMap[code] || `Mã lỗi: ${code}. Vui lòng thử lại hoặc liên hệ hỗ trợ.`;
  };

  const getStatusIcon = () => {
    switch (status) {
      case "loading":
      case "pending":
        return <Loader className="status-icon loading" />;
      case "success":
        return <CheckCircle className="status-icon success" />;
      case "failed":
        return <XCircle className="status-icon error" />;
      default:
        return <Loader className="status-icon loading" />;
    }
  };

  const handleManualRedirect = () => {
    navigate("/dashboard/my-listings", { replace: true });
  };

  return (
    <div className="payment-callback-page">
      <div className="callback-content">
        {getStatusIcon()}
        <h2 className="status-title">{message}</h2>

        {paymentDetails && (
          <div className="payment-details">
            {paymentDetails.amount && (
              <div className="detail-item">
                <span className="label">Số tiền:</span>
                <span className="value">
                  {paymentDetails.amount.toLocaleString("vi-VN")} ₫
                </span>
              </div>
            )}
            {paymentDetails.transactionId && (
              <div className="detail-item">
                <span className="label">Mã giao dịch:</span>
                <span className="value">{paymentDetails.transactionId}</span>
              </div>
            )}
          </div>
        )}

        {status === "loading" && (
          <p className="status-hint">Vui lòng đợi trong giây lát...</p>
        )}

        {(status === "success" || status === "failed") && (
          <div className="callback-actions">
            <p className="redirect-hint">
              Tự động chuyển hướng sau 3 giây...
            </p>
            <button
              onClick={handleManualRedirect}
              className="redirect-button"
            >
              Chuyển đến quản lý tin đăng ngay
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentCallbackPage;

