/**
 * Bouton de commande vocale POS
 * Interface utilisateur pour la reconnaissance vocale
 */

import { useState } from 'react'
import { Mic, MicOff, Volume2, X, AlertCircle, Check } from 'lucide-react'
import { useVoiceOrdering, VoiceCommand } from '../../hooks/pos/useVoiceOrdering'

interface VoiceOrderButtonProps {
  products: { name: string; aliases?: string[] }[]
  onAddProduct: (productName: string, quantity: number) => void
  onRemoveProduct: (productName: string) => void
  onClearCart: () => void
  onPay: () => void
  compact?: boolean
}

export function VoiceOrderButton({
  products,
  onAddProduct,
  onRemoveProduct,
  onClearCart,
  onPay,
  compact = false,
}: VoiceOrderButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [lastAction, setLastAction] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCommand = (command: VoiceCommand) => {
    setError(null)

    switch (command.type) {
      case 'add_product':
        if (command.product) {
          onAddProduct(command.product, command.quantity || 1)
          setLastAction(`+${command.quantity || 1} ${command.product}`)
        }
        break
      case 'remove_product':
        if (command.product) {
          onRemoveProduct(command.product)
          setLastAction(`-${command.product}`)
        }
        break
      case 'clear_cart':
        onClearCart()
        setLastAction('Panier vidé')
        break
      case 'pay':
        onPay()
        setLastAction('Paiement')
        setShowModal(false)
        break
      case 'unknown':
        setError('Commande non reconnue')
        break
    }

    // Clear feedback après 3s
    setTimeout(() => {
      setLastAction(null)
      setError(null)
    }, 3000)
  }

  const handleError = (errorMsg: string) => {
    setError(errorMsg)
    setTimeout(() => setError(null), 5000)
  }

  const {
    isListening,
    isSupported,
    transcript,
    toggleListening,
    stopListening,
  } = useVoiceOrdering({
    products,
    onCommand: handleCommand,
    onError: handleError,
  })

  if (!isSupported) {
    return null // Ne pas afficher si non supporté
  }

  // Bouton compact
  if (compact && !showModal) {
    return (
      <button
        onClick={() => setShowModal(true)}
        className={`p-3 rounded-xl transition-all ${
          isListening
            ? 'bg-red-500 text-white animate-pulse'
            : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50'
        }`}
        title="Commande vocale"
      >
        {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
      </button>
    )
  }

  // Bouton normal avec modal
  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
          isListening
            ? 'bg-red-500 text-white animate-pulse'
            : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50'
        }`}
      >
        <Mic className="h-5 w-5" />
        Commande vocale
      </button>

      {/* Modal vocal */}
      {showModal && (
        <VoiceModal
          isListening={isListening}
          transcript={transcript}
          lastAction={lastAction}
          error={error}
          onToggleListening={toggleListening}
          onClose={() => {
            stopListening()
            setShowModal(false)
          }}
        />
      )}
    </>
  )
}

interface VoiceModalProps {
  isListening: boolean
  transcript: string
  lastAction: string | null
  error: string | null
  onToggleListening: () => void
  onClose: () => void
}

function VoiceModal({
  isListening,
  transcript,
  lastAction,
  error,
  onToggleListening,
  onClose,
}: VoiceModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-500 to-purple-600">
          <div className="flex items-center gap-3">
            <Mic className="h-6 w-6 text-white" />
            <h2 className="text-xl font-bold text-white">Commande Vocale</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Microphone button */}
          <div className="flex justify-center mb-6">
            <button
              onClick={onToggleListening}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all transform active:scale-95 ${
                isListening
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/50 animate-pulse'
                  : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50'
              }`}
            >
              {isListening ? (
                <MicOff className="h-12 w-12" />
              ) : (
                <Mic className="h-12 w-12" />
              )}
            </button>
          </div>

          {/* Status */}
          <div className="text-center mb-6">
            {isListening ? (
              <div className="flex items-center justify-center gap-2 text-red-500">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="font-medium">Écoute en cours...</span>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                Appuyez pour parler
              </p>
            )}
          </div>

          {/* Transcript */}
          {transcript && (
            <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-xl">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Vous avez dit :</p>
              <p className="text-lg text-gray-900 dark:text-white font-medium">"{transcript}"</p>
            </div>
          )}

          {/* Last action feedback */}
          {lastAction && (
            <div className="mb-4 p-4 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center gap-3">
              <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="text-green-700 dark:text-green-300 font-medium">{lastAction}</span>
            </div>
          )}

          {/* Error feedback */}
          {error && (
            <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <span className="text-red-700 dark:text-red-300 font-medium">{error}</span>
            </div>
          )}

          {/* Examples */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
            <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2 flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              Exemples de commandes
            </p>
            <ul className="text-sm text-purple-600 dark:text-purple-400 space-y-1">
              <li>"Ajoute deux cafés"</li>
              <li>"Un croissant s'il te plaît"</li>
              <li>"Enlève le sandwich"</li>
              <li>"Payer" ou "L'addition"</li>
              <li>"Vider le panier"</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <p className="text-center text-xs text-gray-500 dark:text-gray-400">
            La reconnaissance vocale nécessite une connexion internet
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * Indicateur d'écoute vocale minimal (pour header)
 */
export function VoiceListeningIndicator({ isListening }: { isListening: boolean }) {
  if (!isListening) return null

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500 text-white rounded-full animate-pulse">
      <Mic className="h-4 w-4" />
      <span className="text-sm font-medium">Écoute...</span>
    </div>
  )
}
