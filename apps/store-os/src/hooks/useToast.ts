import { useState, useCallback } from 'react'
import { ToastType } from '../components/common/Toast'

interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((type: ToastType, message: string, duration = 3000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newToast: Toast = { id, type, message, duration }

    setToasts((prev) => [...prev, newToast])

    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const success = useCallback(
    (message: string, duration?: number) => {
      return addToast('success', message, duration)
    },
    [addToast]
  )

  const error = useCallback(
    (message: string, duration?: number) => {
      return addToast('error', message, duration || 5000)
    },
    [addToast]
  )

  const warning = useCallback(
    (message: string, duration?: number) => {
      return addToast('warning', message, duration)
    },
    [addToast]
  )

  const info = useCallback(
    (message: string, duration?: number) => {
      return addToast('info', message, duration)
    },
    [addToast]
  )

  const clearAll = useCallback(() => {
    setToasts([])
  }, [])

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
    clearAll,
  }
}
