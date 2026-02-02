'use client';

import React, { useState, useEffect } from 'react';
import { useSiteConfig } from '@/lib/config/SiteConfigProvider';

interface NewsletterPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Newsletter Popup Component
 * Captures email addresses for newsletter subscription
 * Features:
 * - Exit intent detection
 * - Configurable delay
 * - Local storage to prevent repeated displays
 * - Modern, attractive design
 */
export function NewsletterPopup({ isOpen, onClose }: NewsletterPopupProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const config = useSiteConfig();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Validation email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Veuillez entrer une adresse email valide');
        setIsSubmitting(false);
        return;
      }

      // TODO: Intégrer avec l'API backend pour enregistrer l&apos;email
      // Pour l&apos;instant, simulation d&apos;un appel API
      await new Promise(resolve => setTimeout(resolve, 1000));

      setIsSuccess(true);

      // Stocker dans localStorage pour ne plus afficher
      localStorage.setItem('newsletter_subscribed', 'true');
      localStorage.setItem('newsletter_email', email);

      // Fermer automatiquement après 2 secondes
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (_err) {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Stocker que l&apos;utilisateur a fermé le popup (ne plus afficher pendant 30 jours)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    localStorage.setItem('newsletter_popup_dismissed', thirtyDaysFromNow.toISOString());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="relative max-w-md w-full bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl overflow-hidden animate-slideUp">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-all hover:bg-gray-200 hover:text-gray-900 hover:scale-110"
          aria-label="Fermer"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {!isSuccess ? (
          <div className="p-8">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
              Ne manquez rien !
            </h2>

            {/* Description */}
            <p className="text-center text-gray-600 mb-6">
              Inscrivez-vous à notre newsletter et recevez en exclusivité :
            </p>

            {/* Benefits List */}
            <ul className="space-y-2 mb-6">
              {[
                '🎁 10% de réduction sur votre première commande',
                '⚡ Les offres flash en avant-première',
                '🆕 Les nouveautés avant tout le monde',
                '💡 Des conseils et astuces exclusifs',
              ].map((benefit, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-lg">{benefit.split(' ')[0]}</span>
                  <span>{benefit.substring(benefit.indexOf(' ') + 1)}</span>
                </li>
              ))}
            </ul>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Votre adresse email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 placeholder-gray-400"
                  required
                  disabled={isSubmitting}
                />
                {error && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-primary to-primary-dark text-white py-3 rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Inscription en cours...
                  </span>
                ) : (
                  "Je m&apos;inscris gratuitement"
                )}
              </button>
            </form>

            {/* Privacy notice */}
            <p className="mt-4 text-xs text-center text-gray-500">
              En vous inscrivant, vous acceptez de recevoir nos offres par email.
              Vous pouvez vous désinscrire à tout moment.
            </p>
          </div>
        ) : (
          // Success State
          <div className="p-8 text-center">
            {/* Success Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Merci pour votre inscription !
            </h2>

            <p className="text-gray-600">
              Consultez votre boîte mail pour confirmer votre inscription et recevoir votre code de réduction.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default NewsletterPopup;
