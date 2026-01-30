/**
 * Adaptateur de compatibilité @quelyos/ui/animated
 * Composants d'animation simplifiés
 */

import React from 'react'

interface AnimatedProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

// FadeInUp - Animation d'entrée avec fade et slide up
export function FadeInUp({ children, className = '', delay = 0 }: AnimatedProps) {
  return (
    <div
      className={`animate-fade-in-up ${className}`}
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: 'both'
      }}
    >
      {children}
    </div>
  )
}

// FadeIn - Simple fade
export function FadeIn({ children, className = '', delay = 0 }: AnimatedProps) {
  return (
    <div
      className={`animate-fade-in ${className}`}
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: 'both'
      }}
    >
      {children}
    </div>
  )
}

// SlideIn - Slide depuis la droite
export function SlideIn({ children, className = '', delay = 0 }: AnimatedProps) {
  return (
    <div
      className={`animate-slide-in ${className}`}
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: 'both'
      }}
    >
      {children}
    </div>
  )
}

// ScaleIn - Scale up
export function ScaleIn({ children, className = '', delay = 0 }: AnimatedProps) {
  return (
    <div
      className={`animate-scale-in ${className}`}
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: 'both'
      }}
    >
      {children}
    </div>
  )
}

// Stagger container pour enfants animés
interface StaggerProps {
  children: React.ReactNode
  className?: string
  staggerDelay?: number
  speed?: string
  delay?: number
  'data-guide'?: string
}

export function Stagger({ children, className = '', staggerDelay = 50, speed: _speed, delay: _delay, ..._rest }: StaggerProps) {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <div
          style={{
            animationDelay: `${index * staggerDelay}ms`,
            animationFillMode: 'both'
          }}
        >
          {child}
        </div>
      ))}
    </div>
  )
}

// StaggerContainer - Container pour animations staggerées
export function StaggerContainer({ children, className = '', staggerDelay = 50, speed: _speed, delay: _delay, ..._rest }: StaggerProps) {
  return (
    <div className={`animate-fade-in ${className}`}>
      {React.Children.map(children, (child, index) => (
        <div
          className="animate-fade-in-up"
          style={{
            animationDelay: `${index * staggerDelay}ms`,
            animationFillMode: 'both'
          }}
        >
          {child}
        </div>
      ))}
    </div>
  )
}

// StaggerItem - Item dans un StaggerContainer
export function StaggerItem({ children, className = '' }: AnimatedProps) {
  return <div className={`animate-fade-in-up ${className}`}>{children}</div>
}

// AnimatePresence - Wrapper pour gérer les animations de sortie (simplifié)
export function AnimatePresence({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

// ScaleInBounce - Scale avec effet bounce
export function ScaleInBounce({ children, className = '', delay = 0 }: AnimatedProps) {
  return (
    <div
      className={`animate-scale-in ${className}`}
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: 'both',
        animationTimingFunction: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
      }}
    >
      {children}
    </div>
  )
}

// Hoverable - Wrapper avec effet hover
interface HoverableProps extends AnimatedProps {
  scale?: number
  enableScale?: boolean
}

export function Hoverable({ children, className = '', scale = 1.02, enableScale: _enableScale }: HoverableProps) {
  return (
    <div
      className={`transition-transform hover:scale-[${scale}] ${className}`}
      style={{ transitionDuration: '200ms' }}
    >
      {children}
    </div>
  )
}
