/**
 * Composant FormField réutilisable avec validation inline
 *
 * Affiche automatiquement les erreurs Zod/React Hook Form
 * Compatible dark mode
 *
 * @example
 * <FormField
 *   label="Email"
 *   error={errors.email?.message}
 *   required
 * >
 *   <input {...register('email')} />
 * </FormField>
 */

import { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import clsx from 'clsx'

interface FormFieldProps {
  label: string
  error?: string
  required?: boolean
  children: ReactNode
  hint?: string
  className?: string
}

export function FormField({ label, error, required, children, hint, className }: FormFieldProps) {
  return (
    <div className={clsx('space-y-1', className)}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {children}

      {hint && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{hint}</p>
      )}

      {error && (
        <div
          className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400 animate-in fade-in slide-in-from-top-1 duration-200"
          role="alert"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

/**
 * Composant Input stylisé avec gestion d'erreurs
 */
interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export function FormInput({ error, className, ...props }: FormInputProps) {
  return (
    <input
      {...props}
      className={clsx(
        'w-full px-3 py-2 border rounded-lg transition-colors',
        'bg-white dark:bg-gray-800',
        'text-gray-900 dark:text-white',
        'placeholder:text-gray-400 dark:placeholder:text-gray-500',
        'focus:outline-none focus:ring-2',
        error
          ? 'border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500'
          : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500',
        'disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:cursor-not-allowed',
        className
      )}
    />
  )
}

/**
 * Composant Textarea stylisé avec gestion d'erreurs
 */
interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
}

export function FormTextarea({ error, className, ...props }: FormTextareaProps) {
  return (
    <textarea
      {...props}
      className={clsx(
        'w-full px-3 py-2 border rounded-lg transition-colors',
        'bg-white dark:bg-gray-800',
        'text-gray-900 dark:text-white',
        'placeholder:text-gray-400 dark:placeholder:text-gray-500',
        'focus:outline-none focus:ring-2',
        error
          ? 'border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500'
          : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500',
        'disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:cursor-not-allowed',
        className
      )}
    />
  )
}

/**
 * Composant Select stylisé avec gestion d'erreurs
 */
interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string
}

export function FormSelect({ error, className, children, ...props }: FormSelectProps) {
  return (
    <select
      {...props}
      className={clsx(
        'w-full px-3 py-2 border rounded-lg transition-colors',
        'bg-white dark:bg-gray-800',
        'text-gray-900 dark:text-white',
        'focus:outline-none focus:ring-2',
        error
          ? 'border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500'
          : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500',
        'disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:cursor-not-allowed',
        className
      )}
    >
      {children}
    </select>
  )
}
