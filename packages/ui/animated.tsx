/**
 * Animated Components for Framer Motion
 *
 * Reusable wrapper components that apply animation variants.
 * Supports reduced motion preferences and performance optimizations.
 *
 * Usage:
 * ```tsx
 * <FadeIn>
 *   <YourContent />
 * </FadeIn>
 * ```
 */

'use client';

import { motion, type HTMLMotionProps, useReducedMotion } from 'framer-motion';
import React, { type ReactNode } from 'react';
import {
  fadeIn,
  fadeInUp,
  fadeInDown,
  slideInLeft,
  slideInRight,
  slideInUp,
  slideInDown,
  scaleIn,
  scaleInBounce,
  bounceIn,
  rotateIn,
  slideAndScale,
  fadeScaleRotate,
  staggerContainer,
  staggerContainerFast,
  listItem,
  type AnimationVariantKey,
  animationVariants,
} from './animation-variants';

// ============================================
// Types
// ============================================

export interface AnimatedProps extends Omit<HTMLMotionProps<'div'>, 'variants'> {
  children: ReactNode;
  /** Delay before animation starts (in seconds) */
  delay?: number;
  /** Duration of animation (in seconds) */
  duration?: number;
  /** Custom className */
  className?: string;
  /** Skip animation on initial render */
  skipInitial?: boolean;
  /** HTML element to render as (default: 'div') */
  as?: keyof JSX.IntrinsicElements;
}

// ============================================
// Base Animated Component
// ============================================

export const Animated: React.FC<
  AnimatedProps & { variant: AnimationVariantKey }
> = ({
  children,
  variant,
  delay = 0,
  duration,
  className,
  skipInitial = false,
  as = 'div',
  ...props
}) => {
  const shouldReduceMotion = useReducedMotion();
  const MotionComponent = motion[as as 'div'] as typeof motion.div;

  // If user prefers reduced motion, render without animation
  if (shouldReduceMotion) {
    const Component = as as any;
    return (
      <Component className={className} {...props}>
        {children}
      </Component>
    );
  }

  const selectedVariant = animationVariants[variant] as any;

  // Apply custom delay/duration if provided
  const customVariant = duration
    ? {
        ...selectedVariant,
        animate: {
          ...(selectedVariant.animate || {}),
          transition: {
            ...((selectedVariant.animate as any)?.transition || {}),
            duration,
            delay,
          },
        },
      }
    : {
        ...selectedVariant,
        animate: {
          ...(selectedVariant.animate || {}),
          transition: {
            ...((selectedVariant.animate as any)?.transition || {}),
            delay,
          },
        },
      };

  return (
    <MotionComponent
      variants={customVariant}
      initial={skipInitial ? false : 'initial'}
      animate="animate"
      exit="exit"
      className={className}
      {...props}
    >
      {children}
    </MotionComponent>
  );
};

// ============================================
// Fade Components
// ============================================

export const FadeIn: React.FC<AnimatedProps> = (props) => (
  <Animated variant="fadeIn" {...props} />
);

export const FadeInUp: React.FC<AnimatedProps> = (props) => (
  <Animated variant="fadeInUp" {...props} />
);

export const FadeInDown: React.FC<AnimatedProps> = (props) => (
  <Animated variant="fadeInDown" {...props} />
);

// ============================================
// Slide Components
// ============================================

export const SlideInLeft: React.FC<AnimatedProps> = (props) => (
  <Animated variant="slideInLeft" {...props} />
);

export const SlideInRight: React.FC<AnimatedProps> = (props) => (
  <Animated variant="slideInRight" {...props} />
);

export const SlideInUp: React.FC<AnimatedProps> = (props) => (
  <Animated variant="slideInUp" {...props} />
);

export const SlideInDown: React.FC<AnimatedProps> = (props) => (
  <Animated variant="slideInDown" {...props} />
);

// ============================================
// Scale Components
// ============================================

export const ScaleIn: React.FC<AnimatedProps> = (props) => (
  <Animated variant="scaleIn" {...props} />
);

export const ScaleInBounce: React.FC<AnimatedProps> = (props) => (
  <Animated variant="scaleInBounce" {...props} />
);

// ============================================
// Rotate Components
// ============================================

export const RotateIn: React.FC<AnimatedProps> = (props) => (
  <Animated variant="rotateIn" {...props} />
);

// ============================================
// Bounce Components
// ============================================

export const BounceIn: React.FC<AnimatedProps> = (props) => (
  <Animated variant="bounceIn" {...props} />
);

// ============================================
// Combined Components
// ============================================

export const SlideAndScale: React.FC<AnimatedProps> = (props) => (
  <Animated variant="slideAndScale" {...props} />
);

export const FadeScaleRotate: React.FC<AnimatedProps> = (props) => (
  <Animated variant="fadeScaleRotate" {...props} />
);

// ============================================
// Stagger Container Components
// ============================================

export interface StaggerProps extends AnimatedProps {
  /** Delay between each child animation (in seconds) */
  staggerDelay?: number;
  /** Speed variant */
  speed?: 'normal' | 'fast';
}

export const StaggerContainer: React.FC<StaggerProps> = ({
  children,
  speed = 'normal',
  delay = 0,
  className,
  skipInitial = false,
  as = 'div',
  staggerDelay,
  ...props
}) => {
  const shouldReduceMotion = useReducedMotion();
  const MotionComponent = motion[as as 'div'] as typeof motion.div;

  if (shouldReduceMotion) {
    const Component = as as any;
    return (
      <Component className={className} {...props}>
        {children}
      </Component>
    );
  }

  const variant = speed === 'fast' ? staggerContainerFast : staggerContainer;

  // Apply custom stagger delay if provided
  const customVariant = staggerDelay
    ? {
        ...variant,
        animate: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: delay,
          },
        },
      }
    : {
        ...variant,
        animate: {
          ...variant.animate,
          transition: {
            ...(variant.animate as any).transition,
            delayChildren: delay,
          },
        },
      };

  return (
    <MotionComponent
      variants={customVariant}
      initial={skipInitial ? false : 'initial'}
      animate="animate"
      exit="exit"
      className={className}
      {...props}
    >
      {children}
    </MotionComponent>
  );
};

// ============================================
// List Item Component (for use with StaggerContainer)
// ============================================

export const StaggerItem: React.FC<AnimatedProps> = ({
  children,
  className,
  as = 'div',
  ...props
}) => {
  const shouldReduceMotion = useReducedMotion();
  const MotionComponent = motion[as as 'div'] as typeof motion.div;

  if (shouldReduceMotion) {
    const Component = as as any;
    return (
      <Component className={className} {...props}>
        {children}
      </Component>
    );
  }

  return (
    <MotionComponent variants={listItem} className={className} {...props}>
      {children}
    </MotionComponent>
  );
};

// ============================================
// Hover Effects Components
// ============================================

export interface HoverProps extends AnimatedProps {
  /** Enable scale on hover */
  enableScale?: boolean;
  /** Enable lift on hover */
  enableLift?: boolean;
  /** Enable rotation on hover */
  enableRotate?: boolean;
}

export const Hoverable: React.FC<HoverProps> = ({
  children,
  enableScale = true,
  enableLift = false,
  enableRotate = false,
  className,
  as = 'div',
  ...props
}) => {
  const shouldReduceMotion = useReducedMotion();
  const MotionComponent = motion[as as 'div'] as typeof motion.div;

  const whileHover: any = {};
  const whileTap: any = {};

  if (!shouldReduceMotion) {
    if (enableScale) {
      whileHover.scale = 1.05;
      whileTap.scale = 0.95;
    }
    if (enableLift) {
      whileHover.y = -4;
      whileHover.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.15)';
      whileTap.y = 0;
      whileTap.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.1)';
    }
    if (enableRotate) {
      whileHover.rotate = 5;
      whileTap.rotate = -5;
    }
  }

  return (
    <MotionComponent
      whileHover={whileHover}
      whileTap={whileTap}
      className={className}
      {...props}
    >
      {children}
    </MotionComponent>
  );
};

// ============================================
// Animated Presence Wrapper
// ============================================

export { AnimatePresence } from 'framer-motion';
