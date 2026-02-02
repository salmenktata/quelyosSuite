'use client';

import React from 'react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (rating: number) => void;
  showCount?: boolean;
  reviewCount?: number;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  size: _size = 'md',
  interactive = false,
  onChange,
  showCount = false,
  reviewCount = 0,
}) => {
  const [hoverRating, setHoverRating] = React.useState(0);

  const _sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const handleClick = (value: number) => {
    if (interactive && onChange) {
      onChange(value);
    }
  };

  const handleMouseEnter = (value: number) => {
    if (interactive) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0);
    }
  };

  const _getStarColor = (index: number) => {
    const currentRating = hoverRating || rating;
    if (index <= currentRating) {
      return 'text-yellow-400';
    }
    return 'text-gray-300';
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {Array.from({ length: maxRating }, (_, i) => i + 1).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => handleClick(value)}
            onMouseEnter={() => handleMouseEnter(value)}
            onMouseLeave={handleMouseLeave}
            disabled={!interactive}
            className={`\${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
            aria-label={`Rate \${value} stars`}
          >
            <svg
              className={`\${sizes[size]} \${getStarColor(value)} transition-colors`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
      {showCount && reviewCount > 0 && (
        <span className="text-sm text-gray-600">
          ({reviewCount} {reviewCount === 1 ? 'avis' : 'avis'})
        </span>
      )}
    </div>
  );
};

export default StarRating;
