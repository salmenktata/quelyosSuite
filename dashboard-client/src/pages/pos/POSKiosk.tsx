/**
 * Mode Kiosk POS - Interface self-checkout client
 * Grands boutons tactiles 100px+, workflow simplifié
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  ArrowLeft,
  Package,
  Search,
  X,
  Loader2,
  CheckCircle,
  Home,
} from 'lucide-react'
import { usePOSProducts, usePOSCategories } from '../../hooks/pos/usePOSProducts'
import { usePOSConfig } from '../../hooks/pos/usePOSConfigs'
import { useBarcodeScan } from '../../components/pos/BarcodeScanner'
import type { POSProduct, POSCategory } from '../../types/pos'

// ============================================================================
// TYPES
// ============================================================================

interface KioskCartItem {
  product: POSProduct
  quantity: number
}

type KioskStep = 'browse' | 'cart' | 'payment' | 'success'

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function POSKiosk() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const configId = parseInt(searchParams.get('config') || '0')

  const [step, setStep] = useState<KioskStep>('browse')
  const [cart, setCart] = useState<KioskCartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Data
  const { data: config } = usePOSConfig(configId || null)
  const { data: productsData, isLoading: productsLoading } = usePOSProducts({
    configId: configId || 0,
    categoryId: selectedCategory || undefined,
    search: searchQuery || undefined,
    limit: 24,
  })
  const { data: categories = [] } = usePOSCategories(configId || 0)

  // Cart helpers
  const addToCart = useCallback((product: POSProduct) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }, [])

  // Barcode scanning
  useBarcodeScan((barcode) => {
    // Find product by barcode and add to cart
    const product = productsData?.products.find((p) => p.barcode === barcode)
    if (product) {
      addToCart(product)
    }
  }, step === 'browse')

  const updateQuantity = useCallback((productId: number, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    })
  }, [])

  const removeFromCart = useCallback((productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId))
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
  }, [])

  const total = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  // Handle payment (mock)
  const handlePayment = async () => {
    setStep('payment')
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setStep('success')
  }

  // Reset after success
  const handleNewOrder = () => {
    clearCart()
    setStep('browse')
  }

  // No config selected
  if (!configId) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h1 className="text-2xl font-bold mb-2">Configuration requise</h1>
          <p className="text-gray-400 mb-4">
            Veuillez sélectionner un terminal pour le mode kiosk
          </p>
          <button
            onClick={() => navigate('/pos')}
            className="px-6 py-3 bg-teal-600 rounded-xl text-lg"
          >
            Retour
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col overflow-hidden select-none">
      {/* Header */}
      <header className="bg-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/pos')}
            className="p-3 hover:bg-gray-700 rounded-xl"
          >
            <Home className="h-6 w-6 text-gray-400" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">
              {config?.name || 'Self-Checkout'}
            </h1>
            <p className="text-sm text-gray-400">Scannez ou sélectionnez vos articles</p>
          </div>
        </div>

        {/* Mini cart */}
        <button
          onClick={() => cart.length > 0 && setStep('cart')}
          className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-colors ${
            cart.length > 0
              ? 'bg-teal-600 hover:bg-teal-700'
              : 'bg-gray-700'
          }`}
        >
          <ShoppingBag className="h-6 w-6 text-white" />
          <span className="text-xl font-bold text-white">{itemCount}</span>
          <span className="text-white">{total.toFixed(2)} TND</span>
        </button>
      </header>

      {/* Content based on step */}
      {step === 'browse' && (
        <KioskBrowse
          products={productsData?.products || []}
          categories={categories}
          isLoading={productsLoading}
          selectedCategory={selectedCategory}
          searchQuery={searchQuery}
          onCategoryChange={setSelectedCategory}
          onSearchChange={setSearchQuery}
          onProductClick={addToCart}
          onViewCart={() => setStep('cart')}
          cartItemCount={itemCount}
        />
      )}

      {step === 'cart' && (
        <KioskCart
          items={cart}
          total={total}
          onUpdateQuantity={updateQuantity}
          onRemove={removeFromCart}
          onClear={clearCart}
          onBack={() => setStep('browse')}
          onCheckout={handlePayment}
        />
      )}

      {step === 'payment' && <KioskPayment total={total} />}

      {step === 'success' && (
        <KioskSuccess onNewOrder={handleNewOrder} />
      )}
    </div>
  )
}

// ============================================================================
// BROWSE COMPONENT
// ============================================================================

interface KioskBrowseProps {
  products: POSProduct[]
  categories: POSCategory[]
  isLoading: boolean
  selectedCategory: number | null
  searchQuery: string
  onCategoryChange: (id: number | null) => void
  onSearchChange: (query: string) => void
  onProductClick: (product: POSProduct) => void
  onViewCart: () => void
  cartItemCount: number
}

function KioskBrowse({
  products,
  categories,
  isLoading,
  selectedCategory,
  searchQuery,
  onCategoryChange,
  onSearchChange,
  onProductClick,
  onViewCart,
  cartItemCount,
}: KioskBrowseProps) {
  // Variables non utilisées mais requises par l'interface
  const _onViewCart = onViewCart;
  const _cartItemCount = cartItemCount;
  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Categories sidebar */}
      <div className="w-64 bg-gray-800 p-4 overflow-y-auto">
        <button
          onClick={() => onCategoryChange(null)}
          className={`w-full p-4 rounded-xl text-left mb-2 transition-colors ${
            selectedCategory === null
              ? 'bg-teal-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          <span className="text-lg font-medium">Tous les produits</span>
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
            className={`w-full p-4 rounded-xl text-left mb-2 transition-colors ${
              selectedCategory === cat.id
                ? 'bg-teal-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <span className="text-lg font-medium">{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Products grid */}
      <div className="flex-1 flex flex-col">
        {/* Search bar */}
        <div className="p-4 bg-gray-800">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Rechercher un produit..."
              className="w-full pl-14 pr-4 py-4 bg-gray-700 border-0 rounded-xl text-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                <X className="h-6 w-6 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-12 w-12 text-teal-500 animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Package className="h-20 w-20 mb-4" />
              <p className="text-xl">Aucun produit trouvé</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((product) => (
                <KioskProductCard
                  key={product.id}
                  product={product}
                  onClick={() => onProductClick(product)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// PRODUCT CARD
// ============================================================================

interface KioskProductCardProps {
  product: POSProduct
  onClick: () => void
}

function KioskProductCard({ product, onClick }: KioskProductCardProps) {
  const isOutOfStock = product.type === 'product' && product.stockQuantity <= 0

  return (
    <button
      onClick={onClick}
      disabled={isOutOfStock}
      className={`
        relative flex flex-col bg-gray-800 rounded-2xl overflow-hidden
        transition-all duration-150 min-h-[200px]
        ${isOutOfStock
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:bg-gray-700 hover:scale-[1.02] active:scale-[0.98]'
        }
      `}
    >
      {/* Image */}
      <div className="h-32 bg-gray-700 overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-12 w-12 text-gray-500" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 p-4 flex flex-col justify-between">
        <h3 className="text-lg font-medium text-white line-clamp-2">
          {product.name}
        </h3>
        <p className="text-2xl font-bold text-teal-400 mt-2">
          {product.price.toFixed(2)} TND
        </p>
      </div>

      {/* Add indicator */}
      <div className="absolute top-3 right-3 p-2 bg-teal-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
        <Plus className="h-5 w-5 text-white" />
      </div>

      {/* Out of stock */}
      {isOutOfStock && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <span className="px-4 py-2 bg-red-600 text-white rounded-full font-medium">
            Rupture
          </span>
        </div>
      )}
    </button>
  )
}

// ============================================================================
// CART COMPONENT
// ============================================================================

interface KioskCartProps {
  items: KioskCartItem[]
  total: number
  onUpdateQuantity: (productId: number, delta: number) => void
  onRemove: (productId: number) => void
  onClear: () => void
  onBack: () => void
  onCheckout: () => void
}

function KioskCart({
  items,
  total,
  onUpdateQuantity,
  onRemove,
  onClear,
  onBack,
  onCheckout,
}: KioskCartProps) {
  return (
    <div className="flex-1 flex flex-col p-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 self-start"
      >
        <ArrowLeft className="h-6 w-6" />
        <span className="text-lg">Continuer mes achats</span>
      </button>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Cart items */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-4">
          {items.map((item) => (
            <div
              key={item.product.id}
              className="flex items-center gap-4 bg-gray-800 rounded-2xl p-4"
            >
              {/* Image */}
              <div className="w-24 h-24 bg-gray-700 rounded-xl overflow-hidden flex-shrink-0">
                {item.product.imageUrl ? (
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-8 w-8 text-gray-500" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <h3 className="text-xl font-medium text-white">
                  {item.product.name}
                </h3>
                <p className="text-teal-400 text-lg">
                  {item.product.price.toFixed(2)} TND
                </p>
              </div>

              {/* Quantity controls - Large touch targets */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateQuantity(item.product.id, -1)}
                  className="w-14 h-14 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-xl"
                >
                  <Minus className="h-6 w-6 text-white" />
                </button>
                <span className="w-14 text-center text-2xl font-bold text-white">
                  {item.quantity}
                </span>
                <button
                  onClick={() => onUpdateQuantity(item.product.id, 1)}
                  className="w-14 h-14 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-xl"
                >
                  <Plus className="h-6 w-6 text-white" />
                </button>
              </div>

              {/* Subtotal */}
              <div className="w-32 text-right">
                <p className="text-xl font-bold text-white">
                  {(item.product.price * item.quantity).toFixed(2)} TND
                </p>
              </div>

              {/* Remove */}
              <button
                onClick={() => onRemove(item.product.id)}
                className="p-3 hover:bg-red-600/20 rounded-xl"
              >
                <Trash2 className="h-6 w-6 text-red-500" />
              </button>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="w-96 bg-gray-800 rounded-2xl p-6 flex flex-col">
          <h2 className="text-2xl font-bold text-white mb-6">Récapitulatif</h2>

          <div className="flex-1 space-y-4">
            <div className="flex justify-between text-gray-400">
              <span>Sous-total</span>
              <span>{total.toFixed(2)} TND</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>TVA (19%)</span>
              <span>{(total * 0.19 / 1.19).toFixed(2)} TND</span>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-4 mt-4">
            <div className="flex justify-between mb-6">
              <span className="text-xl text-gray-300">Total</span>
              <span className="text-3xl font-bold text-teal-400">
                {total.toFixed(2)} TND
              </span>
            </div>

            <button
              onClick={onCheckout}
              className="w-full py-5 bg-teal-600 hover:bg-teal-700 text-white text-xl font-bold rounded-2xl flex items-center justify-center gap-3 transition-colors"
            >
              <CreditCard className="h-7 w-7" />
              Payer
            </button>

            <button
              onClick={onClear}
              className="w-full py-3 mt-3 text-gray-400 hover:text-white transition-colors"
            >
              Vider le panier
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// PAYMENT COMPONENT
// ============================================================================

interface KioskPaymentProps {
  total: number
}

function KioskPayment({ total }: KioskPaymentProps) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <Loader2 className="h-24 w-24 text-teal-500 animate-spin mx-auto" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">
          Traitement du paiement...
        </h2>
        <p className="text-xl text-gray-400">
          Montant: <span className="text-teal-400 font-bold">{total.toFixed(2)} TND</span>
        </p>
        <p className="text-gray-500 mt-4">
          Veuillez patienter
        </p>
      </div>
    </div>
  )
}

// ============================================================================
// SUCCESS COMPONENT
// ============================================================================

interface KioskSuccessProps {
  onNewOrder: () => void
}

function KioskSuccess({ onNewOrder }: KioskSuccessProps) {
  // Auto-return after 10 seconds
  useEffect(() => {
    const timer = setTimeout(onNewOrder, 10000)
    return () => clearTimeout(timer)
  }, [onNewOrder])

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <div className="w-32 h-32 bg-green-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="h-20 w-20 text-white" />
          </div>
        </div>
        <h2 className="text-4xl font-bold text-white mb-4">
          Merci pour votre achat !
        </h2>
        <p className="text-xl text-gray-400 mb-8">
          Votre paiement a été accepté
        </p>
        <button
          onClick={onNewOrder}
          className="px-12 py-5 bg-teal-600 hover:bg-teal-700 text-white text-xl font-bold rounded-2xl transition-colors"
        >
          Nouvelle commande
        </button>
      </div>
    </div>
  )
}
