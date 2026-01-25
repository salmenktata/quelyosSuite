'use client';

import React, { useState } from 'react';
import { Button, Loading } from '@/components/common';
import StarRating from './StarRating';
import ReviewItem from './ReviewItem';
import ReviewForm from './ReviewForm';
import type { ReviewFormData } from './ReviewForm';

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

interface ReviewStats {
  average_rating: number;
  total_reviews: number;
  rating_distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

interface ProductReviewsProps {
  productId: number;
  reviews: Review[];
  stats: ReviewStats;
  onSubmitReview: (review: ReviewFormData) => Promise<void>;
  onMarkHelpful: (reviewId: number) => Promise<void>;
  isLoading?: boolean;
}

const ProductReviews: React.FC<ProductReviewsProps> = ({
  productId,
  reviews,
  stats,
  onSubmitReview,
  onMarkHelpful,
  isLoading = false,
}) => {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'rating'>('recent');

  const sortedReviews = [...reviews].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'helpful':
        return (b.helpful_count || 0) - (a.helpful_count || 0);
      case 'rating':
        return b.rating - a.rating;
      default:
        return 0;
    }
  });

  const getRatingPercentage = (stars: number) => {
    if (stats.total_reviews === 0) return 0;
    const count = stats.rating_distribution[stars as keyof typeof stats.rating_distribution] || 0;
    return (count / stats.total_reviews) * 100;
  };

  const handleSubmitReview = async (formData: ReviewFormData) => {
    await onSubmitReview(formData);
    setShowReviewForm(false);
  };

  if (isLoading) {
    return (
      <div className="py-12 flex justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Avis clients
      </h2>

      {/* Reviews Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 pb-8 border-b border-gray-200">
        {/* Left: Overall Rating */}
        <div className="text-center md:text-left">
          <div className="inline-block">
            <div className="text-5xl font-bold text-gray-900 mb-2">
              {stats.average_rating.toFixed(1)}
            </div>
            <StarRating
              rating={stats.average_rating}
              size="lg"
              showCount
              reviewCount={stats.total_reviews}
            />
            <p className="text-sm text-gray-600 mt-2">
              Basé sur {stats.total_reviews} {stats.total_reviews === 1 ? 'avis' : 'avis'}
            </p>
          </div>
        </div>

        {/* Right: Rating Distribution */}
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((stars) => (
            <div key={stars} className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 w-12">
                {stars} étoiles
              </span>
              <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 transition-all"
                  style={{ width: `\${getRatingPercentage(stars)}%` }}
                />
              </div>
              <span className="text-sm text-gray-600 w-12 text-right">
                {stats.rating_distribution[stars as keyof typeof stats.rating_distribution] || 0}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Write Review Button */}
      {!showReviewForm && (
        <div className="mb-8">
          <Button
            variant="primary"
            onClick={() => setShowReviewForm(true)}
          >
            Écrire un avis
          </Button>
        </div>
      )}

      {/* Review Form */}
      {showReviewForm && (
        <div className="mb-8">
          <ReviewForm
            productId={productId}
            onSubmit={handleSubmitReview}
            onCancel={() => setShowReviewForm(false)}
          />
        </div>
      )}

      {/* Sort Options */}
      {reviews.length > 0 && (
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Tous les avis ({reviews.length})
          </h3>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Trier par:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="recent">Plus récents</option>
              <option value="helpful">Plus utiles</option>
              <option value="rating">Note</option>
            </select>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {sortedReviews.length > 0 ? (
        <div className="space-y-6">
          {sortedReviews.map((review) => (
            <ReviewItem
              key={review.id}
              review={review}
              onHelpful={onMarkHelpful}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucun avis pour le moment
          </h3>
          <p className="text-gray-600 mb-4">
            Soyez le premier à donner votre avis sur ce produit
          </p>
          <Button
            variant="primary"
            onClick={() => setShowReviewForm(true)}
          >
            Écrire le premier avis
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProductReviews;
