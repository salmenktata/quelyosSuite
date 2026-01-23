/**
 * Page checkout - Redirection vers l'étape de livraison
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingPage } from '@/components/common/Loading';

export default function CheckoutPage() {
  const router = useRouter();

  useEffect(() => {
    // Rediriger vers la première étape (livraison)
    router.replace('/checkout/shipping');
  }, [router]);

  return <LoadingPage />;
}
