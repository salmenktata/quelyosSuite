/**
 * Bibliothèque de variants Framer Motion réutilisables
 * Définit les animations communes pour une expérience cohérente
 */

import { Variants } from 'framer-motion';

/**
 * Container avec effet stagger pour les enfants
 * Utilisé pour animer une liste/grille d'éléments en cascade
 */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

/**
 * Item enfant d'un staggerContainer
 * Animation fade-in + slide-up
 */
export const staggerItem: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  },
};

/**
 * Feedback tactile au tap/click
 * Réduit légèrement l'échelle pour simuler une pression
 */
export const scaleOnTap: Variants = {
  tap: {
    scale: 0.95,
    transition: {
      duration: 0.1,
      ease: 'easeInOut',
    },
  },
};

/**
 * Fade in simple
 * Transition douce d'opacité
 */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

/**
 * Slide up depuis le bas
 * Utilisé pour les modals, toasts, etc.
 */
export const slideUp: Variants = {
  hidden: {
    y: '100%',
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    y: '100%',
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

/**
 * Slide depuis la droite
 * Utilisé pour les drawers, side panels
 */
export const slideFromRight: Variants = {
  hidden: {
    x: '100%',
    opacity: 0,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: {
      duration: 0.25,
      ease: 'easeIn',
    },
  },
};

/**
 * Scale up depuis le centre
 * Utilisé pour les modals, popups
 */
export const scaleUp: Variants = {
  hidden: {
    scale: 0.8,
    opacity: 0,
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    scale: 0.8,
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

/**
 * Hover effect pour cartes interactives
 * Élévation subtile + légère augmentation d'échelle
 */
export const cardHover: Variants = {
  rest: {
    scale: 1,
    y: 0,
  },
  hover: {
    scale: 1.02,
    y: -8,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 20,
    },
  },
};

/**
 * Animation de carousel/slider
 * Slide horizontal avec fade
 */
export const carouselItem: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 1000 : -1000,
    opacity: 0,
  }),
};

/**
 * Rotation pour les icônes d'expand/collapse
 */
export const rotate180: Variants = {
  collapsed: { rotate: 0 },
  expanded: { rotate: 180 },
};

/**
 * Animation d'apparition en cascade pour badges/chips
 * Plus rapide que staggerItem pour les petits éléments
 */
export const chipAppear: Variants = {
  hidden: {
    scale: 0,
    opacity: 0,
  },
  visible: (i: number) => ({
    scale: 1,
    opacity: 1,
    transition: {
      delay: i * 0.05,
      type: 'spring',
      stiffness: 500,
      damping: 25,
    },
  }),
  exit: {
    scale: 0,
    opacity: 0,
    transition: {
      duration: 0.15,
    },
  },
};

/**
 * Shake animation pour les erreurs ou actions invalides
 */
export const shake: Variants = {
  shake: {
    x: [0, -10, 10, -10, 10, 0],
    transition: {
      duration: 0.5,
      ease: 'easeInOut',
    },
  },
};

/**
 * Pulse animation pour attirer l'attention
 */
export const pulse: Variants = {
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};
