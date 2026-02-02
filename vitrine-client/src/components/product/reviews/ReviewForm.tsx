'use client';

import React, { useState } from 'react';
import { Button, Input } from '@/components/common';
import StarRating from './StarRating';
import { logger } from '@/lib/logger';

interface ReviewFormProps {
  productId: number;
  onSubmit: (review: ReviewFormData) => Promise<void>;
  onCancel?: () => void;
}

export interface ReviewFormData {
  rating: number;
  title: string;
  comment: string;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ productId: _productId, onSubmit, onCancel }) => {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ReviewFormData, string>>>({});

  const validate = () => {
    const newErrors: Partial<Record<keyof ReviewFormData, string>> = {};

    if (rating === 0) {
      newErrors.rating = 'Veuillez sélectionner une note';
    }
    if (!title.trim()) {
      newErrors.title = 'Le titre est requis';
    }
    if (!comment.trim()) {
      newErrors.comment = 'Le commentaire est requis';
    }
    if (comment.trim().length < 10) {
      newErrors.comment = 'Le commentaire doit contenir au moins 10 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({ rating, title, comment });
      // Reset form
      setRating(0);
      setTitle('');
      setComment('');
      setErrors({});
    } catch (error) {
      logger.error('Error submitting review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Donnez votre avis</h3>

      {/* Rating */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Note *
        </label>
        <StarRating
          rating={rating}
          size="lg"
          interactive
          onChange={setRating}
        />
        {errors.rating && (
          <p className="mt-1 text-sm text-red-600">{errors.rating}</p>
        )}
      </div>

      {/* Title */}
      <div className="mb-6">
        <Input
          label="Titre de votre avis *"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Résumez votre expérience"
          error={errors.title}
          maxLength={100}
        />
        <p className="mt-1 text-xs text-gray-500">
          {title.length}/100 caractères
        </p>
      </div>

      {/* Comment */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Votre commentaire *
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Partagez votre expérience avec ce produit..."
          rows={5}
          maxLength={1000}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring \${
            errors.comment ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.comment && (
          <p className="mt-1 text-sm text-red-600">{errors.comment}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          {comment.length}/1000 caractères (minimum 10)
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          Publier mon avis
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
        )}
      </div>

      <p className="mt-4 text-xs text-gray-500">
        * Champs obligatoires. Votre avis sera publié après modération.
      </p>
    </form>
  );
};

export default ReviewForm;
