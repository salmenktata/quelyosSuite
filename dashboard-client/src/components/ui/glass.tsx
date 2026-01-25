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
}

// GlassCard - Carte avec effet verre
export function GlassCard({ children, className = '', gradient, variant }: GlassProps) {
  const baseClass = gradient
    ? `bg-gradient-to-br ${gradient}`
    : 'bg-white/80 dark:bg-gray-800/80'

  return (
    <div className={`${baseClass} backdrop-blur-lg rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg ${className}`}>
      {children}
    </div>
  )
}

// GlassPanel - Panneau glassmorphism
export function GlassPanel({ children, className = '', gradient, variant }: GlassProps) {
  const baseClass = gradient
    ? `bg-gradient-to-br ${gradient}`
    : 'bg-white/70 dark:bg-gray-800/70'

  return (
    <div className={`${baseClass} backdrop-blur-md rounded-lg border border-gray-100/50 dark:border-gray-700/50 ${className}`}>
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
  variant?: 'default' | 'primary' | 'secondary' | 'danger'
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
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
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
