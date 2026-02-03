/**
 * Store Zustand pour le panier POS
 * Gère l'état du panier en caisse avec persistance locale
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { POSCartLine, POSProduct, POSCustomer } from '../../types/pos'
import { assertArrayItem } from '../../lib/utils/safe-access'

// ============================================================================
// TYPES
// ============================================================================

interface CartState {
  // État du panier
  lines: POSCartLine[]
  customer: POSCustomer | null
  discountType: 'percent' | 'fixed' | null
  discountValue: number
  note: string

  // Paniers suspendus (multi-panier)
  suspendedCarts: SuspendedCart[]

  // Totaux (calculés)
  subtotal: number
  discountAmount: number
  taxAmount: number
  total: number
  itemCount: number

  // Actions panier
  addProduct: (product: POSProduct, quantity?: number) => void
  updateQuantity: (lineId: string, quantity: number) => void
  updateLineDiscount: (lineId: string, discount: number) => void
  removeLine: (lineId: string) => void
  setLineNote: (lineId: string, note: string) => void

  // Actions client
  setCustomer: (customer: POSCustomer) => void
  clearCustomer: () => void

  // Actions remise globale
  setOrderDiscount: (type: 'percent' | 'fixed', value: number) => void
  clearOrderDiscount: () => void

  // Actions note
  setNote: (note: string) => void

  // Actions panier
  clearCart: () => void
  suspendCart: () => string // Retourne l'ID du panier suspendu
  resumeCart: (suspendedId: string) => void
  deleteSuspendedCart: (suspendedId: string) => void

  // Export pour API
  toOrderData: () => OrderCreateData
}

interface SuspendedCart {
  id: string
  lines: POSCartLine[]
  customer: POSCustomer | null
  discountType: 'percent' | 'fixed' | null
  discountValue: number
  note: string
  suspendedAt: string
  total: number
  itemCount: number
}

interface OrderCreateData {
  lines: {
    product_id: number
    quantity: number
    price_unit: number
    discount: number
    tax_ids: number[]
    note?: string
    offline_line_id?: string
  }[]
  partner_id: number | null
  discount_type: 'percent' | 'fixed' | null
  discountvalue: number
  note: string | null
}

// ============================================================================
// HELPERS
// ============================================================================

const generateId = (): string => {
  return crypto.randomUUID ? crypto.randomUUID() :
    `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

const calculateTotals = (
  lines: POSCartLine[],
  discountType: 'percent' | 'fixed' | null,
  discountValue: number
) => {
  const subtotal = lines.reduce((sum, line) => sum + line.priceSubtotal, 0)

  let discountAmount = 0
  if (discountType === 'percent' && discountValue > 0) {
    discountAmount = subtotal * (discountValue / 100)
  } else if (discountType === 'fixed' && discountValue > 0) {
    discountAmount = Math.min(discountValue, subtotal)
  }

  // Estimation taxes (19% TVA tunisienne par défaut)
  const taxRate = 0.19
  const afterDiscount = subtotal - discountAmount
  const taxAmount = afterDiscount * taxRate / (1 + taxRate) // TVA incluse

  return {
    subtotal,
    discountAmount,
    taxAmount,
    total: afterDiscount,
    itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
  }
}

// ============================================================================
// STORE
// ============================================================================

export const usePOSCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      // État initial
      lines: [],
      customer: null,
      discountType: null,
      discountValue: 0,
      note: '',
      suspendedCarts: [],
      subtotal: 0,
      discountAmount: 0,
      taxAmount: 0,
      total: 0,
      itemCount: 0,

      // Ajouter un produit
      addProduct: (product, quantity = 1) => {
        set((state) => {
          const existingIndex = state.lines.findIndex(
            (l) => l.productId === product.id
          )

          let newLines: POSCartLine[]

          if (existingIndex >= 0) {
            // Produit existe, incrémenter quantité
            newLines = [...state.lines]
            const existingLine = assertArrayItem(newLines, existingIndex, 'Ligne panier introuvable')
            const line = { ...existingLine }
            line.quantity += quantity
            line.priceSubtotal = line.quantity * line.priceUnit * (1 - line.discount / 100)
            newLines[existingIndex] = line
          } else {
            // Nouveau produit
            const newLine: POSCartLine = {
              id: generateId(),
              productId: product.id,
              productName: product.name,
              sku: product.sku || '',
              imageUrl: product.imageUrl,
              quantity,
              priceUnit: product.price,
              discount: 0,
              priceSubtotal: quantity * product.price,
              taxIds: product.taxIds || [],
            }
            newLines = [...state.lines, newLine]
          }

          const totals = calculateTotals(newLines, state.discountType, state.discountValue)

          return {
            lines: newLines,
            ...totals,
          }
        })
      },

      // Mettre à jour quantité
      updateQuantity: (lineId, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            // Supprimer si quantité <= 0
            const newLines = state.lines.filter((l) => l.id !== lineId)
            const totals = calculateTotals(newLines, state.discountType, state.discountValue)
            return { lines: newLines, ...totals }
          }

          const newLines = state.lines.map((line) => {
            if (line.id === lineId) {
              return {
                ...line,
                quantity,
                priceSubtotal: quantity * line.priceUnit * (1 - line.discount / 100),
              }
            }
            return line
          })

          const totals = calculateTotals(newLines, state.discountType, state.discountValue)
          return { lines: newLines, ...totals }
        })
      },

      // Mettre à jour remise ligne
      updateLineDiscount: (lineId, discount) => {
        set((state) => {
          const clampedDiscount = Math.max(0, Math.min(100, discount))

          const newLines = state.lines.map((line) => {
            if (line.id === lineId) {
              return {
                ...line,
                discount: clampedDiscount,
                priceSubtotal: line.quantity * line.priceUnit * (1 - clampedDiscount / 100),
              }
            }
            return line
          })

          const totals = calculateTotals(newLines, state.discountType, state.discountValue)
          return { lines: newLines, ...totals }
        })
      },

      // Supprimer une ligne
      removeLine: (lineId) => {
        set((state) => {
          const newLines = state.lines.filter((l) => l.id !== lineId)
          const totals = calculateTotals(newLines, state.discountType, state.discountValue)
          return { lines: newLines, ...totals }
        })
      },

      // Note sur une ligne
      setLineNote: (lineId, note) => {
        set((state) => ({
          lines: state.lines.map((line) =>
            line.id === lineId ? { ...line, note } : line
          ),
        }))
      },

      // Définir le client
      setCustomer: (customer) => {
        set({ customer })
      },

      // Effacer le client
      clearCustomer: () => {
        set({ customer: null })
      },

      // Remise globale
      setOrderDiscount: (type, value) => {
        set((state) => {
          const totals = calculateTotals(state.lines, type, value)
          return {
            discountType: type,
            discountValue: value,
            ...totals,
          }
        })
      },

      // Effacer remise globale
      clearOrderDiscount: () => {
        set((state) => {
          const totals = calculateTotals(state.lines, null, 0)
          return {
            discountType: null,
            discountValue: 0,
            ...totals,
          }
        })
      },

      // Note globale
      setNote: (note) => {
        set({ note })
      },

      // Vider le panier
      clearCart: () => {
        set({
          lines: [],
          customer: null,
          discountType: null,
          discountValue: 0,
          note: '',
          subtotal: 0,
          discountAmount: 0,
          taxAmount: 0,
          total: 0,
          itemCount: 0,
        })
      },

      // Suspendre le panier (multi-panier)
      suspendCart: () => {
        const state = get()
        if (state.lines.length === 0) return ''

        const suspendedId = generateId()
        const suspended: SuspendedCart = {
          id: suspendedId,
          lines: [...state.lines],
          customer: state.customer,
          discountType: state.discountType,
          discountValue: state.discountValue,
          note: state.note,
          suspendedAt: new Date().toISOString(),
          total: state.total,
          itemCount: state.itemCount,
        }

        set((s) => ({
          suspendedCarts: [...s.suspendedCarts, suspended],
          // Vider le panier actuel
          lines: [],
          customer: null,
          discountType: null,
          discountValue: 0,
          note: '',
          subtotal: 0,
          discountAmount: 0,
          taxAmount: 0,
          total: 0,
          itemCount: 0,
        }))

        return suspendedId
      },

      // Reprendre un panier suspendu
      resumeCart: (suspendedId) => {
        const state = get()
        const suspended = state.suspendedCarts.find((s) => s.id === suspendedId)
        if (!suspended) return

        // Si panier actuel non vide, le suspendre d'abord
        if (state.lines.length > 0) {
          state.suspendCart()
        }

        const totals = calculateTotals(
          suspended.lines,
          suspended.discountType,
          suspended.discountValue
        )

        set((s) => ({
          lines: suspended.lines,
          customer: suspended.customer,
          discountType: suspended.discountType,
          discountValue: suspended.discountValue,
          note: suspended.note,
          ...totals,
          // Retirer de la liste des suspendus
          suspendedCarts: s.suspendedCarts.filter((c) => c.id !== suspendedId),
        }))
      },

      // Supprimer un panier suspendu
      deleteSuspendedCart: (suspendedId) => {
        set((state) => ({
          suspendedCarts: state.suspendedCarts.filter((c) => c.id !== suspendedId),
        }))
      },

      // Exporter pour création commande API
      toOrderData: () => {
        const state = get()
        return {
          lines: state.lines.map((line) => ({
            product_id: line.productId,
            quantity: line.quantity,
            price_unit: line.priceUnit,
            discount: line.discount,
            tax_ids: line.taxIds,
            note: line.note,
            offline_line_id: line.id,
          })),
          partner_id: state.customer?.id || null,
          discount_type: state.discountType,
          discountvalue: state.discountValue,
          note: state.note || null,
        }
      },
    }),
    {
      name: 'pos-cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        lines: state.lines,
        customer: state.customer,
        discountType: state.discountType,
        discountValue: state.discountValue,
        note: state.note,
        suspendedCarts: state.suspendedCarts,
      }),
    }
  )
)

// ============================================================================
// SELECTORS
// ============================================================================

export const selectCartIsEmpty = (state: CartState) => state.lines.length === 0
export const selectCartTotal = (state: CartState) => state.total
export const selectCartItemCount = (state: CartState) => state.itemCount
export const selectHasSuspendedCarts = (state: CartState) => state.suspendedCarts.length > 0
