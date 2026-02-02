/**
 * Terminal POS - Interface caissier plein écran
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Monitor, Search, Settings, X, Wifi, WifiOff, LogOut, AlertCircle } from 'lucide-react'
import { ProductGrid, CartPanel, PaymentModal } from '../../components/pos'
import { usePOSProducts, usePOSCategories } from '../../hooks/pos/usePOSProducts'
import { usePOSActiveSession, useCloseSession } from '../../hooks/pos/usePOSSession'
import { usePOSCheckout } from '../../hooks/pos/usePOSOrders'
import { usePOSCartStore } from '../../stores/pos'
import { logger } from '../../lib/logger'
import type { POSProduct } from '../../types/pos'

export default function POSTerminal() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [showPayment, setShowPayment] = useState(false)
  const [_showSettings, setShowSettings] = useState(false)

  // Session and cart state
  const { session, config, isOpen, canMakeSales: _canMakeSales, connectionStatus } = usePOSActiveSession()
  const _closeSession = useCloseSession()
  const { checkout, isLoading: isCheckingOut } = usePOSCheckout()

  // Cart store
  const {
    lines,
    customer,
    subtotal,
    discountAmount,
    total,
    itemCount,
    addProduct,
    updateQuantity,
    removeLine,
    clearCart,
    suspendCart,
  } = usePOSCartStore()

  // Products and categories
  const { data: productsData, isLoading: productsLoading } = usePOSProducts({
    configId: config?.id || 0,
    categoryId: selectedCategory || undefined,
    search: searchQuery || undefined,
    limit: 50,
  })

  const { data: categories = [] } = usePOSCategories(config?.id || 0)

  // Redirect if no session
  useEffect(() => {
    if (!isOpen) {
      navigate('/pos/session/open')
    }
  }, [isOpen, navigate])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault()
        document.getElementById('pos-search')?.focus()
      } else if (e.key === 'F8' && lines.length > 0) {
        e.preventDefault()
        setShowPayment(true)
      } else if (e.key === 'F9' && lines.length > 0) {
        e.preventDefault()
        suspendCart()
      } else if (e.key === 'Escape') {
        setShowPayment(false)
        setShowSettings(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lines.length, suspendCart])

  // Handle product click
  const handleProductClick = useCallback((product: POSProduct) => {
    addProduct(product)
  }, [addProduct])

  // Handle checkout
  const handleCheckout = async (payments: { payment_method_id: number; amount: number }[]) => {
    try {
      await checkout(payments)
      setShowPayment(false)
      // TODO: Print receipt
    } catch (error) {
      logger.error('Checkout error:', error)
    }
  }

  // Handle close session
  const handleCloseSession = () => {
    if (lines.length > 0) {
      // Warn about unsaved cart
      if (!confirm('Vous avez un panier non validé. Fermer quand même ?')) {
        return
      }
    }
    navigate('/pos')
  }

  if (!session || !config) {
    return (
      <div className="h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Chargement de la session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-100 dark:bg-gray-900 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
              <Monitor className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <span className="font-medium text-gray-900 dark:text-white">{config.name}</span>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                Session #{session.id}
              </span>
            </div>
          </div>

          {/* Connection status */}
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
            connectionStatus === 'online'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : connectionStatus === 'reconnecting'
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {connectionStatus === 'online' ? (
              <Wifi className="h-3 w-3" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            {connectionStatus === 'online' ? 'En ligne' : connectionStatus === 'reconnecting' ? 'Reconnexion...' : 'Hors ligne'}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              id="pos-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher (F2)"
              className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm w-72 focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white placeholder-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* Actions */}
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            title="Paramètres"
          >
            <Settings className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
          <button
            onClick={handleCloseSession}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            title="Quitter"
          >
            <LogOut className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Product grid area */}
        <div className="flex-1 bg-white dark:bg-gray-800 m-2 mr-0 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <ProductGrid
            products={productsData?.products || []}
            categories={categories}
            isLoading={productsLoading}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            onProductClick={handleProductClick}
          />
        </div>

        {/* Cart panel */}
        <div className="w-96 m-2 bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <CartPanel
            lines={lines}
            customer={customer}
            subtotal={subtotal}
            discountAmount={discountAmount}
            total={total}
            itemCount={itemCount}
            onUpdateQuantity={updateQuantity}
            onRemoveLine={removeLine}
            onSelectCustomer={() => {/* TODO: Customer modal */}}
            onApplyDiscount={() => {/* TODO: Discount modal */}}
            onCheckout={() => setShowPayment(true)}
            onClearCart={clearCart}
          />
        </div>
      </div>

      {/* Payment modal */}
      <PaymentModal
        isOpen={showPayment}
        total={total}
        paymentMethods={config.paymentMethods}
        isProcessing={isCheckingOut}
        onClose={() => setShowPayment(false)}
        onConfirm={handleCheckout}
      />

      {/* Keyboard shortcuts hint */}
      <div className="absolute bottom-4 left-4 text-xs text-gray-400 dark:text-gray-600 space-x-4">
        <span>F2: Recherche</span>
        <span>F8: Payer</span>
        <span>F9: Suspendre</span>
        <span>Esc: Fermer</span>
      </div>
    </div>
  )
}
