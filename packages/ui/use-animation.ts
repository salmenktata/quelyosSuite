/**
 * Animation Hooks for Performance Optimization
 *
 * Custom hooks for managing animations with performance in mind.
 * Includes lazy loading, viewport detection, and reduced motion support.
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { useReducedMotion, useInView } from 'framer-motion';

// ============================================
// Hook: useAnimationEnabled
// ============================================

/**
 * Determines if animations should be enabled based on user preferences
 * and device capabilities.
 */
export function useAnimationEnabled(): boolean {
  const shouldReduceMotion = useReducedMotion();
  const [isLowPowerMode, setIsLowPowerMode] = useState(false);

  useEffect(() => {
    // Check for low power mode (Safari specific)
    if (typeof window !== 'undefined') {
      const checkLowPowerMode = () => {
        // @ts-ignore - Safari specific API
        const battery = (navigator as any).battery || (navigator as any).getBattery?.();
        if (battery) {
          battery.then?.((b: any) => {
            setIsLowPowerMode(b.charging === false && b.level < 0.2);
          });
        }
      };
      checkLowPowerMode();
    }
  }, []);

  return !shouldReduceMotion && !isLowPowerMode;
}

// ============================================
// Hook: useViewportAnimation
// ============================================

export interface UseViewportAnimationOptions {
  /** Only animate once when first entering viewport */
  once?: boolean;
  /** Margin around viewport to trigger animation early */
  margin?: string;
  /** Amount of element that must be visible (0-1) */
  amount?: number | 'some' | 'all';
}

/**
 * Animate element only when it enters the viewport.
 * Improves performance by not animating off-screen elements.
 *
 * @example
 * ```tsx
 * const { ref, isInView } = useViewportAnimation({ once: true });
 * return (
 *   <motion.div
 *     ref={ref}
 *     initial={{ opacity: 0 }}
 *     animate={isInView ? { opacity: 1 } : { opacity: 0 }}
 *   >
 *     Content
 *   </motion.div>
 * );
 * ```
 */
export function useViewportAnimation(options: UseViewportAnimationOptions = {}) {
  const { once = true, margin = '0px', amount = 0.3 } = options;
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, {
    once,
    margin: margin as any,
    amount,
  });

  return { ref, isInView };
}

// ============================================
// Hook: useStaggerDelay
// ============================================

/**
 * Calculate stagger delay for list items based on index.
 * Useful for creating staggered animations without StaggerContainer.
 *
 * @example
 * ```tsx
 * const delay = useStaggerDelay(index);
 * return (
 *   <motion.div
 *     initial={{ opacity: 0 }}
 *     animate={{ opacity: 1 }}
 *     transition={{ delay }}
 *   >
 *     Item {index}
 *   </motion.div>
 * );
 * ```
 */
export function useStaggerDelay(
  index: number,
  baseDelay = 0,
  staggerAmount = 0.1
): number {
  const animationEnabled = useAnimationEnabled();
  return animationEnabled ? baseDelay + index * staggerAmount : 0;
}

// ============================================
// Hook: useScrollAnimation
// ============================================

export interface UseScrollAnimationOptions {
  /** Threshold to trigger animation (0-1) */
  threshold?: number;
  /** Root margin for intersection observer */
  rootMargin?: string;
}

/**
 * Trigger animation based on scroll position.
 * More performant than listening to scroll events.
 *
 * @example
 * ```tsx
 * const { ref, hasScrolled } = useScrollAnimation();
 * return (
 *   <motion.div
 *     ref={ref}
 *     animate={hasScrolled ? { opacity: 1 } : { opacity: 0 }}
 *   >
 *     Content
 *   </motion.div>
 * );
 * ```
 */
export function useScrollAnimation(options: UseScrollAnimationOptions = {}) {
  const { threshold = 0.1, rootMargin = '0px' } = options;
  const [hasScrolled, setHasScrolled] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasScrolled(true);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return { ref, hasScrolled };
}

// ============================================
// Hook: useDelayedAnimation
// ============================================

/**
 * Delay animation start by specified duration.
 * Useful for sequencing animations.
 *
 * @example
 * ```tsx
 * const shouldAnimate = useDelayedAnimation(500); // 500ms delay
 * return (
 *   <motion.div
 *     animate={shouldAnimate ? { opacity: 1 } : { opacity: 0 }}
 *   >
 *     Content
 *   </motion.div>
 * );
 * ```
 */
export function useDelayedAnimation(delayMs: number): boolean {
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const animationEnabled = useAnimationEnabled();

  useEffect(() => {
    if (!animationEnabled) {
      setShouldAnimate(true);
      return;
    }

    const timer = setTimeout(() => {
      setShouldAnimate(true);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [delayMs, animationEnabled]);

  return shouldAnimate;
}

// ============================================
// Hook: usePrefersReducedMotion (alias)
// ============================================

/**
 * Alias for useReducedMotion from framer-motion.
 * Checks user's motion preferences.
 */
export { useReducedMotion as usePrefersReducedMotion } from 'framer-motion';

// ============================================
// Hook: useAnimationFrame
// ============================================

/**
 * Request animation frame hook for custom animations.
 * Automatically cleans up on unmount.
 *
 * @example
 * ```tsx
 * const [rotation, setRotation] = useState(0);
 * useAnimationFrame(() => {
 *   setRotation(prev => (prev + 1) % 360);
 * });
 * ```
 */
export function useAnimationFrame(callback: (time: number) => void) {
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();

  useEffect(() => {
    const animate = (time: number) => {
      if (previousTimeRef.current !== undefined) {
        callback(time);
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [callback]);
}
