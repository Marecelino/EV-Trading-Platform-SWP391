import React, { useMemo } from 'react';
import { CalendarDays, MessageCircle, Star, UserRound } from 'lucide-react';
import type { ITransaction, Product, Review, User } from '../../../../types';
import Button from '../../../common/Button/Button';
import './TransactionReviewCard.scss';

export type TransactionRole = 'buyer' | 'seller';

interface TransactionReviewCardProps {
  transaction: ITransaction;
  role: TransactionRole;
  canReview: boolean;
  review?: Review | null;
  onReviewClick: (transaction: ITransaction, role: TransactionRole, review?: Review | null) => void;
}

const TransactionReviewCard: React.FC<TransactionReviewCardProps> = ({
  transaction,
  role,
  canReview,
  review,
  onReviewClick,
}) => {
  const { listing, counterparty, priceLabel, dateLabel } = useMemo(() => {
    const listingData =
      typeof transaction.listing_id === 'object'
        ? (transaction.listing_id as Product)
        : undefined;

    const buyerData =
      typeof transaction.buyer_id === 'object'
        ? (transaction.buyer_id as User)
        : undefined;

    const sellerData =
      typeof transaction.seller_id === 'object'
        ? (transaction.seller_id as User)
        : undefined;

    const roleCounterparty = role === 'buyer' ? sellerData : buyerData;

    const price = transaction.price ?? transaction.amount ?? 0;
    const createdAt = transaction.createdAt || transaction.created_at || transaction.transaction_date;

    return {
      listing: listingData,
      counterparty: roleCounterparty,
      priceLabel: price ? `${price.toLocaleString('vi-VN')} ₫` : '—',
      dateLabel: createdAt
        ? new Date(createdAt).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          })
        : 'N/A',
    };
  }, [role, transaction]);

  const transactionTitle = useMemo(() => {
    if (listing?.title) return listing.title;
    if (listing?.name) return listing.name;
    if (transaction.auction_id) return 'Giao dịch đấu giá';
    return 'Giao dịch mua bán';
  }, [listing, transaction.auction_id]);

  const listingImage = listing?.images?.[0] ?? null;

  const statusLabel = useMemo(() => {
    const value = transaction.status?.toUpperCase?.() ?? 'UNKNOWN';
    const mapping: Record<string, string> = {
      PENDING: 'Đang chờ',
      PROCESSING: 'Đang xử lý',
      COMPLETED: 'Hoàn thành',
      CANCELLED: 'Đã hủy',
      FAILED: 'Thất bại',
    };
    return mapping[value] ?? value;
  }, [transaction.status]);

  const statusClass = `status-tag status-tag--${(transaction.status || 'unknown').toString().toLowerCase()}`;

  const renderReviewSummary = () => {
    if (!review) {
      return (
        <div className="transaction-review-card__empty-review">
          <MessageCircle className="icon" size={16} />
          <span>Chưa có đánh giá cho giao dịch này.</span>
        </div>
      );
    }

    return (
      <div className="transaction-review-card__review-content">
        <div className="transaction-review-card__review-rating">
          {[...Array(5)].map((_, index) => (
            <Star
              key={index}
              size={16}
              className={index < review.rating ? 'filled' : ''}
            />
          ))}
          <span className="transaction-review-card__review-rating-value">{review.rating}/5</span>
        </div>
        <p className="transaction-review-card__review-comment">{review.comment}</p>
        <span className="transaction-review-card__review-date">
          {new Date(review.createdAt || review.created_at || Date.now()).toLocaleDateString('vi-VN')}
        </span>
      </div>
    );
  };

  return (
    <div className="transaction-review-card">
      <div className="transaction-review-card__header">
        <div className="transaction-review-card__product">
          <div className="transaction-review-card__image">
            {listingImage ? (
              <img src={listingImage} alt={transactionTitle} />
            ) : (
              <div className="transaction-review-card__image-placeholder">—</div>
            )}
          </div>
          <div className="transaction-review-card__product-info">
            <h3>{transactionTitle}</h3>
            <div className="transaction-review-card__meta">
              <span className="transaction-review-card__meta-item">
                <CalendarDays size={16} />
                {dateLabel}
              </span>
              <span className="transaction-review-card__meta-item">
                <MessageCircle size={16} />
                {role === 'buyer' ? 'Vai trò: Người mua' : 'Vai trò: Người bán'}
              </span>
            </div>
          </div>
        </div>
        <div className="transaction-review-card__status">
          <span className="transaction-review-card__price">{priceLabel}</span>
          <span className={statusClass}>{statusLabel}</span>
        </div>
      </div>

      <div className="transaction-review-card__body">
        <div className="transaction-review-card__counterparty">
          <div className="transaction-review-card__counterparty-icon">
            <UserRound size={18} />
          </div>
          <div>
            <p className="transaction-review-card__counterparty-label">
              {role === 'buyer' ? 'Thông tin người bán' : 'Thông tin người mua'}
            </p>
            <p className="transaction-review-card__counterparty-name">
              {counterparty?.full_name || counterparty?.name || 'Người dùng ẩn danh'}
            </p>
          </div>
        </div>

        <div className="transaction-review-card__review">
          <div className="transaction-review-card__review-header">
            <h4>Đánh giá giao dịch</h4>
            {(canReview || review) && (
              <Button
                className="transaction-review-card__review-button"
                onClick={() => onReviewClick(transaction, role, review)}
              >
                {review ? 'Xem / cập nhật đánh giá' : 'Đánh giá ngay'}
              </Button>
            )}
          </div>
          {renderReviewSummary()}
        </div>
      </div>
    </div>
  );
};

export default TransactionReviewCard;

