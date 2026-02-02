'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { logger } from '@/lib/logger';

export function PushNotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Vérifier si les notifications sont supportées
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      return;
    }

    setPermission(Notification.permission);

    // Ne montrer le prompt que si:
    // 1. L'utilisateur est connecté
    // 2. La permission n&apos;est pas encore accordée/refusée
    // 3. Le prompt n&apos;a pas été ignoré récemment
    const lastDismissed = localStorage.getItem('push_prompt_dismissed');
    const dismissedTime = lastDismissed ? parseInt(lastDismissed) : 0;
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

    if (
      isAuthenticated &&
      Notification.permission === 'default' &&
      daysSinceDismissed > 7 // Redemander après 7 jours
    ) {
      // Attendre un peu avant d&apos;afficher le prompt
      const timer = setTimeout(() => setShowPrompt(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  const requestPermission = async () => {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        // S'abonner aux push
        await subscribeToPush();
        setShowPrompt(false);
      } else {
        setShowPrompt(false);
        localStorage.setItem('push_prompt_dismissed', Date.now().toString());
      }
    } catch (error) {
      logger.error('Error requesting notification permission:', error);
    }
  };

  const subscribeToPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;

      // Vérifier si déjà abonné
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        logger.info('Already subscribed to push notifications');
        return existing;
      }

      // Créer un nouvel abonnement (VAPID key serait nécessaire en production)
      // Pour la démo, on utilise une clé factice
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
        ),
      });

      logger.info('Subscribed to push notifications:', subscription.endpoint);

      // TODO: Envoyer l'abonnement au backend
      // await backendClient.savePushSubscription(subscription);

      // Notification de test locale
      sendLocalNotification(
        'Notifications activees !',
        'Vous recevrez maintenant des alertes pour les promotions et nouveautes.'
      );

      return subscription;
    } catch (error) {
      logger.error('Error subscribing to push:', error);
    }
  };

  const sendLocalNotification = (title: string, body: string) => {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
      });
    }
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
    localStorage.setItem('push_prompt_dismissed', Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 z-50 animate-slideUp">
      <button
        onClick={dismissPrompt}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
          </svg>
        </div>

        <div className="flex-1">
          <h3 className="font-bold text-gray-900 mb-1">Restez informe !</h3>
          <p className="text-sm text-gray-600 mb-4">
            Activez les notifications pour recevoir des alertes sur les promotions, les retours en stock et vos commandes.
          </p>

          <div className="flex gap-3">
            <button
              onClick={requestPermission}
              className="flex-1 bg-primary text-white py-2 px-4 rounded-lg font-semibold hover:bg-primary-dark transition-colors text-sm"
            >
              Activer
            </button>
            <button
              onClick={dismissPrompt}
              className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-sm"
            >
              Plus tard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper pour convertir la clé VAPID
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
