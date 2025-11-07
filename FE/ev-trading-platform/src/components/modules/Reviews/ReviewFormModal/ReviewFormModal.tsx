import React, { useMemo, useState } from 'react';
import { Star } from 'lucide-react';
import type { ITransaction, Review, User } from '../../../../types';
import type { ReviewDirection } from '../../../../types/api';
import Button from '../../../common/Button/Button';
import './ReviewFormModal.scss';

type ReviewFormRole = 'buyer' | 'seller';

interface ReviewFormModalProps {
  isOpen: boolean;
  transaction: ITransaction | null;
  role: ReviewFormRole;
  onClose: () => void;
  onSubmit: (payload: {
    rating: number;
    comment: string;
    transaction: ITransaction;
    role: ReviewFormRole;
    revieweeId: string;
    reviewId?: string;
  }) => Promise<void> | void;
  isSubmitting?: boolean;
  initialRating?: number;
  initialComment?: string;
  existingReview?: Review | null;
}

const MIN_COMMENT_LENGTH = 10;
const MAX_COMMENT_LENGTH = 500;

const ReviewFormModal: React.FC<ReviewFormModalProps> = ({
  isOpen,
  transaction,
  role,
  onClose,
  onSubmit,
  isSubmitting = false,
  initialRating = 0,
  initialComment = '',
  existingReview = null,
}) => {
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState(initialComment);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setRating(existingReview?.rating ?? initialRating);
      setComment(existingReview?.comment ?? initialComment);
      setError(null);
    }
  }, [existingReview, initialComment, initialRating, isOpen]);

  const { counterpart } = useMemo(() => {
    if (!transaction) {
      return { counterpart: null };
    }

    const buyerData =
      typeof transaction.buyer_id === 'object'
        ? (transaction.buyer_id as User)
        : null;
    const sellerData =
      typeof transaction.seller_id === 'object'
        ? (transaction.seller_id as User)
        : null;

    return {
      counterpart: role === 'buyer' ? sellerData : buyerData,
    };
  }, [role, transaction]);

  if (!isOpen || !transaction) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (rating < 1 || rating > 5) {
      setError('Vui lòng chọn số sao từ 1 đến 5.');
      return;
    }

    if (comment.trim().length < MIN_COMMENT_LENGTH) {
      setError(`Bình luận phải có ít nhất ${MIN_COMMENT_LENGTH} ký tự.`);
      return;
    }

    if (comment.length > MAX_COMMENT_LENGTH) {
      setError(`Bình luận không được vượt quá ${MAX_COMMENT_LENGTH} ký tự.`);
      return;
    }

    const revieweeId = role === 'buyer'
      ? (typeof transaction.seller_id === 'object'
          ? (transaction.seller_id as User)._id
          : (transaction.seller_id as string))
      : (typeof transaction.buyer_id === 'object'
          ? (transaction.buyer_id as User)._id
          : (transaction.buyer_id as string));

    if (!revieweeId) {
      setError('Không tìm thấy thông tin người nhận đánh giá.');
      return;
    }

    await onSubmit({
      rating,
      comment: comment.trim(),
      transaction,
      role,
      revieweeId,
      reviewId: existingReview?._id,
    });
  };

  const renderStar = (value: number) => {
    const isFilled = (hoverRating ?? rating) >= value;
    return (
      <button
        key={value}
        type="button"
        className={`review-form-modal__star ${isFilled ? 'filled' : ''}`}
        onClick={() => setRating(value)}
        onMouseEnter={() => setHoverRating(value)}
        onMouseLeave={() => setHoverRating(null)}
        aria-label={`Chọn ${value} sao`}
      >
        <Star size={28} />
      </button>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content review-form-modal" onClick={(event) => event.stopPropagation()}>
        <div className="review-form-modal__header">
          <div>
            <h3>
              {existingReview
                ? 'Cập nhật đánh giá giao dịch'
                : role === 'buyer'
                    ? 'Đánh giá người bán'
                    : 'Đánh giá người mua'}
            </h3>
            <p>
              Giao dịch: <strong>{transaction._id}</strong>
            </p>
          </div>
          <Button variant="outline" className="review-form-modal__close-btn" onClick={onClose}>
            Đóng
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="review-form-modal__body">
          <div className="review-form-modal__section">
            <h4>Chấm điểm trải nghiệm</h4>
            <div className="review-form-modal__stars">
              {[1, 2, 3, 4, 5].map(renderStar)}
            </div>
            <span className="review-form-modal__rating-hint">
              {rating > 0 ? `${rating} / 5 sao` : 'Chọn số sao để đánh giá'}
            </span>
          </div>

          <div className="review-form-modal__section">
            <h4>Nội dung đánh giá</h4>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={5}
              placeholder="Chia sẻ trải nghiệm giao dịch của bạn (10-500 ký tự)"
              maxLength={MAX_COMMENT_LENGTH}
            />
            <div className="review-form-modal__textarea-footer">
              <span>{comment.length}/{MAX_COMMENT_LENGTH}</span>
              {counterpart && (
                <span className="review-form-modal__counterpart">
                  Đánh giá {counterpart.full_name || counterpart.name || 'người dùng'}
                </span>
              )}
            </div>
          </div>

          {error && <div className="review-form-modal__error">{error}</div>}

          <div className="review-form-modal__actions">
            <Button type="button" variant="outline" className="review-form-modal__cancel-btn" onClick={onClose} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button type="submit" className="review-form-modal__submit-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewFormModal;

