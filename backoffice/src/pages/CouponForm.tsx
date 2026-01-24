import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { useCreateCoupon } from '../hooks/useCoupons'
import type { CouponCreate } from '../types'

export default function CouponForm() {
  const navigate = useNavigate()
  const createCoupon = useCreateCoupon()

  const [formData, setFormData] = useState<CouponCreate>({
    name: '',
    code: '',
    discount_type: 'percent',
    discount_value: 0,
    date_from: '',
    date_to: '',
    max_usage: 0,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }))
    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis'
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Le code promo est requis'
    } else if (formData.code.length < 3) {
      newErrors.code = 'Le code doit contenir au moins 3 caractères'
    }

    if (formData.discount_value <= 0) {
      newErrors.discount_value = 'La réduction doit être supérieure à 0'
    }

    if (formData.discount_type === 'percent' && formData.discount_value > 100) {
      newErrors.discount_value = 'Le pourcentage ne peut pas dépasser 100%'
    }

    if (formData.date_from && formData.date_to) {
      const dateFrom = new Date(formData.date_from)
      const dateTo = new Date(formData.date_to)
      if (dateTo < dateFrom) {
        newErrors.date_to = 'La date de fin doit être après la date de début'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      // Préparer les données pour l'API
      const data: CouponCreate = {
        name: formData.name,
        code: formData.code.toUpperCase(), // Mettre en majuscules
        discount_type: formData.discount_type,
        discount_value: formData.discount_value,
      }

      // Ajouter les champs optionnels seulement s'ils sont remplis
      if (formData.date_from) {
        data.date_from = formData.date_from
      }
      if (formData.date_to) {
        data.date_to = formData.date_to
      }
      if (formData.max_usage && formData.max_usage > 0) {
        data.max_usage = formData.max_usage
      }

      await createCoupon.mutateAsync(data)
      navigate('/coupons')
    } catch (error) {
      console.error('Erreur lors de la création du coupon:', error)
      setErrors({ submit: 'Erreur lors de la création du coupon. Veuillez réessayer.' })
    }
  }

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <button
              onClick={() => navigate('/coupons')}
              className="mr-4 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Nouveau coupon</h1>
              <p className="text-gray-600 mt-2">Créer un code promo pour vos clients</p>
            </div>
          </div>
        </div>

        <div className="max-w-2xl">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
            {/* Nom */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nom du coupon *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="ex: Promotion été 2026"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Code */}
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                Code promo *
              </label>
              <input
                type="text"
                id="code"
                name="code"
                value={formData.code}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent uppercase ${
                  errors.code ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="ex: SUMMER2026"
              />
              {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code}</p>}
              <p className="mt-1 text-sm text-gray-500">
                Le code sera automatiquement converti en majuscules
              </p>
            </div>

            {/* Type de réduction */}
            <div>
              <label htmlFor="discount_type" className="block text-sm font-medium text-gray-700 mb-2">
                Type de réduction *
              </label>
              <select
                id="discount_type"
                name="discount_type"
                value={formData.discount_type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="percent">Pourcentage (%)</option>
                <option value="fixed">Montant fixe (€)</option>
              </select>
            </div>

            {/* Valeur de la réduction */}
            <div>
              <label htmlFor="discount_value" className="block text-sm font-medium text-gray-700 mb-2">
                Valeur de la réduction *
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="discount_value"
                  name="discount_value"
                  value={formData.discount_value}
                  onChange={handleChange}
                  min="0"
                  max={formData.discount_type === 'percent' ? '100' : undefined}
                  step={formData.discount_type === 'percent' ? '1' : '0.01'}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    errors.discount_value ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={formData.discount_type === 'percent' ? '10' : '5.00'}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-500 text-sm">
                    {formData.discount_type === 'percent' ? '%' : '€'}
                  </span>
                </div>
              </div>
              {errors.discount_value && (
                <p className="mt-1 text-sm text-red-600">{errors.discount_value}</p>
              )}
            </div>

            {/* Date de début */}
            <div>
              <label htmlFor="date_from" className="block text-sm font-medium text-gray-700 mb-2">
                Date de début
              </label>
              <input
                type="date"
                id="date_from"
                name="date_from"
                value={formData.date_from}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="mt-1 text-sm text-gray-500">
                Laisser vide pour activer immédiatement
              </p>
            </div>

            {/* Date de fin */}
            <div>
              <label htmlFor="date_to" className="block text-sm font-medium text-gray-700 mb-2">
                Date de fin
              </label>
              <input
                type="date"
                id="date_to"
                name="date_to"
                value={formData.date_to}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.date_to ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.date_to && <p className="mt-1 text-sm text-red-600">{errors.date_to}</p>}
              <p className="mt-1 text-sm text-gray-500">
                Laisser vide pour une validité illimitée
              </p>
            </div>

            {/* Limite d'utilisation */}
            <div>
              <label htmlFor="max_usage" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre maximum d'utilisations
              </label>
              <input
                type="number"
                id="max_usage"
                name="max_usage"
                value={formData.max_usage}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="0 = illimité"
              />
              <p className="mt-1 text-sm text-gray-500">
                Laisser à 0 pour un nombre illimité d'utilisations
              </p>
            </div>

            {/* Erreur de soumission */}
            {errors.submit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            {/* Boutons */}
            <div className="flex space-x-4 pt-4">
              <button
                type="submit"
                disabled={createCoupon.isPending}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createCoupon.isPending ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Création...
                  </div>
                ) : (
                  'Créer le coupon'
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/coupons')}
                className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}
