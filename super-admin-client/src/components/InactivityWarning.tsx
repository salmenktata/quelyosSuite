/**
 * Modal de warning avant auto-logout pour inactivité
 */

import { useState, useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

interface InactivityWarningProps {
  /** Temps restant en ms */
  remainingTime: number
  /** Callback pour rester connecté */
  onStayActive: () => void
}

export function InactivityWarning({ remainingTime, onStayActive }: InactivityWarningProps) {
  const [timeLeft, setTimeLeft] = useState(Math.floor(remainingTime / 1000))

  useEffect(() => {
    // Mise à jour asynchrone pour éviter setState dans effect
    queueMicrotask(() => setTimeLeft(Math.floor(remainingTime / 1000)))

    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(interval)
  }, [remainingTime])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 border-2 border-orange-500 dark:border-orange-600">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <AlertTriangle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Session sur le point d&apos;expirer
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Inactivité détectée
            </p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Vous serez automatiquement déconnecté dans :
          </p>
          <div className="text-center py-4 bg-gray-100 dark:bg-gray-900 rounded-lg">
            <span className="text-4xl font-bold text-orange-600 dark:text-orange-400">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </span>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              par sécurité
            </p>
          </div>
        </div>

        <button
          onClick={onStayActive}
          className="w-full px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors"
        >
          Rester connecté
        </button>

        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
          Toute activité (clic, scroll) annulera la déconnexion
        </p>
      </div>
    </div>
  )
}
