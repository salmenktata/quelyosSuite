import { useEffect, useRef, ReactNode } from 'react'
import { Button } from './Button'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm?: () => void
  title: string
  description?: string
  children?: ReactNode
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'danger'
  loading?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  hideDefaultActions?: boolean
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export function Modal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  children,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'default',
  loading = false,
  size = 'md',
  hideDefaultActions = false,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      const previousActiveElement = document.activeElement as HTMLElement

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !loading) {
          onClose()
        }
      }

      const handleClickOutside = (e: MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node) && !loading) {
          onClose()
        }
      }

      // Focus trap : empêche Tab de sortir du modal
      const handleFocusTrap = (e: KeyboardEvent) => {
        if (e.key !== 'Tab' || !modalRef.current) return

        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )

        const focusableArray = Array.from(focusableElements)
        const firstFocusable = focusableArray[0]
        const lastFocusable = focusableArray[focusableArray.length - 1]

        if (e.shiftKey) {
          // Shift+Tab : si focus sur premier élément, aller au dernier
          if (document.activeElement === firstFocusable) {
            e.preventDefault()
            lastFocusable?.focus()
          }
        } else {
          // Tab : si focus sur dernier élément, aller au premier
          if (document.activeElement === lastFocusable) {
            e.preventDefault()
            firstFocusable?.focus()
          }
        }
      }

      document.addEventListener('keydown', handleEscape)
      document.addEventListener('keydown', handleFocusTrap)
      document.addEventListener('mousedown', handleClickOutside)

      const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      firstFocusable?.focus()

      return () => {
        document.removeEventListener('keydown', handleEscape)
        document.removeEventListener('keydown', handleFocusTrap)
        document.removeEventListener('mousedown', handleClickOutside)
        previousActiveElement?.focus()
      }
    }
  }, [isOpen, onClose, loading])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby={description ? 'modal-description' : undefined}
    >
      <div
        ref={modalRef}
        className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg w-full ${sizeClasses[size]} transform transition-all duration-200 animate-slideUp`}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            {variant === 'danger' && (
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h3
                id="modal-title"
                className="text-lg font-semibold text-gray-900 dark:text-white mb-2"
              >
                {title}
              </h3>

              {description && (
                <p id="modal-description" className="text-sm text-gray-600 dark:text-gray-400">
                  {description}
                </p>
              )}

              {children && <div className="mt-4">{children}</div>}
            </div>
          </div>
        </div>

        {!hideDefaultActions && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-900 rounded-b-2xl border-t border-gray-200 dark:border-gray-700">
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              {cancelText}
            </Button>

            {onConfirm && (
              <Button
                variant={variant === 'danger' ? 'danger' : 'primary'}
                onClick={onConfirm}
                loading={loading}
                disabled={loading}
              >
                {confirmText}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
