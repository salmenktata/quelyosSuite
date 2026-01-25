/**
 * useKeyboardNav - Hook pour navigation au clavier
 * Gère les événements clavier pour navigation (arrows, escape, etc.)
 */

import { useEffect } from 'react';

interface KeyboardNavOptions {
  /** Callback pour flèche gauche */
  onLeft?: () => void;
  /** Callback pour flèche droite */
  onRight?: () => void;
  /** Callback pour flèche haut */
  onUp?: () => void;
  /** Callback pour flèche bas */
  onDown?: () => void;
  /** Callback pour touche Escape */
  onEscape?: () => void;
  /** Callback pour touche Enter */
  onEnter?: () => void;
  /** Activer/désactiver le hook */
  enabled?: boolean;
}

/**
 * Hook pour gérer la navigation au clavier
 * Utilisé pour galeries, modals, carousels, etc.
 */
export const useKeyboardNav = ({
  onLeft,
  onRight,
  onUp,
  onDown,
  onEscape,
  onEnter,
  enabled = true,
}: KeyboardNavOptions) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignorer si l'utilisateur est dans un input/textarea
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          onLeft?.();
          break;
        case 'ArrowRight':
          event.preventDefault();
          onRight?.();
          break;
        case 'ArrowUp':
          event.preventDefault();
          onUp?.();
          break;
        case 'ArrowDown':
          event.preventDefault();
          onDown?.();
          break;
        case 'Escape':
          event.preventDefault();
          onEscape?.();
          break;
        case 'Enter':
          event.preventDefault();
          onEnter?.();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onLeft, onRight, onUp, onDown, onEscape, onEnter, enabled]);
};

export default useKeyboardNav;
