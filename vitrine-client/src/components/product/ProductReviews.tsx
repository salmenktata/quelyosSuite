'use client';

import { useState, useEffect } from 'react';
import { Star, ThumbsUp, ThumbsDown, CheckCircle, User } from 'lucide-react';
import { backendClient } from '@/lib/backend/client';
import { Button } from '@/components/common/Button';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/store/toastStore';
import { logger } from '@/lib/logger';

interface Review {
  id: number;
  authorName: string;
  rating: number;
  title: string;
  content: string;
  pros: string;
  cons: string;
  verifiedPurchase: boolean;
  sellerReply: string | null;
  sellerReplyDate: string | null;
  helpfulYes: number;
  helpfulNo: number;
  createdAt: string;
}

interface ReviewsData {
  reviews: Review[];
  total: number;
  avgRating: number;
  ratingDistribution: Record<number, number>;
}

interface ProductReviewsProps {
  productId: number;
  productName: string;
}

function StarRating({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-6 h-6' : 'w-4 h-4';
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClass} ${
            star <= rating
              ? 'fill-yellow-400 text-yellow-400'
              : 'fill-gray-200 text-gray-200'
          }`}
        />
      ))}
    </div>
  );
}

function RatingBar({ rating, count, total }: { rating: number; count: number; total: number }) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-3">{rating}</span>
      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-yellow-400 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-8 text-gray-500 text-right">{count}</span>
    </div>
  );
}

export function ProductReviews({ productId, productName }: ProductReviewsProps) {
  const [data, setData] = useState<ReviewsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [votedReviews, setVotedReviews] = useState<Set<number>>(new Set());

  const { isAuthenticated, user } = useAuthStore();
  const toast = useToast();

  // Form state
  const [formData, setFormData] = useState({
    rating: 5,
    title: '',
    content: '',
    pros: '',
    cons: '',
    authorName: '',
    authorEmail: '',
  });

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const response = await backendClient.getProductReviews(productId);
      if (response.success) {
        setData({
          reviews: response.reviews as unknown as Review[],
          total: response.total,
          avgRating: response.avgRating,
          ratingDistribution: response.ratingDistribution,
        });
      }
    } catch (error) {
      logger.error('Error fetching reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content.trim()) {
      toast.error('Veuillez saisir votre avis');
      return;
    }

    setSubmitting(true);
    try {
      const response = await backendClient.submitProductReview(productId, {
        rating: formData.rating,
        title: formData.title,
        content: formData.content,
        pros: formData.pros,
        cons: formData.cons,
        author_name: formData.authorName || (isAuthenticated ? user?.name : 'Anonyme'),
        author_email: formData.authorEmail || (isAuthenticated ? user?.email : ''),
      });

      if (response.success) {
        toast.success(response.message || 'Avis soumis avec succes');
        setShowForm(false);
        setFormData({ rating: 5, title: '', content: '', pros: '', cons: '', authorName: '', authorEmail: '' });
      } else {
        toast.error(response.error || 'Erreur lors de la soumission');
      }
    } catch (error) {
      toast.error('Erreur lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  };

  const handleHelpful = async (reviewId: number, helpful: boolean) => {
    if (votedReviews.has(reviewId)) return;

    try {
      const response = await backendClient.markReviewHelpful(reviewId, helpful);
      if (response.success && data) {
        setVotedReviews(new Set([...votedReviews, reviewId]));
        setData({
          ...data,
          reviews: data.reviews.map(r =>
            r.id === reviewId
              ? { ...r, helpfulYes: response.helpfulYes, helpfulNo: response.helpfulNo }
              : r
          ),
        });
      }
    } catch (error) {
      logger.error('Error voting:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="h-24 bg-gray-200 rounded" />
        <div className="h-32 bg-gray-200 rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec note moyenne */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Avis clients</h2>
          {data && data.total > 0 && (
            <div className="flex items-center gap-3 mt-2">
              <span className="text-3xl font-bold text-gray-900">{data.avgRating}</span>
              <div>
                <StarRating rating={Math.round(data.avgRating)} size="md" />
                <p className="text-sm text-gray-500 mt-1">
                  {data.total} avis
                </p>
              </div>
            </div>
          )}
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          variant={showForm ? 'outline' : 'primary'}
        >
          {showForm ? 'Annuler' : 'Donner mon avis'}
        </Button>
      </div>

      {/* Distribution des notes */}
      {data && data.total > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => (
              <RatingBar
                key={rating}
                rating={rating}
                count={data.ratingDistribution[rating] || 0}
                total={data.total}
              />
            ))}
          </div>
        </div>
      )}

      {/* Formulaire d'avis */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg space-y-4">
          <h3 className="font-semibold text-gray-900">Votre avis sur {productName}</h3>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Votre note *
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({ ...formData, rating: star })}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= formData.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-gray-200 text-gray-200 hover:fill-yellow-200 hover:text-yellow-200'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Titre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titre (optionnel)
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Resumez votre avis en une phrase"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Contenu */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Votre avis *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Partagez votre experience avec ce produit..."
              rows={4}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Points positifs / negatifs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-green-700 mb-1">
                Points positifs
              </label>
              <textarea
                value={formData.pros}
                onChange={(e) => setFormData({ ...formData, pros: e.target.value })}
                placeholder="Ce que vous avez aime..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-red-700 mb-1">
                Points negatifs
              </label>
              <textarea
                value={formData.cons}
                onChange={(e) => setFormData({ ...formData, cons: e.target.value })}
                placeholder="Ce qui pourrait etre ameliore..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>

          {/* Infos auteur (si non connecte) */}
          {!isAuthenticated && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Votre nom
                </label>
                <input
                  type="text"
                  value={formData.authorName}
                  onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                  placeholder="Jean D."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Votre email
                </label>
                <input
                  type="email"
                  value={formData.authorEmail}
                  onChange={(e) => setFormData({ ...formData, authorEmail: e.target.value })}
                  placeholder="jean@exemple.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Envoi en cours...' : 'Publier mon avis'}
            </Button>
          </div>
        </form>
      )}

      {/* Liste des avis */}
      {data && data.reviews.length > 0 ? (
        <div className="space-y-4">
          {data.reviews.map((review) => (
            <div key={review.id} className="border border-gray-200 rounded-lg p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{review.authorName}</span>
                      {review.verifiedPurchase && (
                        <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                          <CheckCircle className="w-3 h-3" />
                          Achat verifie
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StarRating rating={review.rating} size="sm" />
                      <span className="text-xs text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contenu */}
              {review.title && (
                <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
              )}
              <p className="text-gray-700 mb-3">{review.content}</p>

              {/* Pros/Cons */}
              {(review.pros || review.cons) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  {review.pros && (
                    <div className="text-sm">
                      <span className="font-medium text-green-700">+ Points positifs:</span>
                      <p className="text-gray-600 mt-1">{review.pros}</p>
                    </div>
                  )}
                  {review.cons && (
                    <div className="text-sm">
                      <span className="font-medium text-red-700">- Points negatifs:</span>
                      <p className="text-gray-600 mt-1">{review.cons}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Reponse vendeur */}
              {review.sellerReply && (
                <div className="bg-indigo-50 p-3 rounded-lg mt-3">
                  <p className="text-sm font-medium text-indigo-900 mb-1">Reponse du vendeur</p>
                  <p className="text-sm text-indigo-800">{review.sellerReply}</p>
                  {review.sellerReplyDate && (
                    <p className="text-xs text-indigo-600 mt-1">
                      {new Date(review.sellerReplyDate).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                <span className="text-sm text-gray-500">Cet avis vous a-t-il ete utile ?</span>
                <button
                  onClick={() => handleHelpful(review.id, true)}
                  disabled={votedReviews.has(review.id)}
                  className={`flex items-center gap-1 text-sm ${
                    votedReviews.has(review.id) ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:text-green-600'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>{review.helpfulYes}</span>
                </button>
                <button
                  onClick={() => handleHelpful(review.id, false)}
                  disabled={votedReviews.has(review.id)}
                  className={`flex items-center gap-1 text-sm ${
                    votedReviews.has(review.id) ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:text-red-600'
                  }`}
                >
                  <ThumbsDown className="w-4 h-4" />
                  <span>{review.helpfulNo}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucun avis pour ce produit</p>
          <p className="text-sm text-gray-400 mt-1">Soyez le premier a donner votre avis !</p>
        </div>
      )}
    </div>
  );
}
