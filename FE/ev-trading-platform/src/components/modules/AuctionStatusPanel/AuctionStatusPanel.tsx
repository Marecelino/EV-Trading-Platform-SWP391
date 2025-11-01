import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import type { Auction } from "../../../types";
import { ApiErrorResponse } from "../../../types/api";
import Button from "../../common/Button/Button";
import "./AuctionStatusPanel.scss";

interface AuctionStatusPanelProps {
  auction: Auction;
  onBidPlaced: (amount: number) => Promise<void>;
  onBuyNow: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  finished: boolean;
  totalSeconds: number;
}

const AuctionStatusPanel: React.FC<AuctionStatusPanelProps> = ({
  auction,
  onBidPlaced,
  onBuyNow,
}) => {
  const { user } = useAuth();
  const [bidAmount, setBidAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previousPrice, setPreviousPrice] = useState(auction.current_price);

  // --- LOGIC ĐẾM NGƯỢC THỜI GIAN ---
  const calculateTimeLeft = (): TimeLeft => {
    const difference = +new Date(auction.end_time) - +new Date();
    let timeLeft: TimeLeft = {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      finished: true,
      totalSeconds: 0,
    };

    if (difference > 0) {
      const totalSeconds = Math.floor(difference / 1000);
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        finished: false,
        totalSeconds,
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  // Memoized minimum next bid
  const minNextBid = useMemo(
    () => auction.current_price + auction.min_increment,
    [auction.current_price, auction.min_increment]
  );

  // Calculate quick bid options
  const quickBidOptions = useMemo(() => {
    return [
      { label: minNextBid.toLocaleString("vi-VN"), value: minNextBid, recommended: true },
      {
        label: `+${auction.min_increment.toLocaleString("vi-VN")}`,
        value: minNextBid + auction.min_increment,
        recommended: false,
      },
      {
        label: `+${(auction.min_increment * 2).toLocaleString("vi-VN")}`,
        value: minNextBid + auction.min_increment * 2,
        recommended: false,
      },
    ];
  }, [minNextBid, auction.min_increment]);

  // Calculate bid confidence (simple heuristic)
  const bidConfidence = useMemo(() => {
    const amount = Number(bidAmount);
    if (isNaN(amount) || amount < minNextBid) return 0;
    
    const percentageAboveMin = ((amount - minNextBid) / minNextBid) * 100;
    return Math.min(100, 50 + percentageAboveMin);
  }, [bidAmount, minNextBid]);

  // Determine timer urgency class
  const getTimerUrgencyClass = (): string => {
    if (timeLeft.finished) return "";
    const oneHour = 3600;
    const oneDay = 86400;
    
    if (timeLeft.totalSeconds < oneHour) return "urgent";
    if (timeLeft.totalSeconds < oneDay) return "warning";
    return "";
  };

  // Update countdown every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [auction.end_time]);

  // Track price changes
  useEffect(() => {
    if (auction.current_price !== previousPrice) {
      setPreviousPrice(auction.current_price);
    }
  }, [auction.current_price, previousPrice]);

  // Clear error when price updates
  useEffect(() => {
    setError(null);
  }, [auction.current_price]);

  const handlePlaceBid = async () => {
    setError(null);
    const amount = Number(bidAmount);

    // --- VALIDATION ---
    if (!user) {
      setError("Bạn cần đăng nhập để tham gia đấu giá.");
      return;
    }
    if (user._id === auction.seller_id) {
      setError("Bạn không thể tự đấu giá sản phẩm của mình.");
      return;
    }
    if (isNaN(amount) || amount < minNextBid) {
      setError(`Giá đặt phải ≥ ${minNextBid.toLocaleString("vi-VN")} ₫`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onBidPlaced(amount);
      setBidAmount("");
    } catch (err: unknown) {
      // CRITICAL FIX: Use proper error types instead of 'any'
      // Enhanced error handling with type-safe error structure
      const axiosError = err as {
        response?: {
          data?: ApiErrorResponse & {
            code?: string;
            data?: { currentPrice?: number };
          };
        };
      };
      
      const errorData = axiosError.response?.data;
      const errorCode = errorData?.code;
      
      switch (errorCode) {
        case "BID_TOO_LOW":
          const currentPrice = errorData?.data?.currentPrice || auction.current_price;
          const newMinBid = currentPrice + auction.min_increment;
          setError(
            `Giá đã tăng lên. Mức tối thiểu mới là ${newMinBid.toLocaleString("vi-VN")} ₫`
          );
          break;
        case "AUCTION_ENDED":
          setError("Phiên đấu giá đã kết thúc.");
          break;
        case "INSUFFICIENT_BALANCE":
          setError("Số dư tài khoản không đủ.");
          break;
        default:
          setError(errorData?.message || errorData?.error || "Đã có lỗi xảy ra. Vui lòng thử lại.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickBid = (value: number) => {
    setBidAmount(String(value));
    setError(null);
  };

  const isAuctionEnded = timeLeft.finished;
  const priceChange = auction.current_price - previousPrice;

  return (
    <div
      className={`auction-panel content-card ${isAuctionEnded ? "ended" : ""}`}
    >
      {/* Timer Section */}
      <div className={`timer ${getTimerUrgencyClass()}`}>
        <span className="timer__label">
          {isAuctionEnded ? "Phiên đấu giá đã kết thúc" : "Thời gian còn lại"}
        </span>
        {!isAuctionEnded && (
          <div
            className="timer__time"
            role="timer"
            aria-live="polite"
            aria-atomic="true"
          >
            <div className="time-segment">
              <span className="value">{timeLeft.days}</span>
              <span className="label">ngày</span>
            </div>
            <span className="separator">:</span>
            <div className="time-segment">
              <span className="value">{timeLeft.hours.toString().padStart(2, "0")}</span>
              <span className="label">giờ</span>
            </div>
            <span className="separator">:</span>
            <div className="time-segment">
              <span className="value">{timeLeft.minutes.toString().padStart(2, "0")}</span>
              <span className="label">phút</span>
            </div>
            <span className="separator">:</span>
            <div className="time-segment">
              <span className="value">{timeLeft.seconds.toString().padStart(2, "0")}</span>
              <span className="label">giây</span>
            </div>
          </div>
        )}
      </div>

      {/* Price Info Section */}
      <div className="price-info">
        <span>
          {isAuctionEnded ? "Giá chiến thắng" : "Giá cao nhất hiện tại"}
        </span>
        <p>{auction.current_price.toLocaleString("vi-VN")}</p>
        
        {/* Price change indicator */}
        {!isAuctionEnded && priceChange > 0 && (
          <div className="price-change">
            +{priceChange.toLocaleString("vi-VN")} ₫ từ lượt trước
          </div>
        )}
      </div>

      {/* Bid Form - Only show for logged-in users and active auctions */}
      {user && !isAuctionEnded && (
        <div className="bid-form">
          {/* Quick Bid Buttons */}
          <div className="quick-bids">
            {quickBidOptions.map((option, index) => (
              <button
                key={index}
                onClick={() => handleQuickBid(option.value)}
                className={option.recommended ? "recommended" : ""}
                disabled={isSubmitting}
                aria-label={`Đặt giá ${option.value.toLocaleString("vi-VN")} đồng`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Custom Bid Input */}
          <input
            type="number"
            placeholder={`≥ ${minNextBid.toLocaleString("vi-VN")} ₫`}
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            disabled={isSubmitting}
            aria-label="Nhập số tiền đặt giá"
            aria-describedby="min-bid-note"
            aria-invalid={!!error}
          />

          {/* Minimum Bid Note */}
          <p className="min-bid-note" id="min-bid-note">
            Bước giá tối thiểu: {auction.min_increment.toLocaleString("vi-VN")} ₫
          </p>

          {/* Bid Confidence Indicator */}
          {bidAmount && Number(bidAmount) >= minNextBid && (
            <div className="bid-confidence">
              <span>Khả năng thắng:</span>
              <progress value={bidConfidence} max="100" />
              <span>{Math.round(bidConfidence)}%</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}

          {/* Place Bid Button */}
          <Button
            onClick={handlePlaceBid}
            disabled={isSubmitting}
            className="btn"
            aria-label={isSubmitting ? "Đang xử lý đặt giá" : "Đặt giá"}
          >
            {isSubmitting ? "Đang xử lý..." : "Đặt giá"}
          </Button>
        </div>
      )}

      {/* Buy Now Button */}
      {auction.buy_now_price && !isAuctionEnded && (
        <Button
          variant="secondary"
          className="btn-buy-now"
          onClick={onBuyNow}
          aria-label={`Mua ngay với giá ${auction.buy_now_price.toLocaleString("vi-VN")} đồng`}
        >
          Mua ngay {auction.buy_now_price.toLocaleString("vi-VN")} ₫
        </Button>
      )}

      {/* Not Logged In Message */}
      {!user && !isAuctionEnded && (
        <div className="login-prompt">
          <p>Đăng nhập để tham gia đấu giá</p>
          <Button onClick={() => window.location.href = "/login"}>
            Đăng nhập ngay
          </Button>
        </div>
      )}
    </div>
  );
};

export default AuctionStatusPanel;