/**
 * Types pour les flux de paiement (Payment Flows)
 */

export type FlowType = 'income' | 'expense' | 'transfer' | 'recurring' | 'CASH' | 'CARD' | 'CHECK' | 'TRANSFER' | 'MOBILE' | 'OTHER' | 'DIRECT_DEBIT' | 'WIRE_TRANSFER'

export interface PaymentFlow {
  id: number
  name: string
  type: FlowType
  amount?: number
  frequency?: string
  description?: string
  active?: boolean
  accountId?: number
}

export type CreatePaymentFlowRequest = {
  name: string
  type: string
  amount?: number
  frequency?: string
  description?: string
}

export type UpdatePaymentFlowRequest = Partial<CreatePaymentFlowRequest>
