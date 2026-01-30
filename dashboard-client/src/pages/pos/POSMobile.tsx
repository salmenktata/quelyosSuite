/**
 * Interface POS Mobile
 * Optimisée pour smartphones et petites tablettes
 * Navigation par onglets, gros boutons tactiles
 */

import { useState, useMemo } from 'react'
import {
  Search,
  ShoppingCart,
  Grid3X3,
  CreditCard,
  Plus,
  Minus,
  Trash2,
  X,
  ChevronLeft,
  Banknote,
  Wallet,
  Check,
  ScanLine,
  Menu,
  Mic,
} from 'lucide-react'

// Types
interface MobileProduct {
  id: number
  name: string
  price: number
  image?: string
  category: string
  barcode?: string
}

interface MobileCartItem extends MobileProduct {
  quantity: number
}

// Mock data
const categories = ['Tous', 'Boissons', 'Snacks', 'Plats', 'Desserts']

const mockProducts: MobileProduct[] = [
  { id: 1, name: 'Café Expresso', price: 2.50, category: 'Boissons' },
  { id: 2, name: 'Cappuccino', price: 3.50, category: 'Boissons' },
  { id: 3, name: 'Thé Vert', price: 2.00, category: 'Boissons' },
  { id: 4, name: 'Jus Orange', price: 3.00, category: 'Boissons' },
  { id: 5, name: 'Croissant', price: 1.80, category: 'Snacks' },
  { id: 6, name: 'Pain Chocolat', price: 2.00, category: 'Snacks' },
  { id: 7, name: 'Sandwich Poulet', price: 5.50, category: 'Plats' },
  { id: 8, name: 'Salade César', price: 6.50, category: 'Plats' },
  { id: 9, name: 'Pizza Margherita', price: 8.00, category: 'Plats' },
  { id: 10, name: 'Tiramisu', price: 4.50, category: 'Desserts' },
  { id: 11, name: 'Brownie', price: 3.00, category: 'Desserts' },
  { id: 12, name: 'Glace Vanille', price: 2.50, category: 'Desserts' },
]

type MobileTab = 'products' | 'cart' | 'payment'

export default function POSMobile() {
  const [activeTab, setActiveTab] = useState<MobileTab>('products')
  const [cart, setCart] = useState<MobileCartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState('Tous')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash')

  // Calculs
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [cart])

  const cartItemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0)
  }, [cart])

  const filteredProducts = useMemo(() => {
    return mockProducts.filter((p) => {
      const matchCategory = selectedCategory === 'Tous' || p.category === selectedCategory
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
      return matchCategory && matchSearch
    })
  }, [selectedCategory, searchQuery])

  const change = parseFloat(paymentAmount) - cartTotal

  // Actions
  const addToCart = (product: MobileProduct) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })
    // Vibration feedback
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
  }

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

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.id !== productId))
  }

  const clearCart = () => {
    setCart([])
    setPaymentAmount('')
    setActiveTab('products')
  }

  const handlePayment = () => {
    if (paymentMethod === 'cash' && parseFloat(paymentAmount) < cartTotal) {
      alert('Montant insuffisant')
      return
    }
    // Simuler paiement réussi
    alert(`Paiement de ${cartTotal.toFixed(2)} TND validé !`)
    clearCart()
  }

  // Render Products Tab
  const renderProductsTab = () => (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      {showSearch ? (
        <div className="p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              autoFocus
              className="w-full pl-10 pr-10 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white"
            />
            <button
              onClick={() => {
                setShowSearch(false)
                setSearchQuery('')
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowSearch(true)}
            className="flex-1 flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-500"
          >
            <Search className="h-5 w-5" />
            <span>Rechercher un produit</span>
          </button>
          <button className="p-3 bg-teal-600 rounded-xl text-white">
            <ScanLine className="h-6 w-6" />
          </button>
        </div>
      )}

      {/* Categories */}
      <div className="flex gap-2 p-3 overflow-x-auto bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-colors ${
              selectedCategory === cat
                ? 'bg-teal-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-2 gap-3">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 text-left shadow-sm active:scale-95 transition-transform"
            >
              <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg mb-2 flex items-center justify-center">
                <span className="text-3xl">
                  {product.category === 'Boissons' ? '☕' :
                   product.category === 'Snacks' ? '🥐' :
                   product.category === 'Plats' ? '🍕' : '🍰'}
                </span>
              </div>
              <p className="font-medium text-gray-900 dark:text-white truncate">{product.name}</p>
              <p className="text-lg font-bold text-teal-600 dark:text-teal-400">
                {product.price.toFixed(2)} TND
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  // Render Cart Tab
  const renderCartTab = () => (
    <div className="flex flex-col h-full">
      {cart.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
          <ShoppingCart className="h-16 w-16 mb-4 opacity-30" />
          <p className="text-lg font-medium">Panier vide</p>
          <button
            onClick={() => setActiveTab('products')}
            className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg"
          >
            Ajouter des produits
          </button>
        </div>
      ) : (
        <>
          {/* Cart items */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {cart.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-3 flex items-center gap-3"
              >
                <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-2xl">
                  {item.category === 'Boissons' ? '☕' :
                   item.category === 'Snacks' ? '🥐' :
                   item.category === 'Plats' ? '🍕' : '🍰'}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                  <p className="text-teal-600 dark:text-teal-400 font-semibold">
                    {(item.price * item.quantity).toFixed(2)} TND
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center"
                  >
                    <Minus className="h-5 w-5" />
                  </button>
                  <span className="w-8 text-center font-bold text-gray-900 dark:text-white">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="p-2 text-red-500"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>

          {/* Cart summary */}
          <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-500 dark:text-gray-400">Total</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {cartTotal.toFixed(2)} TND
              </span>
            </div>
            <button
              onClick={() => setActiveTab('payment')}
              className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-lg"
            >
              Payer
            </button>
          </div>
        </>
      )}
    </div>
  )

  // Render Payment Tab
  const renderPaymentTab = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('cart')}
          className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-3"
        >
          <ChevronLeft className="h-5 w-5" />
          Retour au panier
        </button>
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">Total à payer</p>
          <p className="text-4xl font-bold text-gray-900 dark:text-white">
            {cartTotal.toFixed(2)} TND
          </p>
        </div>
      </div>

      {/* Payment methods */}
      <div className="p-4">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
          Mode de paiement
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setPaymentMethod('cash')}
            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
              paymentMethod === 'cash'
                ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <Banknote className={`h-8 w-8 ${paymentMethod === 'cash' ? 'text-teal-600' : 'text-gray-400'}`} />
            <span className={`font-medium ${paymentMethod === 'cash' ? 'text-teal-600' : 'text-gray-700 dark:text-gray-300'}`}>
              Espèces
            </span>
          </button>
          <button
            onClick={() => setPaymentMethod('card')}
            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
              paymentMethod === 'card'
                ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <CreditCard className={`h-8 w-8 ${paymentMethod === 'card' ? 'text-teal-600' : 'text-gray-400'}`} />
            <span className={`font-medium ${paymentMethod === 'card' ? 'text-teal-600' : 'text-gray-700 dark:text-gray-300'}`}>
              Carte
            </span>
          </button>
        </div>
      </div>

      {/* Cash input */}
      {paymentMethod === 'cash' && (
        <div className="p-4 flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            Montant reçu
          </p>
          <input
            type="number"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            placeholder="0.00"
            className="w-full text-3xl font-bold text-center py-4 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white"
          />

          {/* Quick amounts */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            {[10, 20, 50, 100].map((amount) => (
              <button
                key={amount}
                onClick={() => setPaymentAmount(String(amount))}
                className="py-3 bg-gray-100 dark:bg-gray-700 rounded-lg font-semibold text-gray-700 dark:text-gray-300"
              >
                {amount}
              </button>
            ))}
          </div>

          {/* Change */}
          {parseFloat(paymentAmount) >= cartTotal && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
              <p className="text-green-600 dark:text-green-400 text-sm">Rendu monnaie</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {change.toFixed(2)} TND
              </p>
            </div>
          )}
        </div>
      )}

      {/* Card placeholder */}
      {paymentMethod === 'card' && (
        <div className="p-4 flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <Wallet className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>Présentez la carte au terminal</p>
          </div>
        </div>
      )}

      {/* Confirm button */}
      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handlePayment}
          disabled={paymentMethod === 'cash' && parseFloat(paymentAmount) < cartTotal}
          className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white font-bold rounded-xl text-lg flex items-center justify-center gap-2"
        >
          <Check className="h-6 w-6" />
          Valider le paiement
        </button>
      </div>
    </div>
  )

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-teal-600 text-white p-4 flex items-center justify-between safe-area-top">
        <div className="flex items-center gap-3">
          <button className="p-2">
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-bold">Quelyos POS</h1>
        </div>
        <button className="p-2 bg-white/20 rounded-lg">
          <Mic className="h-6 w-6" />
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'products' && renderProductsTab()}
        {activeTab === 'cart' && renderCartTab()}
        {activeTab === 'payment' && renderPaymentTab()}
      </main>

      {/* Bottom navigation */}
      <nav className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 safe-area-bottom">
        <div className="flex">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex-1 py-4 flex flex-col items-center gap-1 ${
              activeTab === 'products'
                ? 'text-teal-600 dark:text-teal-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <Grid3X3 className="h-6 w-6" />
            <span className="text-xs font-medium">Produits</span>
          </button>
          <button
            onClick={() => setActiveTab('cart')}
            className={`flex-1 py-4 flex flex-col items-center gap-1 relative ${
              activeTab === 'cart'
                ? 'text-teal-600 dark:text-teal-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <ShoppingCart className="h-6 w-6" />
            <span className="text-xs font-medium">Panier</span>
            {cartItemCount > 0 && (
              <span className="absolute top-2 right-1/4 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {cartItemCount}
              </span>
            )}
          </button>
          <button
            onClick={() => cart.length > 0 && setActiveTab('payment')}
            disabled={cart.length === 0}
            className={`flex-1 py-4 flex flex-col items-center gap-1 ${
              activeTab === 'payment'
                ? 'text-teal-600 dark:text-teal-400'
                : cart.length === 0
                ? 'text-gray-300 dark:text-gray-600'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <CreditCard className="h-6 w-6" />
            <span className="text-xs font-medium">Payer</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
