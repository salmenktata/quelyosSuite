/**
 * Framer Motion Animation Examples
 *
 * Copy-paste ready examples for common animation patterns.
 */

import {
  FadeIn,
  FadeInUp,
  SlideInLeft,
  SlideInRight,
  ScaleIn,
  ScaleInBounce,
  RotateIn,
  BounceIn,
  StaggerContainer,
  StaggerItem,
  Hoverable,
  AnimatePresence,
} from '@quelyos/ui/animated';
import { useViewportAnimation, useAnimationEnabled } from '@quelyos/ui/use-animation';
import { motion } from 'framer-motion';

// ============================================
// Example 1: Hero Section with Sequential Animations
// ============================================

export function HeroExample() {
  return (
    <section className="hero">
      <FadeIn>
        <h1>Welcome to Quelyos</h1>
      </FadeIn>
      <FadeInUp delay={0.2}>
        <p className="subtitle">Financial management simplified</p>
      </FadeInUp>
      <FadeInUp delay={0.4}>
        <button className="cta">Get Started</button>
      </FadeInUp>
    </section>
  );
}

// ============================================
// Example 2: Staggered Card Grid
// ============================================

export function CardGridExample({ cards }: { cards: any[] }) {
  return (
    <StaggerContainer className="grid grid-cols-3 gap-4">
      {cards.map((card) => (
        <StaggerItem key={card.id}>
          <Hoverable enableScale enableLift>
            <div className="card">
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </div>
          </Hoverable>
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}

// ============================================
// Example 3: Modal with AnimatePresence
// ============================================

export function ModalExample({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50"
            onClick={onClose}
          />

          {/* Modal */}
          <ScaleInBounce
            className="fixed inset-0 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              {children}
            </div>
          </ScaleInBounce>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================
// Example 4: Notification Toast
// ============================================

export function ToastExample({
  message,
  visible,
}: {
  message: string;
  visible: boolean;
}) {
  return (
    <AnimatePresence>
      {visible && (
        <SlideInRight className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg">
          {message}
        </SlideInRight>
      )}
    </AnimatePresence>
  );
}

// ============================================
// Example 5: Sidebar Navigation
// ============================================

export function SidebarExample({ isOpen }: { isOpen: boolean }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <SlideInLeft
          as="aside"
          className="fixed left-0 top-0 h-full w-64 bg-gray-900 text-white"
        >
          <nav>
            <ul>
              <li>Dashboard</li>
              <li>Invoices</li>
              <li>Reports</li>
              <li>Settings</li>
            </ul>
          </nav>
        </SlideInLeft>
      )}
    </AnimatePresence>
  );
}

// ============================================
// Example 6: Viewport-Triggered Animation
// ============================================

export function ViewportExample() {
  const { ref, isInView } = useViewportAnimation({ once: true, amount: 0.3 });

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6 }}
      className="section"
    >
      <h2>This animates when scrolled into view</h2>
      <p>Great for long pages with many animations</p>
    </motion.section>
  );
}

// ============================================
// Example 7: Interactive Button
// ============================================

export function InteractiveButtonExample() {
  return (
    <Hoverable enableScale>
      <button className="px-6 py-3 bg-blue-500 text-white rounded-lg">
        Hover me!
      </button>
    </Hoverable>
  );
}

// ============================================
// Example 8: Feature List
// ============================================

export function FeatureListExample({ features }: { features: string[] }) {
  return (
    <StaggerContainer speed="fast" className="space-y-4">
      {features.map((feature, index) => (
        <StaggerItem key={index}>
          <Hoverable enableLift>
            <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow">
              <RotateIn delay={index * 0.1}>
                <span className="text-2xl">✓</span>
              </RotateIn>
              <span>{feature}</span>
            </div>
          </Hoverable>
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}

// ============================================
// Example 9: Dashboard Stats
// ============================================

export function DashboardStatsExample({
  stats,
}: {
  stats: { label: string; value: string }[];
}) {
  return (
    <StaggerContainer className="grid grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <StaggerItem key={stat.label}>
          <ScaleIn delay={index * 0.1}>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-3xl font-bold">{stat.value}</div>
              <div className="text-gray-600">{stat.label}</div>
            </div>
          </ScaleIn>
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}

// ============================================
// Example 10: Loading State
// ============================================

export function LoadingExample({ isLoading }: { isLoading: boolean }) {
  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <ScaleInBounce key="loading">
          <div className="flex items-center justify-center p-8">
            <motion.div
              className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          </div>
        </ScaleInBounce>
      ) : (
        <FadeInUp key="content">
          <div>Content loaded!</div>
        </FadeInUp>
      )}
    </AnimatePresence>
  );
}

// ============================================
// Example 11: Conditional Animation
// ============================================

export function ConditionalAnimationExample() {
  const animationEnabled = useAnimationEnabled();

  return (
    <div className={animationEnabled ? 'animate' : 'no-animate'}>
      {animationEnabled ? (
        <FadeIn>
          <p>Animations are enabled!</p>
        </FadeIn>
      ) : (
        <p>Respecting reduced motion preference</p>
      )}
    </div>
  );
}

// ============================================
// Example 12: Page Transition
// ============================================

export function PageTransitionExample({ children }: { children: React.ReactNode }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================
// Example 13: Dropdown Menu
// ============================================

export function DropdownExample({
  isOpen,
  items,
}: {
  isOpen: boolean;
  items: string[];
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full mt-2 bg-white shadow-lg rounded-lg overflow-hidden"
        >
          <StaggerContainer speed="fast">
            {items.map((item) => (
              <StaggerItem key={item}>
                <Hoverable enableScale>
                  <button className="w-full px-4 py-2 text-left hover:bg-gray-100">
                    {item}
                  </button>
                </Hoverable>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================
// Example 14: Success Message
// ============================================

export function SuccessMessageExample({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <BounceIn className="fixed top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
          >
            ✓
          </motion.span>
          <span>Success!</span>
        </BounceIn>
      )}
    </AnimatePresence>
  );
}

// ============================================
// Example 15: Image Gallery
// ============================================

export function ImageGalleryExample({ images }: { images: string[] }) {
  return (
    <StaggerContainer className="grid grid-cols-3 gap-4">
      {images.map((image, index) => (
        <StaggerItem key={image}>
          <Hoverable enableScale enableLift>
            <motion.img
              src={image}
              alt={`Image ${index + 1}`}
              className="w-full h-48 object-cover rounded-lg"
              whileHover={{ scale: 1.1 }}
            />
          </Hoverable>
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}
