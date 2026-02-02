/**
 * Glass UI Components
 * Composants avec effet glassmorphism pour le module Finance
 */

import React from 'react'

interface GlassProps {
  children: React.ReactNode
  className?: string
  gradient?: string
  variant?: string
  title?: string
  subtitle?: string
  onClick?: () => void
  'data-testid'?: string
  'data-status'?: string
}

// GlassCard - Carte avec effet verre
export function GlassCard({ children, className = '', gradient, title, subtitle, onClick, ...rest }: GlassProps) {
  const baseClass = gradient
    ? `bg-gradient-to-br ${gradient}`
    : 'bg-white/80 dark:bg-gray-800/80'

  return (
    <div
      className={`${baseClass} backdrop-blur-lg rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      {...rest}
    >
      {(title || subtitle) && (
        <div className="px-6 py-4 border-b border-gray-200/30 dark:border-gray-700/30">
          {title && <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  )
}

// GlassPanel - Panneau glassmorphism
export function GlassPanel({ children, className = '', gradient, title, subtitle, onClick, ...rest }: GlassProps) {
  // Gradients adaptatifs : couleurs opaques en light, transparents en dark
  const adaptiveGradients: Record<string, string> = {
    'indigo': 'bg-gradient-to-br from-indigo-50/95 to-indigo-100/95 dark:from-indigo-500/20 dark:to-purple-500/20',
    'violet': 'bg-gradient-to-br from-violet-50/95 to-violet-100/95 dark:from-violet-500/20 dark:to-purple-500/20',
    'orange': 'bg-gradient-to-br from-orange-50/95 to-orange-100/95 dark:from-orange-500/20 dark:to-amber-600/20',
    'emerald': 'bg-gradient-to-br from-emerald-50/95 to-emerald-100/95 dark:from-emerald-500/20 dark:to-green-600/20',
    'rose': 'bg-gradient-to-br from-rose-50/95 to-rose-100/95 dark:from-rose-500/20 dark:to-pink-600/20',
  }

  const backgroundClasses = gradient && adaptiveGradients[gradient]
    ? adaptiveGradients[gradient]
    : gradient
      ? `bg-gradient-to-br ${gradient}`
      : 'bg-white/70 dark:bg-gray-800/70'

  return (
    <div
      className={`${backgroundClasses} backdrop-blur-md rounded-lg border border-gray-200/50 dark:border-gray-700/50 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      {...rest}
    >
      {(title || subtitle) && (
        <div className="px-5 py-3 border-b border-gray-100/30 dark:border-gray-700/30">
          {title && <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  )
}

// GlassBadge - Badge avec effet verre
interface GlassBadgeProps extends GlassProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
}

export function GlassBadge({ children, className = '', variant = 'default' }: GlassBadgeProps) {
  const variantClasses = {
    default: 'bg-gray-100/80 text-gray-800 dark:bg-gray-700/80 dark:text-gray-200',
    success: 'bg-green-100/80 text-green-800 dark:bg-green-900/80 dark:text-green-200',
    warning: 'bg-yellow-100/80 text-yellow-800 dark:bg-yellow-900/80 dark:text-yellow-200',
    error: 'bg-red-100/80 text-red-800 dark:bg-red-900/80 dark:text-red-200',
    info: 'bg-blue-100/80 text-blue-800 dark:bg-blue-900/80 dark:text-blue-200',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium backdrop-blur-sm ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  )
}

// GlassListItem - Item de liste avec effet verre
interface GlassListItemProps extends GlassProps {
  onClick?: () => void
  active?: boolean
}

export function GlassListItem({ children, className = '', onClick, active }: GlassListItemProps) {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg transition-all cursor-pointer ${
        active
          ? 'bg-blue-50/80 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700'
          : 'bg-white/50 dark:bg-gray-800/50 hover:bg-gray-50/80 dark:hover:bg-gray-700/50'
      } border border-gray-200/30 dark:border-gray-700/30 backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  )
}

// GlassButton - Bouton avec effet verre
interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'danger' | 'ghost' | 'subtle'
  size?: 'sm' | 'md' | 'lg'
}

export function GlassButton({
  children,
  className = '',
  variant = 'default',
  size = 'md',
  ...props
}: GlassButtonProps) {
  const variantClasses = {
    default: 'bg-white/80 hover:bg-gray-100/80 text-gray-800 border-gray-200/50',
    primary: 'bg-blue-500/90 hover:bg-blue-600/90 text-white border-blue-400/50',
    secondary: 'bg-gray-500/90 hover:bg-gray-600/90 text-white border-gray-400/50',
    danger: 'bg-red-500/90 hover:bg-red-600/90 text-white border-red-400/50',
    ghost: 'bg-transparent hover:bg-gray-100/50 text-gray-700 dark:text-gray-300 border-transparent',
    subtle: 'bg-gray-100/60 hover:bg-gray-200/60 text-gray-700 dark:text-gray-300 border-gray-200/30',
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg font-medium backdrop-blur-sm border transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

// GlassInput - Input avec effet verre
interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={`w-full px-4 py-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
            error ? 'border-red-500' : 'border-gray-200/50 dark:border-gray-700/50'
          } ${className}`}
          {...props}
        />
        {error && <p role="alert" className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    )
  }
)
GlassInput.displayName = 'GlassInput'

// GlassSelect - Select avec effet verre
interface GlassSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string | number; label: string }[]
}

export const GlassSelect = React.forwardRef<HTMLSelectElement, GlassSelectProps>(
  ({ className = '', options, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`w-full px-4 py-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    )
  }
)
GlassSelect.displayName = 'GlassSelect'

// GlassModal - Modal avec effet verre
interface GlassModalProps extends GlassProps {
  isOpen: boolean
  onClose: () => void
  title?: string
}

export function GlassModal({ children, isOpen, onClose, title, className = '' }: GlassModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative z-10 w-full max-w-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl ${className}`}>
        {title && (
          <div className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// GlassTable - Table avec effet verre
export function GlassTable({ children, className = '' }: GlassProps) {
  return (
    <div className={`overflow-hidden rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-gray-200/30 dark:border-gray-700/30 ${className}`}>
      <table className="min-w-full divide-y divide-gray-200/50 dark:divide-gray-700/50">
        {children}
      </table>
    </div>
  )
}

// GlassTableHeader
export function GlassTableHeader({ children, className = '' }: GlassProps) {
  return (
    <thead className={`bg-gray-50/50 dark:bg-gray-700/50 ${className}`}>
      {children}
    </thead>
  )
}

// GlassTableBody
export function GlassTableBody({ children, className = '' }: GlassProps) {
  return (
    <tbody className={`divide-y divide-gray-200/30 dark:divide-gray-700/30 ${className}`}>
      {children}
    </tbody>
  )
}

// GlassTableRow
interface GlassTableRowProps extends GlassProps {
  onClick?: () => void
}

export function GlassTableRow({ children, className = '', onClick }: GlassTableRowProps) {
  return (
    <tr
      onClick={onClick}
      className={`hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </tr>
  )
}

// GlassTableCell
export function GlassTableCell({ children, className = '' }: GlassProps) {
  return (
    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 ${className}`}>
      {children}
    </td>
  )
}

// GlassTableHeaderCell
export function GlassTableHeaderCell({ children, className = '' }: GlassProps) {
  return (
    <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${className}`}>
      {children}
    </th>
  )
}

// GlassStatCard - Carte de statistiques avec effet verre
interface GlassStatCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  accentColor?: 'indigo' | 'rose' | 'emerald' | 'amber' | 'blue' | 'purple'
  className?: string
}

export function GlassStatCard({
  label,
  value,
  icon,
  trend,
  trendValue,
  accentColor = 'indigo',
  className = ''
}: GlassStatCardProps) {
  const accentClasses = {
    indigo: 'border-l-indigo-500/50',
    rose: 'border-l-rose-500/50',
    emerald: 'border-l-emerald-500/50',
    amber: 'border-l-amber-500/50',
    blue: 'border-l-blue-500/50',
    purple: 'border-l-purple-500/50',
  }

  const trendClasses = {
    up: 'text-emerald-400',
    down: 'text-rose-400',
    neutral: 'text-amber-400',
  }

  return (
    <div className={`bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-lg border border-gray-200/30 dark:border-gray-700/30 border-l-4 ${accentClasses[accentColor]} p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
        {icon && <div>{icon}</div>}
      </div>
      <div className="text-xl font-bold text-gray-900 dark:text-white">{value}</div>
      {trendValue && (
        <div className={`text-xs mt-1 ${trend ? trendClasses[trend] : 'text-gray-500'}`}>
          {trendValue}
        </div>
      )}
    </div>
  )
}
