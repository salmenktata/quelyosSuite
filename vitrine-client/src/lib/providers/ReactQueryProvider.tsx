'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

/**
 * Provider React Query pour l'application
 * Configure le cache et les options par défaut
 */
export function ReactQueryProvider({ children }: { children: ReactNode }) {
  // Créer un QueryClient par instance de composant (pattern recommandé Next.js)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Désactiver les refetches automatiques en développement pour éviter trop de requêtes
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
            // Retry une fois en cas d&apos;erreur
            retry: 1,
            // Cache par défaut : 5 minutes
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000, // Garbage collection après 10 minutes
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
