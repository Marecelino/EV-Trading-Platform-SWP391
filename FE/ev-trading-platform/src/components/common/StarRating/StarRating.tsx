// src/components/common/StarRating/StarRating.tsx
import React from 'react';
import { Star } from 'lucide-react';
import './StarRating.scss';

interface StarRatingProps {
  rating: number;
  count?: number;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, count }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5; // Kiểm tra xem có sao lẻ không
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="star-rating">
      <div className="stars">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="star filled" />
        ))}
        {hasHalfStar && (
            <div className="star-container">
                <Star className="star half-filled" />
                <Star className="star" />
            </div>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="star" />
        ))}
      </div>
      {count !== undefined && (
        <span className="rating-text">
            {rating.toFixed(1)} ({count} đánh giá)
        </span>
      )}
    </div>
  );
};

export default StarRating;