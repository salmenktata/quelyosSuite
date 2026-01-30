/**
 * Stub component for PaymentFlowSelector
 * TODO: Implement actual payment flow selection
 */

interface PaymentFlowSelectorProps {
  accountId: number
  value?: number | null
  onChange: (flowId: number | null) => void
}

export function PaymentFlowSelector({ accountId, _value, onChange }: PaymentFlowSelectorProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-indigo-100/60">
      Sélection flux de paiement (compte #{accountId}) - En développement
    </div>
  )
}
