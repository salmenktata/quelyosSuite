import { HTMLAttributes } from 'react'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export function Badge({
  variant = 'neutral',
  size = 'md',
  children,
  className = '',
  ...props
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center font-semibold rounded-full'

  const variants = {
    success: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
    warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300',
    error: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
    info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
    neutral: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  }

  const variantClasses = variants[variant]
  const sizeClasses = sizes[size]

  return (
    <span className={`${baseStyles} ${variantClasses} ${sizeClasses} ${className}`} {...props}>
      {children}
    </span>
  )
}
