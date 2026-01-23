'use client';

import React from 'react';
import StarRating from './StarRating';

interface Review {
  id: number;
  user_name: string;
  rating: number;
  title: string;
  comment: string;
  created_at: string;
  verified_purchase?: boolean;
  helpful_count?: number;
}

interface ReviewItemProps {
  review: Review;
  onHelpful?: (reviewId: number) => void;
}

const ReviewItem: React.FC<ReviewItemProps> = ({ review, onHelpful }) => {
  const [isHelpful, setIsHelpful] = React.useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleHelpful = () => {
    if (!isHelpful && onHelpful) {
      setIsHelpful(true);
      onHelpful(review.id);
    }
  };

  return (
    <div className="border-b border-gray-200 pb-6 last:border-0">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 bg-[#01613a] text-white rounded-full font-bold">
              {review.user_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{review.user_name}</p>
              {review.verified_purchase && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Achat vérifié
                </p>
              )}
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-500">{formatDate(review.created_at)}</p>
      </div>

      <div className="mb-3">
        <StarRating rating={review.rating} size="sm" />
      </div>

      {review.title && (
        <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
      )}

      <p className="text-gray-700 leading-relaxed mb-4">{review.comment}</p>

      <div className="flex items-center gap-4">
        <button
          onClick={handleHelpful}
          disabled={isHelpful}
          className={\`flex items-center gap-2 text-sm \${
            isHelpful ? 'text-green-600' : 'text-gray-600 hover:text-gray-900'
          } transition-colors disabled:cursor-not-allowed\`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
          {isHelpful ? 'Utile!' : 'Utile?'}
          {review.helpful_count !== undefined && review.helpful_count > 0 && (
            <span>({review.helpful_count})</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default ReviewItem;
