import React, { useMemo, useState } from 'react';
import { MessageCircle, UserRound } from 'lucide-react';
import type { Review, User } from '../../../../types';
import type { ReviewStats } from '../../../../types/api';
import './ReviewList.scss';

type ReviewDirectionFilter = 'all' | 'buyer_to_seller' | 'seller_to_buyer';
type ReviewSort = 'newest' | 'oldest' | 'highest' | 'lowest';

interface ReviewListProps {
  reviews: Review[];
  stats?: ReviewStats;
  isLoading?: boolean;
  emptyMessage?: string;
  title?: string;
  showFilters?: boolean;
  showStats?: boolean;
}

const ReviewList: React.FC<ReviewListProps> = ({
  reviews,
  stats,
  isLoading = false,
  emptyMessage = 'Chưa có đánh giá nào',
  title = 'Đánh giá',
  showFilters = true,
  showStats = true,
}) => {
  const [directionFilter, setDirectionFilter] = useState<ReviewDirectionFilter>('all');
  const [sort, setSort] = useState<ReviewSort>('newest');

  const filtratedReviews = useMemo(() => {
    let next = [...reviews];

    if (directionFilter !== 'all') {
      next = next.filter((review) => review.review_type === directionFilter);
    }

    switch (sort) {
      case 'oldest':
        next.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'highest':
        next.sort((a, b) => b.rating - a.rating);
        break;
      case 'lowest':
        next.sort((a, b) => a.rating - b.rating);
        break;
      default:
        next.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return next;
  }, [directionFilter, reviews, sort]);

  const renderStats = () => {
    if (!stats || !showStats) return null;

    const total = stats.totalReviews ?? 0;
    const average = typeof stats.averageRating === 'number' ? stats.averageRating : 0;
    const breakdown = stats.ratingBreakdown ?? [];

    return (
      <div className="review-list__stats">
        <div className="review-list__stats-summary">
          <span className="review-list__stats-rating">{average.toFixed(1)}</span>
          <span className="review-list__stats-total">{total} đánh giá</span>
        </div>
        {breakdown.length > 0 && (
          <div className="review-list__stats-breakdown">
            {breakdown
              .slice()
              .sort((a, b) => b.rating - a.rating)
              .map((item) => {
                const percentage = total ? Math.round((item.count / total) * 100) : 0;

                return (
                  <div key={item.rating} className="review-list__breakdown-row">
                    <span className="review-list__breakdown-label">{item.rating} sao</span>
                    <div className="review-list__breakdown-bar">
                      <div className="review-list__breakdown-bar-fill" style={{ width: `${percentage}%` }} />
                    </div>
                    <span className="review-list__breakdown-count">{percentage}%</span>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    );
  };

  const renderReviews = () => {
    if (isLoading) {
      return <div className="review-list__empty">Đang tải đánh giá...</div>;
    }

    if (filtratedReviews.length === 0) {
      return <div className="review-list__empty">{emptyMessage}</div>;
    }

    return (
      <div className="review-list__items">
        {filtratedReviews.map((review) => {
          const reviewer =
            typeof review.reviewer_id === 'object'
              ? (review.reviewer_id as User)
              : null;

          const reviewerName = reviewer?.full_name || reviewer?.name || 'Người dùng ẩn danh';
          const reviewerAvatar = reviewer?.avatar_url || reviewer?.avatar;
          const reviewDate = new Date(review.createdAt || review.created_at || Date.now()).toLocaleDateString('vi-VN');
          const directionLabel =
            review.review_type === 'buyer_to_seller'
              ? 'Người mua đánh giá người bán'
              : 'Người bán đánh giá người mua';

          return (
            <article key={review._id} className="review-list__item">
              <header className="review-list__item-header">
                <div className="review-list__avatar">
                  {reviewerAvatar ? (
                    <img src={reviewerAvatar} alt={reviewerName} />
                  ) : (
                    <UserRound size={18} />
                  )}
                </div>
                <div>
                  <p className="review-list__reviewer-name">{reviewerName}</p>
                  <p className="review-list__review-meta">{directionLabel} • {reviewDate}</p>
                </div>
                <div className="review-list__rating">
                  <span>{review.rating}</span>
                  <span>/5</span>
                </div>
              </header>
              <p className="review-list__comment">{review.comment}</p>
            </article>
          );
        })}
      </div>
    );
  };

  return (
    <section className="review-list">
      <div className="review-list__header">
        <div className="review-list__title">
          <MessageCircle size={20} />
          <h3>{title}</h3>
        </div>
        {showFilters && (
          <div className="review-list__controls">
            <div className="review-list__filters">
              {(
                [
                  { value: 'all', label: 'Tất cả' },
                  { value: 'buyer_to_seller', label: 'Người mua → Người bán' },
                  { value: 'seller_to_buyer', label: 'Người bán → Người mua' },
                ] as const
              ).map((filter) => (
                <button
                  key={filter.value}
                  className={`review-list__filter${directionFilter === filter.value ? ' active' : ''}`}
                  onClick={() => setDirectionFilter(filter.value)}
                  type="button"
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <select
              className="review-list__sort"
              value={sort}
              onChange={(event) => setSort(event.target.value as ReviewSort)}
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="highest">Điểm cao</option>
              <option value="lowest">Điểm thấp</option>
            </select>
          </div>
        )}
      </div>

      {renderStats()}
      {renderReviews()}
    </section>
  );
};

export default ReviewList;

