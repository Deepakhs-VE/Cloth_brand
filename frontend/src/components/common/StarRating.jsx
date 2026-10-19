import React from 'react';
import { Star } from 'lucide-react';

export const StarRating = ({ rating = 0, maxRating = 5, onRate, interactive = false, size = 'w-4 h-4' }) => {
  const roundedRating = Math.round(Number(rating || 0) * 10) / 10;

  return (
    <div
      className="flex items-center space-x-0.5"
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={`${roundedRating} out of ${maxRating} stars`}
    >
      {[...Array(maxRating)].map((_, i) => {
        const starNumber = i + 1;
        const isFilled = rating >= starNumber;
        const isHalf = !isFilled && rating >= starNumber - 0.5;

        const star = (
          <Star
            className={`${size} ${
              isFilled
                ? 'text-amber-500 fill-amber-500'
                : isHalf
                ? 'text-amber-500 fill-amber-200'
                : 'text-slate-300'
            }`}
          />
        );

        return interactive ? (
          <button
            key={i}
            type="button"
            onClick={() => onRate && onRate(starNumber)}
            className="cursor-pointer rounded-sm transition-transform hover:scale-110"
            role="radio"
            aria-checked={rating === starNumber}
            aria-label={`${starNumber} stars`}
          >
            {star}
          </button>
        ) : (
          <span key={i} aria-hidden="true">{star}</span>
        );
      })}
    </div>
  );
};
