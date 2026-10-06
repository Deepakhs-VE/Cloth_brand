import React from 'react';
import { Star } from 'lucide-react';

export const StarRating = ({ rating = 0, maxRating = 5, onRate, interactive = false, size = 'w-4 h-4' }) => {
  return (
    <div className="flex items-center space-x-0.5">
      {[...Array(maxRating)].map((_, i) => {
        const starNumber = i + 1;
        const isFilled = rating >= starNumber;
        const isHalf = !isFilled && rating >= starNumber - 0.5;

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => onRate && onRate(starNumber)}
            className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'} focus:outline-none`}
          >
            <Star
              className={`${size} ${
                isFilled
                  ? 'text-amber-500 fill-amber-500'
                  : isHalf
                  ? 'text-amber-500 fill-amber-200'
                  : 'text-slate-300'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
};
