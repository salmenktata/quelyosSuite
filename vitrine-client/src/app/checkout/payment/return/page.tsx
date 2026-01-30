'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/common';
import { logger } from '@/lib/logger';

function PaymentReturnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'cancel'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Get status from URL params
    const urlStatus = searchParams.get('status');
    const paymentId = searchParams.get('payment_id');
    const transactionRef = searchParams.get('transaction_ref');

    logger.debug('Payment return page loaded', {
      status: urlStatus,
      paymentId,
      transactionRef,
    });

    if (urlStatus === 'success') {
      setStatus('success');
      setMessage('Votre paiement a été effectué avec succès !');

      // Redirect to success page after 3 seconds
      setTimeout(() => {
        router.push('/checkout/success');
      }, 3000);
    } else if (urlStatus === 'fail' || urlStatus === 'error') {
      setStatus('error');
      setMessage('Le paiement a échoué. Veuillez réessayer.');
    } else if (urlStatus === 'cancel') {
      setStatus('cancel');
      setMessage('Le paiement a été annulé.');
    } else {
      setStatus('error');
      setMessage('Statut de paiement inconnu.');
    }
  }, [searchParams, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <Loader2 className="w-16 h-16 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Traitement en cours
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Veuillez patienter pendant que nous vérifions votre paiement...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full">
        {/* Status Icon */}
        <div className="flex justify-center mb-6">
          {status === 'success' && (
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
          )}
          {status === 'error' && (
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
            </div>
          )}
          {status === 'cancel' && (
            <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
              <AlertCircle className="w-12 h-12 text-yellow-600 dark:text-yellow-400" />
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4">
          {status === 'success' && 'Paiement réussi !'}
          {status === 'error' && 'Paiement échoué'}
          {status === 'cancel' && 'Paiement annulé'}
        </h1>

        {/* Message */}
        <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
          {message}
        </p>

        {/* Actions */}
        <div className="space-y-3">
          {status === 'success' ? (
            <>
              <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-4">
                Redirection automatique dans quelques secondes...
              </p>
              <Link href="/checkout/success" className="block">
                <Button variant="primary" className="w-full">
                  Voir ma commande
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/checkout/payment" className="block">
                <Button variant="primary" className="w-full">
                  Réessayer le paiement
                </Button>
              </Link>
              <Link href="/cart" className="block">
                <Button variant="outline" className="w-full">
                  Retour au panier
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Help Text */}
        {status !== 'success' && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-center text-gray-600 dark:text-gray-400">
              Besoin d&apos;aide ?{' '}
              <Link href="/contact" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                Contactez-nous
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <Loader2 className="w-16 h-16 text-indigo-600 dark:text-indigo-400 animate-spin" />
        </div>
      }
    >
      <PaymentReturnContent />
    </Suspense>
  );
}
