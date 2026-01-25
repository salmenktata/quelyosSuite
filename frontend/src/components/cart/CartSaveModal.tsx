'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, EnvelopeIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { odooClient } from '@/lib/odoo/client';
import { logger } from '@/lib/logger';

interface CartSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartSaveModal({ isOpen, onClose }: CartSaveModalProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [recoveryUrl, setRecoveryUrl] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!email) {
      setError('Veuillez saisir votre adresse email');
      return;
    }

    if (!validateEmail(email)) {
      setError('Format email invalide');
      return;
    }

    setIsLoading(true);

    try {
      const response = await odooClient.saveCart(email);

      if (response.success) {
        setSuccess(true);
        setRecoveryUrl(response.recovery_url || '');
        logger.info('Panier sauvegardé avec succès');

        // Fermer automatiquement après 5 secondes
        setTimeout(() => {
          handleClose();
        }, 5000);
      } else {
        setError(response.error || 'Une erreur est survenue');
        logger.error('Erreur sauvegarde panier:', response.error);
      }
    } catch (err) {
      setError('Impossible de sauvegarder le panier. Veuillez réessayer.');
      logger.error('Erreur sauvegarde panier:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setError('');
    setSuccess(false);
    setRecoveryUrl('');
    onClose();
  };

  const copyToClipboard = () => {
    if (recoveryUrl) {
      navigator.clipboard.writeText(recoveryUrl);
      // Toast notification serait idéal ici
      alert('Lien copié dans le presse-papiers !');
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-semibold leading-6 text-gray-900 dark:text-gray-100"
                    >
                      {success ? '✅ Panier sauvegardé !' : '🛒 Sauvegarder mon panier'}
                    </Dialog.Title>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {success
                        ? 'Consultez votre email pour retrouver votre panier'
                        : 'Recevez un lien pour retrouver votre panier plus tard'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Fermer"
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-400" />
                  </button>
                </div>

                {/* Success State */}
                {success ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-green-800 dark:text-green-300">
                          Email envoyé à {email}
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                          Le lien est valable pendant 7 jours
                        </p>
                      </div>
                    </div>

                    {recoveryUrl && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Lien de récupération
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={recoveryUrl}
                            readOnly
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={copyToClipboard}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                          >
                            Copier
                          </button>
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleClose}
                      className="w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      Fermer
                    </button>
                  </div>
                ) : (
                  /* Form State */
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Adresse email
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="email"
                          id="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="votre@email.com"
                          className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-gray-100 transition-colors"
                          disabled={isLoading}
                          autoFocus
                          required
                        />
                      </div>
                      {error && (
                        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                          {error}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handleClose}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                        disabled={isLoading}
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg
                              className="animate-spin h-4 w-4"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Envoi en cours...
                          </span>
                        ) : (
                          'Sauvegarder'
                        )}
                      </button>
                    </div>

                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        🔒 Nous vous enverrons un email sécurisé avec un lien
                        pour retrouver votre panier. Valable 7 jours.
                      </p>
                    </div>
                  </form>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
