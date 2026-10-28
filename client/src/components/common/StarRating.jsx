import React from 'react';
import { Star } from 'lucide-react';

export function StarRating({ rating = 0, reviewCount = null, size = 'sm', showCount = true }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.4;
  const starSizeClass = size === 'xs' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-3.5 h-3.5';

  return (
    <div className="flex items-center gap-1 select-none">
      <div className="flex items-center text-[#D97706]">
        {[...Array(5)].map((_, i) => {
          const isFilled = i < fullStars;
          const isHalf = !isFilled && i === fullStars && hasHalfStar;

          return (
            <div key={i} className="relative inline-block">
              <Star
                className={`${starSizeClass} ${
                  isFilled
                    ? 'fill-[#D97706] text-[#D97706]'
                    : isHalf
                    ? 'fill-[#D97706]/60 text-[#D97706]'
                    : 'text-gray-300 fill-gray-100'
                }`}
              />
            </div>
          );
        })}
      </div>

      {showCount && reviewCount !== null && (
        <span className="text-[12px] text-[#2A6F4E] hover:text-[#122620] hover:underline cursor-pointer ml-0.5 font-medium">
          {Number(reviewCount).toLocaleString('en-IN')}
        </span>
      )}
    </div>
  );
}
