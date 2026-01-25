/**
 * Configurations de transitions Framer Motion
 * Définit les timings et easing cohérents pour toute l'application
 */

import { Transition } from 'framer-motion';

/**
 * Transition spring par défaut
 * Mouvement naturel et rebondissant
 */
export const defaultSpring: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 20,
};

/**
 * Spring rapide
 * Pour les interactions immédiates (boutons, toggles)
 */
export const fastSpring: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 25,
};

/**
 * Spring doux
 * Pour les animations plus lentes et élégantes
 */
export const smoothSpring: Transition = {
  type: 'spring',
  stiffness: 100,
  damping: 15,
};

/**
 * Transition tween rapide
 * Mouvement linéaire pour les fades simples
 */
export const fastTween: Transition = {
  duration: 0.2,
  ease: 'easeInOut',
};

/**
 * Tween moyen
 * Transition standard pour la plupart des cas
 */
export const mediumTween: Transition = {
  duration: 0.3,
  ease: 'easeOut',
};

/**
 * Tween lent
 * Pour les grandes transitions (page changes, etc.)
 */
export const slowTween: Transition = {
  duration: 0.5,
  ease: 'easeInOut',
};

/**
 * Easing personnalisé - Ease Out Cubic
 * Courbe naturelle pour les entrées
 */
export const easeOutCubic = [0.33, 1, 0.68, 1];

/**
 * Easing personnalisé - Ease In Out Cubic
 * Courbe symétrique pour les transitions bidirectionnelles
 */
export const easeInOutCubic = [0.65, 0, 0.35, 1];

/**
 * Easing personnalisé - Ease Out Expo
 * Décélération forte pour un effet dramatique
 */
export const easeOutExpo = [0.19, 1, 0.22, 1];

/**
 * Configuration pour les hover effects
 */
export const hoverTransition: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 20,
};

/**
 * Configuration pour les drag gestures
 */
export const dragTransition: Transition = {
  type: 'spring',
  stiffness: 600,
  damping: 40,
};

/**
 * Configuration pour les layout animations
 * Utilisé avec layout prop de Framer Motion
 */
export const layoutTransition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
};

/**
 * Configuration pour les stagger animations
 * Délai entre chaque enfant
 */
export const staggerConfig = {
  staggerChildren: 0.08,
  delayChildren: 0.1,
};

/**
 * Configuration pour les page transitions
 * Plus lent pour permettre le changement de contenu
 */
export const pageTransition: Transition = {
  duration: 0.4,
  ease: easeInOutCubic as any,
};

/**
 * Helper function pour créer une transition avec délai
 */
export const withDelay = (transition: Transition, delay: number): Transition => ({
  ...transition,
  delay,
});

/**
 * Helper function pour créer un spring personnalisé
 */
export const customSpring = (
  stiffness: number = 260,
  damping: number = 20
): Transition => ({
  type: 'spring',
  stiffness,
  damping,
});

/**
 * Préréglages de durée en millisecondes
 * Utile pour setTimeout, delays, etc.
 */
export const durations = {
  instant: 100,
  fast: 200,
  medium: 300,
  slow: 500,
  verySlow: 800,
} as const;
