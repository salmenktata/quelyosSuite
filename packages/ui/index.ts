// Shared UI Components - shadcn/ui based
export { Button, buttonVariants } from "./button"
export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent } from "./card"
export { Input } from "./input"
export { Avatar, AvatarImage, AvatarFallback } from "./avatar"
export { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs"
export { cn } from "./lib/utils"

// Animation Components - Framer Motion based
export {
  // Base component
  Animated,

  // Fade components
  FadeIn,
  FadeInUp,
  FadeInDown,

  // Slide components
  SlideInLeft,
  SlideInRight,
  SlideInUp,
  SlideInDown,

  // Scale components
  ScaleIn,
  ScaleInBounce,

  // Rotate components
  RotateIn,

  // Bounce components
  BounceIn,

  // Combined components
  SlideAndScale,
  FadeScaleRotate,

  // Stagger components
  StaggerContainer,
  StaggerItem,

  // Hover components
  Hoverable,

  // AnimatePresence
  AnimatePresence,

  // Types
  type AnimatedProps,
  type StaggerProps,
  type HoverProps,
} from "./animated"

// Animation Variants
export {
  // Individual variants
  fadeIn,
  fadeInUp,
  fadeInDown,
  slideInLeft,
  slideInRight,
  slideInUp,
  slideInDown,
  scaleIn,
  scaleInBounce,
  scaleUp,
  rotateIn,
  rotate360,
  bounceIn,
  bounce,
  staggerContainer,
  staggerContainerFast,
  listItem,
  hoverScale,
  hoverLift,
  hoverRotate,
  slideAndScale,
  fadeScaleRotate,

  // All variants object
  animationVariants,

  // Transitions
  transitions,

  // Types
  type AnimationVariantKey,
} from "./animation-variants"

// Animation Hooks
export {
  useAnimationEnabled,
  useViewportAnimation,
  useStaggerDelay,
  useScrollAnimation,
  useDelayedAnimation,
  usePrefersReducedMotion,
  useAnimationFrame,
} from "./use-animation"

// Glass UI Components - Glassmorphism effects
export {
  GlassCard,
  GlassPanel,
  GlassBadge,
  GlassListItem,
  GlassButton,
  GlassInput,
  GlassSelect,
  GlassModal,
  GlassTable,
  GlassTableHeader,
  GlassTableBody,
  GlassTableRow,
  GlassTableCell,
  GlassTableHeaderCell,
  GlassStatCard,
} from './glass'

// Login Component - Generic login page
export { Login } from './Login'
