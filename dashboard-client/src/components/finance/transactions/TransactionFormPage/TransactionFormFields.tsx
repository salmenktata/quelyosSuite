/**
 * Champs du formulaire de transaction (income/expense)
 * Extrait de TransactionFormPage.tsx pour réduire la complexité
 */

import { PaymentFlowSelector } from '../../../PaymentFlowSelector'
import { CategorySuggestionCard } from '../CategorySuggestionCard'
import type { TransactionFormData } from '../transactionFormReducer'

type Account = { id: number; name: string }
type Category = { id: number; name: string; kind: 'INCOME' | 'EXPENSE' }

interface ConfigType {
  type: 'credit' | 'debit'
  amountPlaceholder: string
  paymentFlowHint: string
  tagsPlaceholder: string
  tagsHint: string
  descriptionPlaceholder: string
  buttonGradient: string
  buttonGradientHover: string
  addButtonText: string
}

interface TransactionFormFieldsProps {
  formData: TransactionFormData
  accounts: Account[]
  categories: Category[]
  config: ConfigType
  statusOptions: Array<{ value: string; label: string }>
  editingId: number | null
  loading: boolean
  onFormChange: (data: Partial<TransactionFormData>) => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  onCancelEdit: () => void
  error: string | null
}

export function TransactionFormFields({
  formData,
  accounts,
  categories,
  config,
  statusOptions,
  editingId,
  loading,
  onFormChange,
  onSubmit,
  onCancelEdit,
  error,
}: TransactionFormFieldsProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl shadow-xl"
    >
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Détail</h2>
        <p className="text-sm text-indigo-100/80">Montant, compte et statut opérationnel.</p>
      </div>

      {/* Ligne 1 : Montant / Compte */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm text-indigo-100" htmlFor="amount">
            Montant
          </label>
          <input
            id="amount"
            type="number"
            min="0"
            step="0.01"
            name="amount"
            placeholder={config.amountPlaceholder}
            value={formData.amount}
            onChange={(e) => onFormChange({ amount: e.target.value })}
            className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white placeholder:text-indigo-100/60 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-indigo-100" htmlFor="account">
            Compte
          </label>
          <select
            id="account"
            name="accountId"
            value={formData.accountId}
            onChange={(e) =>
              onFormChange({
                accountId: e.target.value,
                paymentFlowId: null, // Reset flux when account changes
              })
            }
            className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
            required
          >
            <option value="">Sélectionner un compte</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Flux de paiement */}
      <div className="space-y-2">
        <label className="text-sm text-indigo-100">Flux de paiement</label>
        {formData.accountId ? (
          <PaymentFlowSelector
            accountId={Number(formData.accountId)}
            value={formData.paymentFlowId}
            onChange={(flowId: number | null) => onFormChange({ paymentFlowId: flowId })}
          />
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-indigo-100/60">
            Sélectionnez un compte pour choisir le flux
          </div>
        )}
        <p className="text-xs text-indigo-100/70">{config.paymentFlowHint}</p>
      </div>

      {/* Ligne 2 : Catégorie / Statut */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm text-indigo-100" htmlFor="category">
            Catégorie
          </label>
          <select
            id="category"
            name="categoryId"
            value={formData.categoryId}
            onChange={(e) => onFormChange({ categoryId: e.target.value })}
            className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
          >
            <option value="">Aucune</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-indigo-100" htmlFor="status">
            Statut
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={(e) =>
              onFormChange({
                status: e.target.value as TransactionFormData['status'],
              })
            }
            className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
          >
            {statusOptions.map((s) => (
              <option key={s.value} value={s.value} className="text-slate-900">
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ML Category Suggestion */}
      {!editingId && formData.description && formData.amount && (
        <CategorySuggestionCard
          description={formData.description}
          amount={Number(formData.amount)}
          type={config.type}
          currentCategoryId={formData.categoryId}
          onAccept={(categoryId: number, _categoryName: string) => {
            onFormChange({ categoryId: String(categoryId) })
          }}
          onReject={() => {
            // Just dismissed, no action needed
          }}
        />
      )}

      {/* Ligne 3 : Dates */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm text-indigo-100" htmlFor="occurredAt">
            Date effective
          </label>
          <input
            id="occurredAt"
            type="date"
            name="occurredAt"
            value={formData.occurredAt}
            onChange={(e) => onFormChange({ occurredAt: e.target.value })}
            className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-indigo-100" htmlFor="scheduledFor">
            Date planifiée
          </label>
          <input
            id="scheduledFor"
            type="date"
            name="scheduledFor"
            value={formData.scheduledFor}
            onChange={(e) => onFormChange({ scheduledFor: e.target.value })}
            className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
            required={formData.status === 'PLANNED' || formData.status === 'SCHEDULED'}
          />
        </div>
      </div>

      {/* Ligne 4 : Tags */}
      <div className="space-y-2">
        <label className="text-sm text-indigo-100" htmlFor="tags">
          Tags (séparés par des virgules)
        </label>
        <input
          id="tags"
          type="text"
          name="tags"
          placeholder={config.tagsPlaceholder}
          value={formData.tags}
          onChange={(e) => onFormChange({ tags: e.target.value })}
          className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white placeholder:text-indigo-100/60 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
        />
        <p className="text-xs text-indigo-100/70">{config.tagsHint}</p>
      </div>

      {/* Ligne 5 : Description */}
      <div className="space-y-2">
        <label className="text-sm text-indigo-100" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          placeholder={config.descriptionPlaceholder}
          value={formData.description}
          onChange={(e) => onFormChange({ description: e.target.value })}
          className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white placeholder:text-indigo-100/60 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
        />
        <p className="text-xs text-indigo-100/70">
          Facultatif : note de contexte affichée dans la liste.
        </p>
      </div>

      <button
        type="submit"
        className={`w-full rounded-xl bg-gradient-to-r ${config.buttonGradient} px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:${config.buttonGradientHover} disabled:opacity-60`}
        disabled={loading}
      >
        {editingId
          ? loading
            ? 'Mise à jour...'
            : 'Mettre à jour'
          : loading
            ? 'Création...'
            : config.addButtonText}
      </button>

      {editingId && (
        <button
          type="button"
          onClick={onCancelEdit}
          className="w-full rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold text-indigo-50 transition hover:border-white/40"
          disabled={loading}
        >
          Annuler l&apos;édition
        </button>
      )}

      {error && (
        <div role="alert" className="rounded-lg border border-red-300/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}
    </form>
  )
}
