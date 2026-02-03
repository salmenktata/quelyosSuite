/**
 * Modal de paiement POS avec support multi-paiement (split)
 * Permet de diviser un paiement entre plusieurs méthodes
 */

import { useState, useEffect, useId } from 'react'
import {
  X,
  Banknote,
  CreditCard,
  Wallet,
  Check,
  Loader2,
  Plus,
  Trash2,
  Split,
  Calculator,
} from 'lucide-react'
import type { POSPaymentMethod } from '../../types/pos'

interface PaymentModalProps {
  isOpen: boolean
  total: number
  paymentMethods: POSPaymentMethod[]
  isProcessing: boolean
  onClose: () => void
  onConfirm: (payments: { payment_method_id: number; amount: number }[]) => void
}

interface SplitPayment {
  id: string
  method: POSPaymentMethod
  amount: number
}

export function PaymentModal({
  isOpen,
  total,
  paymentMethods,
  isProcessing,
  onClose,
  onConfirm,
}: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<POSPaymentMethod | null>(null)
  const [amount, setAmount] = useState('')
  const [payments, setPayments] = useState<SplitPayment[]>([])
  const [isSplitMode, setIsSplitMode] = useState(false)
  const [paymentCounter, setPaymentCounter] = useState(0)
  const baseId = useId()

  const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0)
  const remaining = Math.max(0, total - paidAmount)
  const currentAmount = parseFloat(amount) || 0
  const totalWithCurrent = paidAmount + currentAmount
  const change = totalWithCurrent > total ? totalWithCurrent - total : 0

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      const defaultMethod = (paymentMethods.find((m) => m.code === 'cash') || paymentMethods[0]) ?? null
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedMethod(defaultMethod)
      setAmount(total.toFixed(2))
      setPayments([])
      setIsSplitMode(false)
    }
  }, [isOpen, total, paymentMethods])

  // Auto-fill remaining amount when in split mode
  useEffect(() => {
    if (isSplitMode && remaining > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAmount(remaining.toFixed(2))
    }
  }, [isSplitMode, remaining])

  if (!isOpen) return null

  const handleNumPadClick = (value: string) => {
    if (value === 'C') {
      setAmount('')
    } else if (value === 'CE') {
      setAmount((prev) => prev.slice(0, -1))
    } else if (value === '.') {
      if (!amount.includes('.')) {
        setAmount((prev) => prev + '.')
      }
    } else {
      // Limit to 2 decimal places
      if (amount.includes('.') && (amount.split('.')[1]?.length ?? 0) >= 2) return
      setAmount((prev) => prev + value)
    }
  }

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toFixed(2))
  }

  const handleAddPayment = () => {
    if (!selectedMethod || !amount || parseFloat(amount) <= 0) return

    const paymentAmount = parseFloat(amount)
    const newPayment: SplitPayment = {
      id: `${baseId}-${paymentCounter}`,
      method: selectedMethod,
      amount: paymentAmount,
    }
    setPaymentCounter((c) => c + 1)
    setPayments((prev) => [...prev, newPayment])
    setAmount('')

    // Pré-remplir avec le montant restant
    const newRemaining = total - paidAmount - paymentAmount
    if (newRemaining > 0) {
      setAmount(newRemaining.toFixed(2))
    }
  }

  const handleRemovePayment = (paymentId: string) => {
    setPayments((prev) => prev.filter((p) => p.id !== paymentId))
  }

  const handleConfirm = () => {
    // Add current amount if any
    const allPayments = [...payments]
    if (amount && parseFloat(amount) > 0 && selectedMethod) {
      allPayments.push({
        id: `${baseId}-confirm`,
        method: selectedMethod,
        amount: parseFloat(amount),
      })
    }

    if (allPayments.length === 0) return

    // Verify total is covered
    const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0)
    if (totalPaid < total) {
      alert(`Montant insuffisant. Il manque ${(total - totalPaid).toFixed(2)} TND`)
      return
    }

    onConfirm(
      allPayments.map((p) => ({
        payment_method_id: p.method.id,
        amount: p.amount,
      }))
    )
  }

  const handleSplitEqual = (numParts: number) => {
    if (!selectedMethod || numParts < 2) return
    const partAmount = Math.ceil((total / numParts) * 100) / 100

    const newPayments: SplitPayment[] = []
    let remainingTotal = total

    for (let i = 0; i < numParts; i++) {
      const amount = i === numParts - 1 ? remainingTotal : partAmount
      newPayments.push({
        id: `${baseId}-split-${i}`,
        method: selectedMethod,
        amount: Math.round(amount * 100) / 100,
      })
      remainingTotal -= amount
    }

    setPayments(newPayments)
    setAmount('')
    setIsSplitMode(true)
  }

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'cash':
        return Banknote
      case 'card':
        return CreditCard
      case 'digital':
        return Wallet
      default:
        return Banknote
    }
  }

  const canConfirm = totalWithCurrent >= total || (payments.length > 0 && paidAmount >= total)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-3xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Paiement</h2>
            {/* Split mode toggle */}
            <button
              onClick={() => setIsSplitMode(!isSplitMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isSplitMode
                  ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Split className="h-4 w-4" />
              Multi-paiement
            </button>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" aria-label="Fermer">
            <X className="h-5 w-5 text-gray-500" aria-hidden="true" />
          </button>
        </div>

        <div className="flex">
          {/* Left: Amount and NumPad */}
          <div className="flex-1 p-4 border-r border-gray-200 dark:border-gray-700">
            {/* Amount display */}
            <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 mb-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                {isSplitMode ? 'Montant partiel' : 'Montant reçu'}
              </div>
              <div className="text-4xl font-bold text-gray-900 dark:text-white text-right">
                {amount || '0.00'} <span className="text-lg">TND</span>
              </div>
            </div>

            {/* Quick amounts */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[10, 20, 50, 100].map((quickAmount) => (
                <button
                  key={quickAmount}
                  onClick={() => handleQuickAmount(quickAmount)}
                  className="py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium transition-colors"
                >
                  {quickAmount}
                </button>
              ))}
            </div>

            {/* Split presets */}
            {isSplitMode && payments.length === 0 && (
              <div className="mb-4 p-3 bg-teal-50 dark:bg-teal-900/20 rounded-xl">
                <p className="text-sm text-teal-700 dark:text-teal-300 mb-2 font-medium">
                  Division rapide :
                </p>
                <div className="flex gap-2">
                  {[2, 3, 4].map((parts) => (
                    <button
                      key={parts}
                      onClick={() => handleSplitEqual(parts)}
                      className="flex-1 py-2 bg-teal-100 dark:bg-teal-800 hover:bg-teal-200 dark:hover:bg-teal-700 text-teal-700 dark:text-teal-200 rounded-lg text-sm font-medium transition-colors"
                    >
                      ÷ {parts} ({(total / parts).toFixed(2)})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* NumPad */}
            <div className="grid grid-cols-3 gap-2">
              {['7', '8', '9', '4', '5', '6', '1', '2', '3', 'C', '0', '.'].map((key) => (
                <button
                  key={key}
                  onClick={() => handleNumPadClick(key)}
                  className={`
                    py-4 text-xl font-semibold rounded-xl transition-colors
                    ${
                      key === 'C'
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                    }
                  `}
                >
                  {key}
                </button>
              ))}
            </div>

            {/* Add payment button (split mode) */}
            {isSplitMode && (
              <button
                onClick={handleAddPayment}
                disabled={!amount || parseFloat(amount) <= 0}
                className="mt-4 w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Ajouter ce paiement
              </button>
            )}
          </div>

          {/* Right: Payment methods and summary */}
          <div className="w-72 p-4 flex flex-col">
            {/* Payment methods */}
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Mode de paiement
              </div>
              <div className="space-y-2">
                {paymentMethods.map((method) => {
                  const Icon = getMethodIcon(method.type)
                  const isSelected = selectedMethod?.id === method.id
                  return (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method)}
                      className={`
                        w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all
                        ${
                          isSelected
                            ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }
                      `}
                    >
                      <Icon className={`h-5 w-5 ${isSelected ? 'text-teal-600' : 'text-gray-400'}`} />
                      <span
                        className={`font-medium ${
                          isSelected ? 'text-teal-600 dark:text-teal-400' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {method.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Split payments list */}
            {payments.length > 0 && (
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Paiements ({payments.length})
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {payments.map((payment) => {
                    const Icon = getMethodIcon(payment.method.type)
                    return (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {payment.method.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {payment.amount.toFixed(2)}
                          </span>
                          <button
                            onClick={() => handleRemovePayment(payment.id)}
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="flex-1">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Total</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {total.toFixed(2)} TND
                  </span>
                </div>
                {paidAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Déjà payé</span>
                    <span className="font-semibold text-green-600">{paidAmount.toFixed(2)} TND</span>
                  </div>
                )}
                {currentAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Ce paiement</span>
                    <span className="font-semibold text-blue-600">{currentAmount.toFixed(2)} TND</span>
                  </div>
                )}
                {remaining > 0 && currentAmount === 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Reste à payer</span>
                    <span className="font-semibold text-orange-600">{remaining.toFixed(2)} TND</span>
                  </div>
                )}
                {change > 0 && (
                  <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-gray-700 dark:text-gray-300">Rendu</span>
                    <span className="font-bold text-xl text-teal-600 dark:text-teal-400">
                      {change.toFixed(2)} TND
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Status indicator */}
            {isSplitMode && (
              <div
                className={`mt-3 p-2 rounded-lg text-center text-sm font-medium ${
                  paidAmount >= total
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                }`}
              >
                {paidAmount >= total ? (
                  <span className="flex items-center justify-center gap-1">
                    <Check className="h-4 w-4" /> Montant complet
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1">
                    <Calculator className="h-4 w-4" /> Reste: {remaining.toFixed(2)} TND
                  </span>
                )}
              </div>
            )}

            {/* Confirm button */}
            <button
              onClick={handleConfirm}
              disabled={isProcessing || !canConfirm}
              className="mt-4 w-full py-4 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white font-semibold rounded-xl text-lg transition-colors flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Traitement...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  {isSplitMode ? 'Valider les paiements' : 'Valider'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
