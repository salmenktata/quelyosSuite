/**
 * Lazy-loaded Framer Motion components
 * Gain: -150 KB sur pages sans animations
 *
 * Usage: import { Motion } from '@/components/common/Motion';
 * <Motion.div animate={{ opacity: 1 }}>...</Motion.div>
 */

'use client';

import dynamic from 'next/dynamic';

// Lazy load motion.div
export const MotionDiv = dynamic(
  () => import('framer-motion').then((mod) => mod.motion.div),
  {
    ssr: false,
    loading: () => <div />,
  }
);

// Lazy load motion.button
export const MotionButton = dynamic(
  () => import('framer-motion').then((mod) => mod.motion.button),
  {
    ssr: false,
    loading: () => <button />,
  }
);

// Lazy load motion.span
export const MotionSpan = dynamic(
  () => import('framer-motion').then((mod) => mod.motion.span),
  {
    ssr: false,
    loading: () => <span />,
  }
);

// Lazy load motion.li
export const MotionLi = dynamic(
  () => import('framer-motion').then((mod) => mod.motion.li),
  {
    ssr: false,
    loading: () => <li />,
  }
);

// Lazy load motion.section
export const MotionSection = dynamic(
  () => import('framer-motion').then((mod) => mod.motion.section),
  {
    ssr: false,
    loading: () => <section />,
  }
);

// Lazy load motion.img
export const MotionImg = dynamic(
  () => import('framer-motion').then((mod) => mod.motion.img),
  {
    ssr: false,
    // eslint-disable-next-line @next/next/no-img-element
    loading: () => <img alt="" />,
  }
);

// Lazy load AnimatePresence
export const AnimatePresence = dynamic(
  () => import('framer-motion').then((mod) => mod.AnimatePresence),
  {
    ssr: false,
  }
);

// Export types (ne comptent pas dans le bundle)
export type { PanInfo, Variants } from 'framer-motion';

// Export groupé sous Motion.*
export const Motion = {
  div: MotionDiv,
  button: MotionButton,
  span: MotionSpan,
  li: MotionLi,
  section: MotionSection,
  img: MotionImg,
};

export default Motion;
