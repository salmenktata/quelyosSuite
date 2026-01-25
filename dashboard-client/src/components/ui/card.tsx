/**
 * Card UI Components
 */

import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: CardProps) {
  return <div className={`px-6 py-4 border-b border-gray-200 dark:border-gray-700 ${className}`}>{children}</div>
}

export function CardTitle({ children, className = '' }: CardProps) {
  return <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${className}`}>{children}</h3>
}

export function CardDescription({ children, className = '' }: CardProps) {
  return <p className={`mt-1 text-sm text-gray-500 dark:text-gray-400 ${className}`}>{children}</p>
}

export function CardContent({ children, className = '' }: CardProps) {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>
}

export function CardFooter({ children, className = '' }: CardProps) {
  return <div className={`px-6 py-4 border-t border-gray-200 dark:border-gray-700 ${className}`}>{children}</div>
}
