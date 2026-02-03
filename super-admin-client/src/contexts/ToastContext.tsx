import { createContext, useContext, ReactNode, useMemo } from 'react'
import { useToast as useToastHook } from '../hooks/useToast'
import { ToastContainer } from '../components/common/Toast'

interface ToastContextType {
  success: (message: string, duration?: number) => string
  error: (message: string, duration?: number) => string
  warning: (message: string, duration?: number) => string
  info: (message: string, duration?: number) => string
  clearAll: () => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const toast = useToastHook()

  const value = useMemo(
    () => ({
      success: toast.success,
      error: toast.error,
      warning: toast.warning,
      info: toast.info,
      clearAll: toast.clearAll,
    }),
    [toast.success, toast.error, toast.warning, toast.info, toast.clearAll]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} position="top-right" />
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- Hook co-located with Context Provider (standard pattern)
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
