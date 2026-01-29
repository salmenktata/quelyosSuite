'use client';

import React, { useState, useEffect } from 'react';
import { backendClient } from '@/lib/backend/client';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/common';
import { logger } from '@/lib/logger';

interface StockAlertProps {
  productId: number;
  productName: string;
}

/**
 * Stock Alert Component
 * Allows users to subscribe to notifications when out-of-stock products are back
 * Features:
 * - Subscribe/unsubscribe to stock alerts
 * - Email input for guests
 * - Confirmation modal
 * - Status display
 */
export function StockAlert({ productId, productName }: StockAlertProps) {
  const { user } = useAuthStore();

  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState(user?.email || '');
  const [subscribed, setSubscribed] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    checkSubscriptionStatus();
  }, [productId]);

  const checkSubscriptionStatus = async () => {
    if (!user) return;

    try {
      const response = await backendClient.getStockAlertStatus(productId);

      if (response.success && response.data) {
        setSubscribed(response.data.subscribed);
        setSubscriptionId(response.data.subscription_id || null);
      }
    } catch (error) {
      logger.error('Error checking subscription status:', error);
    }
  };

  const handleSubscribe = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Veuillez entrer une adresse email valide');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await backendClient.subscribeToStockAlert(productId, email);

      if (response.success && response.data) {
        setSuccess(response.data.message);
        setSubscribed(true);
        setSubscriptionId(response.data.subscription_id);

        // Close modal after 2 seconds
        setTimeout(() => {
          setShowModal(false);
          setSuccess(null);
        }, 2000);
      } else {
        setError(response.message || 'Échec de l\'inscription');
      }
    } catch (err) {
      logger.error('Error subscribing to stock alert:', err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!subscriptionId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await backendClient.unsubscribeFromStockAlert(subscriptionId);

      if (response.success) {
        setSubscribed(false);
        setSubscriptionId(null);
        setSuccess('Désinscription réussie');

        setTimeout(() => {
          setSuccess(null);
        }, 2000);
      } else {
        setError(response.message || 'Échec de la désinscription');
      }
    } catch (err) {
      logger.error('Error unsubscribing from stock alert:', err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Main Button */}
      {subscribed ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3">
            <svg
              className="h-5 w-5 flex-shrink-0 text-green-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium text-green-800">
              Vous serez notifié par email
            </span>
          </div>

          <button
            onClick={handleUnsubscribe}
            disabled={loading}
            className="text-sm text-gray-600 underline hover:text-gray-900"
          >
            Se désinscrire
          </button>
        </div>
      ) : (
        <Button
          onClick={() => setShowModal(true)}
          variant="secondary"
          className="w-full"
        >
          <svg
            className="mr-2 h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          M'alerter du retour en stock
        </Button>
      )}

      {/* Success/Error Messages */}
      {success && (
        <div className="mt-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          {success}
        </div>
      )}

      {error && !showModal && (
        <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Subscription Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl">
            {/* Header */}
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Alerte de retour en stock
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  {productName}
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="mb-6">
              <p className="mb-4 text-sm text-gray-700">
                Saisissez votre adresse email. Nous vous enverrons un email dès que ce
                produit sera de nouveau disponible.
              </p>

              <label className="block text-sm font-medium text-gray-700">
                Adresse email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder="votre@email.com"
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                disabled={loading}
              />

              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}

              {success && (
                <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {success}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3">
              <Button
                onClick={() => setShowModal(false)}
                variant="outline"
                className="flex-1"
                disabled={loading}
              >
                Annuler
              </Button>
              <Button
                onClick={handleSubscribe}
                variant="primary"
                className="flex-1"
                disabled={loading || !email}
              >
                {loading ? 'Envoi...' : 'M\'alerter'}
              </Button>
            </div>

            {/* Info */}
            <p className="mt-4 text-xs text-gray-500">
              Vos données sont protégées. Vous pouvez vous désinscrire à tout moment.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
