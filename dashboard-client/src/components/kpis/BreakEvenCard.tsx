/**
 * Break Even Card - Point mort
 * Stub component for finance dashboard
 */

import React from 'react'

interface BreakEvenCardProps {
  value?: number
  progress?: number
  isLoading?: boolean
  formatAmount?: (amount: number) => string
  days?: number
}

export function BreakEvenCard({ value = 0, progress = 0, isLoading, formatAmount }: BreakEvenCardProps) {
  const format = formatAmount || ((n: number) => `${n.toLocaleString('fr-FR')} EUR`)

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Point mort</h3>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
        {format(value)}
      </p>
      <div className="mt-2">
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {progress.toFixed(0)}% atteint
        </p>
      </div>
    </div>
  )
}

export default BreakEvenCard
