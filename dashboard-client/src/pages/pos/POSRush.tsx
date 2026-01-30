/**
 * Mode Rush POS - Interface Ultra-Simplifiée
 * Pour les périodes de forte affluence
 *
 * Features:
 * - Produits favoris uniquement (grands boutons)
 * - Paiement rapide espèces
 * - Pas de remises
 * - Compteur de ventes en temps réel
 */

import { useState, useMemo } from 'react'
import {
  Zap,
  X,
  Plus,
  Minus,
  Banknote,
  RotateCcw,
  TrendingUp,
  Clock,
  ShoppingBag,
} from 'lucide-react'

// Types
interface RushProduct {
  id: number
  name: string
  price: number
  image?: string
  color: string
}

interface RushCartItem extends RushProduct {
  quantity: number
}

// Produits favoris (simulation)
const favoriteProducts: RushProduct[] = [
  { id: 1, name: 'Café', price: 2.50, color: 'bg-amber-500' },
  { id: 2, name: 'Croissant', price: 1.80, color: 'bg-yellow-500' },
  { id: 3, name: 'Sandwich', price: 5.50, color: 'bg-green-500' },
  { id: 4, name: 'Jus Orange', price: 3.00, color: 'bg-orange-500' },
  { id: 5, name: 'Eau', price: 1.00, color: 'bg-blue-500' },
  { id: 6, name: 'Cookie', price: 2.00, color: 'bg-pink-500' },
  { id: 7, name: 'Salade', price: 6.50, color: 'bg-emerald-500' },
  { id: 8, name: 'Wrap', price: 7.00, color: 'bg-purple-500' },
]

// Montants rapides espèces
const quickCashAmounts = [5, 10, 20, 50]

export default function POSRush() {
  const [cart, setCart] = useState<RushCartItem[]>([])
  const [receivedAmount, setReceivedAmount] = useState<number | null>(null)
  const [showPayment, setShowPayment] = useState(false)
  const [salesCount, setSalesCount] = useState(0)
  const [salesTotal, setSalesTotal] = useState(0)

  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [cart])

  const change = receivedAmount !== null ? Math.max(0, receivedAmount - total) : 0

  // Ajouter au panier
  const addToCart = (product: RushProduct) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  // Modifier quantité
  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  // Paiement rapide
  const handleQuickPay = (amount: number) => {
    setReceivedAmount(amount)
  }

  // Confirmer paiement
  const confirmPayment = () => {
    if (receivedAmount !== null && receivedAmount >= total) {
      setSalesCount((prev) => prev + 1)
      setSalesTotal((prev) => prev + total)
      setCart([])
      setReceivedAmount(null)
      setShowPayment(false)
    }
  }

  // Reset
  const resetCart = () => {
    setCart([])
    setReceivedAmount(null)
    setShowPayment(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header - Stats en temps réel */}
      <header className="bg-gradient-to-r from-orange-600 to-red-600 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="h-8 w-8 text-yellow-300 animate-pulse" />
            <div>
              <h1 className="text-2xl font-black tracking-tight">MODE RUSH</h1>
              <p className="text-sm text-orange-200">Interface rapide activée</p>
            </div>
          </div>

          {/* Stats live */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl">
              <ShoppingBag className="h-5 w-5 text-yellow-300" />
              <div>
                <p className="text-2xl font-bold">{salesCount}</p>
                <p className="text-xs text-orange-200">Ventes</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl">
              <TrendingUp className="h-5 w-5 text-green-300" />
              <div>
                <p className="text-2xl font-bold">{salesTotal.toFixed(2)}</p>
                <p className="text-xs text-orange-200">TND Total</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl">
              <Clock className="h-5 w-5 text-blue-300" />
              <div>
                <p className="text-2xl font-bold">{new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                <p className="text-xs text-orange-200">Heure</p>
              </div>
            </div>
          </div>

          <a
            href="/pos/terminal"
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
          >
            <X className="h-5 w-5" />
            Quitter Rush
          </a>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex">
        {/* Grille produits - Grands boutons */}
        <div className="flex-1 p-4">
          <div className="grid grid-cols-4 gap-4 h-full">
            {favoriteProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className={`${product.color} hover:opacity-90 rounded-2xl p-6 flex flex-col items-center justify-center text-white shadow-lg transform transition-all active:scale-95 min-h-[140px]`}
              >
                <span className="text-2xl font-bold text-center leading-tight">{product.name}</span>
                <span className="text-3xl font-black mt-2">{product.price.toFixed(2)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Panier simplifié */}
        <div className="w-80 bg-gray-900 flex flex-col">
          {/* Cart items */}
          <div className="flex-1 p-4 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <ShoppingBag className="h-16 w-16 mb-4 opacity-30" />
                <p className="text-lg">Panier vide</p>
                <p className="text-sm">Touchez un produit</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="bg-gray-800 rounded-xl p-3 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <p className="font-bold text-lg">{item.name}</p>
                      <p className="text-gray-400">{item.price.toFixed(2)} TND</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center"
                      >
                        <Minus className="h-5 w-5" />
                      </button>
                      <span className="w-8 text-center text-xl font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total et paiement */}
          <div className="p-4 bg-gray-800 border-t border-gray-700">
            {!showPayment ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-400 text-lg">Total</span>
                  <span className="text-4xl font-black text-white">{total.toFixed(2)} TND</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={resetCart}
                    disabled={cart.length === 0}
                    className="py-4 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 rounded-xl flex items-center justify-center gap-2 font-bold"
                  >
                    <RotateCcw className="h-5 w-5" />
                    Annuler
                  </button>
                  <button
                    onClick={() => setShowPayment(true)}
                    disabled={cart.length === 0}
                    className="py-4 bg-green-600 hover:bg-green-500 disabled:opacity-30 rounded-xl flex items-center justify-center gap-2 font-bold text-lg"
                  >
                    <Banknote className="h-6 w-6" />
                    PAYER
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Montants rapides */}
                <div className="mb-4">
                  <p className="text-gray-400 text-sm mb-2">Montant reçu (espèces)</p>
                  <div className="grid grid-cols-4 gap-2">
                    {quickCashAmounts.map((amount) => (
                      <button
                        key={amount}
                        onClick={() => handleQuickPay(amount)}
                        className={`py-3 rounded-xl font-bold text-lg transition-all ${
                          receivedAmount === amount
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        }`}
                      >
                        {amount}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => handleQuickPay(total)}
                    className={`w-full mt-2 py-3 rounded-xl font-bold transition-all ${
                      receivedAmount === total
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    Montant exact ({total.toFixed(2)})
                  </button>
                </div>

                {/* Rendu */}
                {receivedAmount !== null && receivedAmount >= total && (
                  <div className="mb-4 p-4 bg-green-900/50 border border-green-700 rounded-xl text-center">
                    <p className="text-green-400 text-sm">Rendu monnaie</p>
                    <p className="text-4xl font-black text-green-400">{change.toFixed(2)} TND</p>
                  </div>
                )}

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setShowPayment(false)
                      setReceivedAmount(null)
                    }}
                    className="py-4 bg-gray-700 hover:bg-gray-600 rounded-xl flex items-center justify-center gap-2 font-bold"
                  >
                    <X className="h-5 w-5" />
                    Retour
                  </button>
                  <button
                    onClick={confirmPayment}
                    disabled={receivedAmount === null || receivedAmount < total}
                    className="py-4 bg-green-600 hover:bg-green-500 disabled:opacity-30 disabled:hover:bg-green-600 rounded-xl flex items-center justify-center gap-2 font-bold text-lg"
                  >
                    VALIDER
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer - Raccourcis rapides */}
      <footer className="bg-gray-900 border-t border-gray-800 px-4 py-2">
        <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
          <span>
            <kbd className="px-2 py-1 bg-gray-800 rounded mr-1">Espace</kbd>
            Produit suivant
          </span>
          <span>
            <kbd className="px-2 py-1 bg-gray-800 rounded mr-1">Entrée</kbd>
            Payer
          </span>
          <span>
            <kbd className="px-2 py-1 bg-gray-800 rounded mr-1">Échap</kbd>
            Annuler
          </span>
        </div>
      </footer>
    </div>
  )
}
