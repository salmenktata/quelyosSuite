'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseNewsletterPopupOptions {
  enabled?: boolean;
  delaySeconds?: number; // Délai avant affichage (en secondes)
  exitIntentEnabled?: boolean; // Activer la détection exit intent
}

/**
 * Hook pour gérer l'affichage du Newsletter Popup
 * Gère :
 * - Exit intent (mouvement souris vers le haut)
 * - Délai configurable
 * - Stockage localStorage pour ne pas afficher plusieurs fois
 */
export function useNewsletterPopup(options: UseNewsletterPopupOptions = {}) {
  const {
    enabled = true,
    delaySeconds = 30,
    exitIntentEnabled = true,
  } = options;

  const [isOpen, setIsOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Vérifier si le popup peut être affiché
  const canShowPopup = useCallback(() => {
    if (!enabled) return false;

    // Vérifier si l'utilisateur est déjà inscrit
    const isSubscribed = localStorage.getItem('newsletter_subscribed');
    if (isSubscribed === 'true') return false;

    // Vérifier si l'utilisateur a fermé le popup récemment
    const dismissedUntil = localStorage.getItem('newsletter_popup_dismissed');
    if (dismissedUntil) {
      const dismissedDate = new Date(dismissedUntil);
      if (dismissedDate > new Date()) {
        return false;
      }
    }

    return true;
  }, [enabled]);

  // Gérer l'exit intent
  useEffect(() => {
    if (!exitIntentEnabled || !isReady || !canShowPopup()) return;

    const handleMouseLeave = (e: MouseEvent) => {
      // Détecter si la souris sort par le haut de la page
      if (e.clientY <= 0) {
        setIsOpen(true);
      }
    };

    // Ajouter un délai avant d'activer l'exit intent (éviter affichage immédiat)
    const timeout = setTimeout(() => {
      document.addEventListener('mouseleave', handleMouseLeave);
    }, 2000);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [exitIntentEnabled, isReady, canShowPopup]);

  // Gérer le délai d'affichage automatique
  useEffect(() => {
    if (!canShowPopup()) return;

    const timeout = setTimeout(() => {
      setIsReady(true);
      // Afficher automatiquement après le délai si exit intent n'a pas déjà ouvert
      if (!isOpen) {
        setIsOpen(true);
      }
    }, delaySeconds * 1000);

    return () => clearTimeout(timeout);
  }, [delaySeconds, canShowPopup, isOpen]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    onClose: handleClose,
  };
}
