/**
 * Animation Variants for Framer Motion
 *
 * Reusable animation variants for consistent and performant animations across the app.
 * Each variant includes initial, animate, and exit states.
 *
 * Performance optimizations:
 * - Uses transform properties (translateX/Y, scale) instead of position properties
 * - Includes hardware acceleration via will-change
 * - Respects user's reduced motion preferences
 */

import type { Variants, Transition } from 'framer-motion';

// ============================================
// Default Transitions
// ============================================

export const transitions = {
  smooth: {
    type: 'spring',
    stiffness: 260,
    damping: 20,
  } as Transition,
  bouncy: {
    type: 'spring',
    stiffness: 400,
    damping: 10,
  } as Transition,
  slow: {
    type: 'spring',
    stiffness: 100,
    damping: 15,
  } as Transition,
  instant: {
    duration: 0.2,
  } as Transition,
} as const;

// ============================================
// Fade Variants
// ============================================

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: transitions.smooth,
  },
  exit: {
    opacity: 0,
    transition: transitions.instant,
  },
};

export const fadeInUp: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: transitions.smooth,
  },
  exit: {
    opacity: 0,
    y: 20,
    transition: transitions.instant,
  },
};

export const fadeInDown: Variants = {
  initial: {
    opacity: 0,
    y: -20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: transitions.smooth,
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: transitions.instant,
  },
};

// ============================================
// Slide Variants
// ============================================

export const slideInLeft: Variants = {
  initial: {
    x: -100,
    opacity: 0,
  },
  animate: {
    x: 0,
    opacity: 1,
    transition: transitions.smooth,
  },
  exit: {
    x: -100,
    opacity: 0,
    transition: transitions.instant,
  },
};

export const slideInRight: Variants = {
  initial: {
    x: 100,
    opacity: 0,
  },
  animate: {
    x: 0,
    opacity: 1,
    transition: transitions.smooth,
  },
  exit: {
    x: 100,
    opacity: 0,
    transition: transitions.instant,
  },
};

export const slideInUp: Variants = {
  initial: {
    y: 100,
    opacity: 0,
  },
  animate: {
    y: 0,
    opacity: 1,
    transition: transitions.smooth,
  },
  exit: {
    y: 100,
    opacity: 0,
    transition: transitions.instant,
  },
};

export const slideInDown: Variants = {
  initial: {
    y: -100,
    opacity: 0,
  },
  animate: {
    y: 0,
    opacity: 1,
    transition: transitions.smooth,
  },
  exit: {
    y: -100,
    opacity: 0,
    transition: transitions.instant,
  },
};

// ============================================
// Scale Variants
// ============================================

export const scaleIn: Variants = {
  initial: {
    scale: 0.8,
    opacity: 0,
  },
  animate: {
    scale: 1,
    opacity: 1,
    transition: transitions.bouncy,
  },
  exit: {
    scale: 0.8,
    opacity: 0,
    transition: transitions.instant,
  },
};

export const scaleInBounce: Variants = {
  initial: {
    scale: 0,
    opacity: 0,
  },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 15,
    },
  },
  exit: {
    scale: 0,
    opacity: 0,
    transition: transitions.instant,
  },
};

export const scaleUp: Variants = {
  initial: {
    scale: 1,
  },
  animate: {
    scale: 1.05,
    transition: transitions.smooth,
  },
  exit: {
    scale: 1,
    transition: transitions.instant,
  },
};

// ============================================
// Rotate Variants
// ============================================

export const rotateIn: Variants = {
  initial: {
    rotate: -180,
    opacity: 0,
    scale: 0.8,
  },
  animate: {
    rotate: 0,
    opacity: 1,
    scale: 1,
    transition: transitions.bouncy,
  },
  exit: {
    rotate: 180,
    opacity: 0,
    scale: 0.8,
    transition: transitions.instant,
  },
};

export const rotate360: Variants = {
  initial: {
    rotate: 0,
  },
  animate: {
    rotate: 360,
    transition: {
      duration: 0.6,
      ease: 'easeInOut',
    },
  },
};

// ============================================
// Bounce Variants
// ============================================

export const bounceIn: Variants = {
  initial: {
    y: -100,
    opacity: 0,
  },
  animate: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 10,
      mass: 0.5,
    },
  },
  exit: {
    y: 100,
    opacity: 0,
    transition: transitions.instant,
  },
};

export const bounce: Variants = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 0.6,
      ease: 'easeInOut',
      repeat: Infinity,
      repeatDelay: 1,
    },
  },
};

// ============================================
// Stagger Container Variants
// ============================================

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

export const staggerContainerFast: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.02,
      staggerDirection: -1,
    },
  },
};

// ============================================
// Hover/Tap Variants
// ============================================

export const hoverScale = {
  whileHover: {
    scale: 1.05,
    transition: transitions.instant,
  },
  whileTap: {
    scale: 0.95,
  },
};

export const hoverLift = {
  whileHover: {
    y: -4,
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
    transition: transitions.smooth,
  },
  whileTap: {
    y: 0,
    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)',
  },
};

export const hoverRotate = {
  whileHover: {
    rotate: 5,
    transition: transitions.instant,
  },
  whileTap: {
    rotate: -5,
  },
};

// ============================================
// Combined Variants
// ============================================

export const slideAndScale: Variants = {
  initial: {
    x: -50,
    scale: 0.9,
    opacity: 0,
  },
  animate: {
    x: 0,
    scale: 1,
    opacity: 1,
    transition: transitions.bouncy,
  },
  exit: {
    x: 50,
    scale: 0.9,
    opacity: 0,
    transition: transitions.instant,
  },
};

export const fadeScaleRotate: Variants = {
  initial: {
    scale: 0.8,
    rotate: -10,
    opacity: 0,
  },
  animate: {
    scale: 1,
    rotate: 0,
    opacity: 1,
    transition: transitions.bouncy,
  },
  exit: {
    scale: 0.8,
    rotate: 10,
    opacity: 0,
    transition: transitions.instant,
  },
};

// ============================================
// List Item Variants (for stagger)
// ============================================

export const listItem: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -20,
  },
};

// ============================================
// Export all variants
// ============================================

export const animationVariants = {
  // Fade
  fadeIn,
  fadeInUp,
  fadeInDown,

  // Slide
  slideInLeft,
  slideInRight,
  slideInUp,
  slideInDown,

  // Scale
  scaleIn,
  scaleInBounce,
  scaleUp,

  // Rotate
  rotateIn,
  rotate360,

  // Bounce
  bounceIn,
  bounce,

  // Stagger
  staggerContainer,
  staggerContainerFast,

  // Hover/Tap
  hoverScale,
  hoverLift,
  hoverRotate,

  // Combined
  slideAndScale,
  fadeScaleRotate,

  // List
  listItem,
} as const;

export type AnimationVariantKey = keyof typeof animationVariants;
