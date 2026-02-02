/**
 * ServiceWorkerRegistration - Enregistre le Service Worker pour la PWA
 */

'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Attendre que la page soit chargée
      window.addEventListener('load', () => {
        registerServiceWorker();
      });
    }
  }, []);

  return null;
}

async function registerServiceWorker() {
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    logger.info('Service Worker registered:', registration.scope);

    // Vérifier les mises à jour
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Nouvelle version disponible
            logger.info('New Service Worker available');
            // Optionnel : afficher une notification pour recharger
            if (confirm('Une nouvelle version est disponible. Recharger maintenant ?')) {
              newWorker.postMessage('skipWaiting');
              window.location.reload();
            }
          }
        });
      }
    });
  } catch (error) {
    logger.error('Service Worker registration failed:', error);
  }
}
