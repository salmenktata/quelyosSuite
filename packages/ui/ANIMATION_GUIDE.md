# Framer Motion Animation Guide

Complete guide for using Framer Motion animations in Quelyos.

## 📚 Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Components](#components)
- [Variants](#variants)
- [Hooks](#hooks)
- [Performance](#performance)
- [Examples](#examples)
- [Best Practices](#best-practices)

---

## Installation

Framer Motion is already installed in the `@quelyos/ui` package.

```tsx
import { FadeIn, SlideInUp, ScaleIn } from '@quelyos/ui/animated';
import { fadeIn, slideInLeft } from '@quelyos/ui/animation-variants';
import { useViewportAnimation, useAnimationEnabled } from '@quelyos/ui/use-animation';
```

---

## Quick Start

### Basic Animation

```tsx
import { FadeIn } from '@quelyos/ui/animated';

export function MyComponent() {
  return (
    <FadeIn>
      <div>This content will fade in</div>
    </FadeIn>
  );
}
```

### With Delay

```tsx
<FadeIn delay={0.5}>
  <div>Fades in after 500ms</div>
</FadeIn>
```

### Custom Duration

```tsx
<SlideInLeft duration={0.8}>
  <div>Slides in slowly</div>
</SlideInLeft>
```

---

## Components

### Fade Components

#### `<FadeIn>`
Simple fade-in animation.

```tsx
<FadeIn delay={0.2}>
  <Card>Content</Card>
</FadeIn>
```

#### `<FadeInUp>`
Fade in while moving up.

```tsx
<FadeInUp>
  <h1>Title</h1>
</FadeInUp>
```

#### `<FadeInDown>`
Fade in while moving down.

```tsx
<FadeInDown>
  <p>Subtitle</p>
</FadeInDown>
```

---

### Slide Components

#### `<SlideInLeft>`
Slide in from the left.

```tsx
<SlideInLeft>
  <aside>Sidebar content</aside>
</SlideInLeft>
```

#### `<SlideInRight>`
Slide in from the right.

```tsx
<SlideInRight>
  <div>Panel content</div>
</SlideInRight>
```

#### `<SlideInUp>`
Slide in from the bottom.

```tsx
<SlideInUp>
  <footer>Footer content</footer>
</SlideInUp>
```

#### `<SlideInDown>`
Slide in from the top.

```tsx
<SlideInDown>
  <header>Header content</header>
</SlideInDown>
```

---

### Scale Components

#### `<ScaleIn>`
Scale up with fade.

```tsx
<ScaleIn>
  <button>Click me</button>
</ScaleIn>
```

#### `<ScaleInBounce>`
Scale up with bounce effect.

```tsx
<ScaleInBounce>
  <div className="icon">🎉</div>
</ScaleInBounce>
```

---

### Special Components

#### `<RotateIn>`
Rotate while fading in.

```tsx
<RotateIn>
  <img src="/logo.svg" alt="Logo" />
</RotateIn>
```

#### `<BounceIn>`
Bounce in from above.

```tsx
<BounceIn>
  <div className="notification">New message!</div>
</BounceIn>
```

---

### Stagger Animations

Animate children in sequence.

#### `<StaggerContainer>` + `<StaggerItem>`

```tsx
import { StaggerContainer, StaggerItem } from '@quelyos/ui/animated';

export function List({ items }) {
  return (
    <StaggerContainer>
      {items.map((item) => (
        <StaggerItem key={item.id}>
          <Card>{item.name}</Card>
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}
```

#### Fast Stagger

```tsx
<StaggerContainer speed="fast" staggerDelay={0.05}>
  {/* Children animate quickly */}
</StaggerContainer>
```

---

### Hover Effects

#### `<Hoverable>`

Add interactive hover animations.

```tsx
import { Hoverable } from '@quelyos/ui/animated';

// Scale on hover
<Hoverable enableScale>
  <button>Hover me</button>
</Hoverable>

// Lift on hover
<Hoverable enableLift>
  <Card>Hover to lift</Card>
</Hoverable>

// Rotate on hover
<Hoverable enableRotate>
  <div className="icon">⚙️</div>
</Hoverable>

// Multiple effects
<Hoverable enableScale enableLift>
  <Card>Interactive card</Card>
</Hoverable>
```

---

### Custom Element

By default, components render as `<div>`. Change with the `as` prop:

```tsx
// Render as section
<FadeIn as="section">
  <h2>Section title</h2>
</FadeIn>

// Render as article
<SlideInUp as="article">
  <p>Article content</p>
</SlideInUp>

// Render as li
<StaggerItem as="li">
  <span>List item</span>
</StaggerItem>
```

---

## Variants

Use variants directly with Framer Motion components for more control.

```tsx
import { motion } from 'framer-motion';
import { fadeIn, slideInLeft, scaleIn } from '@quelyos/ui/animation-variants';

export function CustomComponent() {
  return (
    <motion.div
      variants={fadeIn}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <p>Custom animated content</p>
    </motion.div>
  );
}
```

### Available Variants

**Fade:**
- `fadeIn` - Simple fade
- `fadeInUp` - Fade up
- `fadeInDown` - Fade down

**Slide:**
- `slideInLeft` - From left
- `slideInRight` - From right
- `slideInUp` - From bottom
- `slideInDown` - From top

**Scale:**
- `scaleIn` - Smooth scale
- `scaleInBounce` - Bouncy scale
- `scaleUp` - Scale hover effect

**Rotate:**
- `rotateIn` - Rotate and fade
- `rotate360` - Full rotation

**Bounce:**
- `bounceIn` - Bounce from top
- `bounce` - Continuous bounce (loop)

**Combined:**
- `slideAndScale` - Slide + scale combo
- `fadeScaleRotate` - Fade + scale + rotate combo

**Stagger:**
- `staggerContainer` - Container for stagger
- `staggerContainerFast` - Fast stagger
- `listItem` - Item for stagger

**Hover:**
- `hoverScale` - Scale on hover
- `hoverLift` - Lift on hover
- `hoverRotate` - Rotate on hover

---

## Hooks

### `useAnimationEnabled()`

Check if animations should be enabled (respects reduced motion).

```tsx
import { useAnimationEnabled } from '@quelyos/ui/use-animation';

export function Component() {
  const animationEnabled = useAnimationEnabled();

  return (
    <div className={animationEnabled ? 'animated' : 'static'}>
      Content
    </div>
  );
}
```

---

### `useViewportAnimation()`

Animate only when element enters viewport (performance optimization).

```tsx
import { useViewportAnimation } from '@quelyos/ui/use-animation';
import { motion } from 'framer-motion';

export function LazyComponent() {
  const { ref, isInView } = useViewportAnimation({ once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
    >
      Only animates when visible
    </motion.div>
  );
}
```

**Options:**
- `once` - Animate only first time (default: true)
- `margin` - Trigger margin around viewport (default: '0px')
- `amount` - Visible amount to trigger (default: 0.3)

---

### `useStaggerDelay()`

Calculate stagger delay for list items.

```tsx
import { useStaggerDelay } from '@quelyos/ui/use-animation';

export function ListItem({ index }) {
  const delay = useStaggerDelay(index, 0, 0.1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
    >
      Item {index}
    </motion.div>
  );
}
```

---

### `useDelayedAnimation()`

Start animation after a delay.

```tsx
import { useDelayedAnimation } from '@quelyos/ui/use-animation';

export function DelayedComponent() {
  const shouldAnimate = useDelayedAnimation(1000); // 1s delay

  return (
    <motion.div
      animate={shouldAnimate ? { opacity: 1 } : { opacity: 0 }}
    >
      Appears after 1 second
    </motion.div>
  );
}
```

---

## Performance

### Reduced Motion

All components **automatically respect** user's reduced motion preferences.

```tsx
// No extra code needed - already handled
<FadeIn>
  <div>Respects prefers-reduced-motion</div>
</FadeIn>
```

To check manually:

```tsx
import { usePrefersReducedMotion } from '@quelyos/ui/use-animation';

const prefersReduced = usePrefersReducedMotion();
```

---

### Viewport-Based Animation

Animate only visible elements to save performance:

```tsx
import { useViewportAnimation } from '@quelyos/ui/use-animation';

export function HeavyComponent() {
  const { ref, isInView } = useViewportAnimation();

  return (
    <motion.div
      ref={ref}
      animate={isInView ? 'visible' : 'hidden'}
      variants={{
        visible: { opacity: 1 },
        hidden: { opacity: 0 },
      }}
    >
      Only animates when scrolled into view
    </motion.div>
  );
}
```

---

### Skip Initial Animation

For already-visible content, skip initial animation:

```tsx
<FadeIn skipInitial>
  <header>Header (no initial animation)</header>
</FadeIn>
```

---

## Examples

### Hero Section

```tsx
import { FadeIn, SlideInUp } from '@quelyos/ui/animated';

export function Hero() {
  return (
    <section>
      <FadeIn>
        <h1>Welcome to Quelyos</h1>
      </FadeIn>
      <SlideInUp delay={0.2}>
        <p>Financial management made simple</p>
      </SlideInUp>
      <SlideInUp delay={0.4}>
        <button>Get Started</button>
      </SlideInUp>
    </section>
  );
}
```

---

### Card Grid

```tsx
import { StaggerContainer, StaggerItem, ScaleIn } from '@quelyos/ui/animated';

export function CardGrid({ cards }) {
  return (
    <StaggerContainer className="grid grid-cols-3 gap-4">
      {cards.map((card) => (
        <StaggerItem key={card.id}>
          <Hoverable enableScale enableLift>
            <Card>{card.title}</Card>
          </Hoverable>
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}
```

---

### Modal

```tsx
import { ScaleInBounce, AnimatePresence } from '@quelyos/ui/animated';

export function Modal({ isOpen, onClose, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="backdrop"
            onClick={onClose}
          />
          <ScaleInBounce className="modal">
            {children}
          </ScaleInBounce>
        </>
      )}
    </AnimatePresence>
  );
}
```

---

### Notification Toast

```tsx
import { SlideInRight, AnimatePresence } from '@quelyos/ui/animated';

export function Toast({ message, visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <SlideInRight className="toast">
          {message}
        </SlideInRight>
      )}
    </AnimatePresence>
  );
}
```

---

### Sidebar

```tsx
import { SlideInLeft } from '@quelyos/ui/animated';

export function Sidebar() {
  return (
    <SlideInLeft as="aside" className="sidebar">
      <nav>
        {/* Navigation items */}
      </nav>
    </SlideInLeft>
  );
}
```

---

## Best Practices

### ✅ Do's

1. **Respect reduced motion** - Already handled automatically
2. **Use viewport animations** - For long pages with many animations
3. **Stagger list items** - Makes lists feel more alive
4. **Keep durations short** - 0.3-0.6s is usually enough
5. **Use easing** - Spring animations feel natural
6. **Combine animations** - Fade + slide/scale works well

### ❌ Don'ts

1. **Don't over-animate** - Not everything needs animation
2. **Don't animate large elements** - Hurts performance
3. **Don't use long durations** - Users will wait
4. **Don't animate on every state change** - Becomes annoying
5. **Don't forget exit animations** - Use `<AnimatePresence>`

---

### Animation Hierarchy

**Always animate (high value):**
- Page/route transitions
- Modal open/close
- Dropdown menus
- Notifications/toasts

**Sometimes animate (medium value):**
- Card hover effects
- Button feedback
- List item appearances
- Scroll-triggered content

**Rarely animate (low value):**
- Static content
- Background elements
- Performance-critical areas
- Accessibility-focused content

---

## Performance Tips

### 1. Use `transform` Properties

Animate `x`, `y`, `scale`, `rotate` - these are GPU-accelerated.

```tsx
// ✅ Good - GPU accelerated
<motion.div animate={{ x: 100 }} />

// ❌ Bad - CPU only
<motion.div animate={{ left: 100 }} />
```

### 2. Use `opacity`

Opacity is also GPU-accelerated.

```tsx
// ✅ Good
<motion.div animate={{ opacity: 1 }} />
```

### 3. Avoid Layout Changes

Don't animate `width`, `height`, `padding`, `margin` - they trigger layout recalculation.

```tsx
// ❌ Bad - triggers layout
<motion.div animate={{ width: 200 }} />

// ✅ Good - use scale instead
<motion.div animate={{ scaleX: 2 }} />
```

### 4. Use Viewport Detection

```tsx
const { ref, isInView } = useViewportAnimation();
// Only animate when visible
```

---

## Troubleshooting

### Animations not working?

1. Check if component is inside `<AnimatePresence>` for exit animations
2. Verify `framer-motion` is installed
3. Check browser console for errors
4. Try `skipInitial` if content is already visible

### Performance issues?

1. Use `useViewportAnimation` for off-screen elements
2. Reduce number of simultaneous animations
3. Check if animating layout properties (width/height)
4. Use Chrome DevTools Performance tab

### Animations too slow/fast?

1. Adjust `duration` prop: `<FadeIn duration={0.3}>`
2. Use different transition: `transitions.instant` vs `transitions.slow`
3. Adjust stagger delay: `<StaggerContainer staggerDelay={0.05}>`

---

## Resources

- [Framer Motion Docs](https://www.framer.com/motion/)
- [Animation Performance](https://web.dev/animations/)
- [Reduced Motion](https://web.dev/prefers-reduced-motion/)

---

**Happy animating! 🎉**
