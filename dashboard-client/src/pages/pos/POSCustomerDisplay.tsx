/**
 * Customer Display - Écran côté client
 * Affiche le panier en temps réel, publicités, QR fidélité
 */

import { useState, useEffect } from 'react'
import {
  ShoppingCart,
  Star,
  Gift,
  QrCode,
  Sparkles,
  Heart,
  CreditCard,
  Award,
} from 'lucide-react'

// Types
interface DisplayCartItem {
  id: number
  name: string
  quantity: number
  unitPrice: number
  total: number
}

interface DisplayPromo {
  id: number
  title: string
  description: string
  image?: string
  color: string
}

// Promos rotatives
const promos: DisplayPromo[] = [
  {
    id: 1,
    title: 'Programme Fidélité',
    description: '1 point par dinar dépensé. 500 points = 5 TND offerts !',
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 2,
    title: 'Happy Hour',
    description: '-20% sur toutes les boissons de 16h à 18h',
    color: 'from-orange-500 to-red-500',
  },
  {
    id: 3,
    title: 'Menu du Jour',
    description: 'Plat + Boisson + Dessert à seulement 12.90 TND',
    color: 'from-green-500 to-teal-500',
  },
  {
    id: 4,
    title: 'Parrainage',
    description: 'Invitez un ami et gagnez tous les deux 10 TND',
    color: 'from-blue-500 to-indigo-500',
  },
]

// Mock cart data (en réalité, serait synchronisé via WebSocket/polling)
const mockCart: DisplayCartItem[] = [
  { id: 1, name: 'Café Expresso', quantity: 2, unitPrice: 2.50, total: 5.00 },
  { id: 2, name: 'Croissant Beurre', quantity: 1, unitPrice: 1.80, total: 1.80 },
  { id: 3, name: 'Jus d\'Orange Frais', quantity: 1, unitPrice: 3.00, total: 3.00 },
]

type DisplayMode = 'cart' | 'idle' | 'payment' | 'thankyou'

export default function POSCustomerDisplay() {
  const [mode, setMode] = useState<DisplayMode>('cart')
  const [cart, setCart] = useState<DisplayCartItem[]>(mockCart)
  const [currentPromo, setCurrentPromo] = useState(0)
  const [time, setTime] = useState(new Date())

  // Total
  const total = cart.reduce((sum, item) => sum + item.total, 0)
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  // Rotation des promos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPromo((prev) => (prev + 1) % promos.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Mise à jour de l'heure
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Simulation changement de mode (en prod: déclenché par le caissier)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'POS_UPDATE') {
        setCart(event.data.cart || [])
        setMode(event.data.mode || 'cart')
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Mode Thank You temporaire
  useEffect(() => {
    if (mode === 'thankyou') {
      const timeout = setTimeout(() => {
        setMode('idle')
        setCart([])
      }, 5000)
      return () => clearTimeout(timeout)
    }
  }, [mode])

  // Render mode idle (écran d'attente)
  const renderIdleMode = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col">
      {/* Header avec logo et heure */}
      <header className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center">
            <Star className="h-7 w-7 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">Quelyos</span>
        </div>
        <div className="text-right">
          <p className="text-4xl font-mono font-bold text-white">
            {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-gray-400">
            {time.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </header>

      {/* Promo rotative */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div
          className={`w-full max-w-2xl bg-gradient-to-r ${promos[currentPromo].color} rounded-3xl p-8 text-white shadow-2xl transform transition-all duration-500`}
        >
          <div className="flex items-center gap-4 mb-4">
            <Sparkles className="h-10 w-10" />
            <h2 className="text-3xl font-bold">{promos[currentPromo].title}</h2>
          </div>
          <p className="text-xl opacity-90">{promos[currentPromo].description}</p>

          {/* Dots indicateurs */}
          <div className="flex justify-center gap-2 mt-6">
            {promos.map((_, idx) => (
              <div
                key={idx}
                className={`w-3 h-3 rounded-full transition-all ${
                  idx === currentPromo ? 'bg-white w-8' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* QR Code fidélité */}
      <footer className="p-6 flex items-center justify-center gap-8">
        <div className="bg-white rounded-2xl p-4 flex items-center gap-4">
          <QrCode className="h-16 w-16 text-gray-800" />
          <div>
            <p className="font-bold text-gray-800">Scannez pour rejoindre</p>
            <p className="text-gray-500">notre programme fidélité</p>
          </div>
        </div>
      </footer>
    </div>
  )

  // Render mode cart
  const renderCartMode = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col">
      {/* Header */}
      <header className="p-6 bg-gray-900/50 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-8 w-8 text-teal-500" />
            <h1 className="text-2xl font-bold text-white">Votre commande</h1>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-teal-500/20 rounded-full">
            <span className="text-teal-400 font-medium">{itemCount} articles</span>
          </div>
        </div>
      </header>

      {/* Cart items */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="space-y-4 max-w-2xl mx-auto">
          {cart.map((item) => (
            <div
              key={item.id}
              className="bg-gray-800/50 backdrop-blur rounded-2xl p-6 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-700 rounded-xl flex items-center justify-center text-3xl">
                  🍽️
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">{item.name}</h3>
                  <p className="text-gray-400">
                    {item.quantity} × {item.unitPrice.toFixed(2)} TND
                  </p>
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{item.total.toFixed(2)} TND</p>
            </div>
          ))}
        </div>
      </main>

      {/* Total */}
      <footer className="p-6 bg-gray-900/80 backdrop-blur border-t border-gray-700">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl text-gray-400">Total à payer</span>
            <span className="text-5xl font-bold text-white">{total.toFixed(2)} TND</span>
          </div>

          {/* Points fidélité */}
          <div className="flex items-center justify-center gap-3 p-4 bg-purple-500/20 rounded-xl">
            <Award className="h-6 w-6 text-purple-400" />
            <span className="text-purple-300">
              Vous allez gagner <strong className="text-white">{Math.floor(total)} points</strong> fidélité !
            </span>
          </div>
        </div>
      </footer>
    </div>
  )

  // Render mode payment
  const renderPaymentMode = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex flex-col items-center justify-center">
      <div className="text-center">
        <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
          <CreditCard className="h-16 w-16 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">Paiement en cours</h1>
        <p className="text-2xl text-blue-200 mb-8">Total: {total.toFixed(2)} TND</p>
        <div className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-4 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-4 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )

  // Render mode thank you
  const renderThankYouMode = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-teal-900 flex flex-col items-center justify-center">
      <div className="text-center">
        <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-8">
          <Heart className="h-16 w-16 text-white animate-pulse" />
        </div>
        <h1 className="text-5xl font-bold text-white mb-4">Merci !</h1>
        <p className="text-2xl text-green-200 mb-4">Votre paiement a été accepté</p>
        <div className="flex items-center justify-center gap-3 p-4 bg-white/10 rounded-xl mt-8">
          <Gift className="h-6 w-6 text-yellow-400" />
          <span className="text-white">
            +{Math.floor(total)} points ajoutés à votre compte fidélité
          </span>
        </div>
        <p className="text-green-300 mt-8">À bientôt !</p>
      </div>
    </div>
  )

  // Render selon le mode
  switch (mode) {
    case 'idle':
      return renderIdleMode()
    case 'cart':
      return renderCartMode()
    case 'payment':
      return renderPaymentMode()
    case 'thankyou':
      return renderThankYouMode()
    default:
      return renderIdleMode()
  }
}

/**
 * Hook pour contrôler le Customer Display depuis le terminal
 * Utilise postMessage pour communiquer avec l'écran client
 */
export function useCustomerDisplay() {
  const [displayWindow, setDisplayWindow] = useState<Window | null>(null)

  const openDisplay = () => {
    const win = window.open(
      '/pos/customer-display',
      'customer-display',
      'width=1024,height=768,menubar=no,toolbar=no,location=no,status=no'
    )
    setDisplayWindow(win)
  }

  const closeDisplay = () => {
    displayWindow?.close()
    setDisplayWindow(null)
  }

  const updateDisplay = (cart: DisplayCartItem[], mode: DisplayMode = 'cart') => {
    displayWindow?.postMessage({ type: 'POS_UPDATE', cart, mode }, '*')
  }

  const showPayment = () => {
    displayWindow?.postMessage({ type: 'POS_UPDATE', mode: 'payment' }, '*')
  }

  const showThankYou = () => {
    displayWindow?.postMessage({ type: 'POS_UPDATE', mode: 'thankyou' }, '*')
  }

  const showIdle = () => {
    displayWindow?.postMessage({ type: 'POS_UPDATE', mode: 'idle', cart: [] }, '*')
  }

  return {
    isOpen: !!displayWindow,
    openDisplay,
    closeDisplay,
    updateDisplay,
    showPayment,
    showThankYou,
    showIdle,
  }
}
