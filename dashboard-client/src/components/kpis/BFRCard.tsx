/**
 * BFR Card - Besoin en Fonds de Roulement
 * Stub component for finance dashboard
 */

import React from 'react'

interface BFRCardProps {
  value?: number
  trend?: number
  isLoading?: boolean
  formatAmount?: (amount: number) => string
  days?: number
}

export function BFRCard({ value = 0, trend = 0, isLoading, formatAmount }: BFRCardProps) {
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
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">BFR</h3>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
        {format(value)}
      </p>
      {trend !== 0 && (
        <p className={`text-xs mt-1 ${trend < 0 ? 'text-green-500' : 'text-red-500'}`}>
          {trend > 0 ? '+' : ''}{trend}% vs mois dernier
        </p>
      )}
    </div>
  )
}

export default BFRCard
