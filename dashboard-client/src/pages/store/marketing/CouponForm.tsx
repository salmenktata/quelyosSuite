/**
 * Formulaire Coupon - Création/édition codes promo
 *
 * Fonctionnalités :
 * - Code personnalisé ou généré automatiquement
 * - Type réduction (pourcentage, montant fixe, livraison gratuite)
 * - Conditions application (montant minimum, produits éligibles)
 * - Limites utilisation (nombre max, un par client)
 * - Validité temporelle avec sélecteur dates
 * - Prévisualisation impact sur panier exemple
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { useCreateCoupon } from '@/hooks/useCoupons'
import type { CouponCreate } from '@/types'
import { Button, Input, Breadcrumbs, PageNotice } from '@/components/common'
import { storeNotices } from '@/lib/notices'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/common/Toast'
import { logger } from '@quelyos/logger'

export default function CouponForm() {
  const navigate = useNavigate()
  const createCoupon = useCreateCoupon()
  const toast = useToast()

  const [formData, setFormData] = useState<CouponCreate>({
    name: '',
    code: '',
    discount_type: 'percentage',
    discountvalue: 0,
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

    if (!formData.name || !formData.name.trim()) {
      newErrors.name = 'Le nom est requis'
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Le code promo est requis'
    } else if (formData.code.length < 3) {
      newErrors.code = 'Le code doit contenir au moins 3 caractères'
    }

    if (formData.discountvalue <= 0) {
      newErrors.discountvalue = 'La réduction doit être supérieure à 0'
    }

    if (formData.discount_type === 'percentage' && formData.discountvalue > 100) {
      newErrors.discountvalue = 'Le pourcentage ne peut pas dépasser 100%'
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
      toast.error('Veuillez corriger les erreurs du formulaire')
      return
    }

    try {
      // Préparer les données pour l'API
      const data: CouponCreate = {
        name: formData.name,
        code: formData.code.toUpperCase(), // Mettre en majuscules
        discount_type: formData.discount_type,
        discountvalue: formData.discountvalue,
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
      toast.success(`Le coupon "${formData.code.toUpperCase()}" a été créé avec succès`)
      navigate('/coupons')
    } catch (error) {
      logger.error('Erreur lors de la création du coupon:', error)
      toast.error('Erreur lors de la création du coupon. Veuillez réessayer.')
    }
  }

  return (
    <Layout>
      <div className="p-8">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Codes Promo', href: '/coupons' },
            { label: 'Nouveau coupon' },
          ]}
        />

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Nouveau coupon</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Créer un code promo pour vos clients</p>
        </div>

        <PageNotice config={storeNotices.couponForm} className="mb-6" />

        <div className="max-w-2xl">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-6">
            {/* Nom */}
            <Input
              label="Nom du coupon"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              required
              placeholder="ex: Promotion été 2026"
            />

            {/* Code */}
            <div>
              <Input
                label="Code promo"
                id="code"
                name="code"
                value={formData.code}
                onChange={handleChange}
                error={errors.code}
                required
                placeholder="ex: SUMMER2026"
                className="uppercase"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Le code sera automatiquement converti en majuscules
              </p>
            </div>

            {/* Type de réduction */}
            <div>
              <label htmlFor="discount_type" className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
                Type de réduction *
              </label>
              <select
                id="discount_type"
                name="discount_type"
                value={formData.discount_type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="percent">Pourcentage (%)</option>
                <option value="fixed">Montant fixe (€)</option>
              </select>
            </div>

            {/* Valeur de la réduction */}
            <Input
              label="Valeur de la réduction"
              type="number"
              id="discountvalue"
              name="discountvalue"
              value={formData.discountvalue.toString()}
              onChange={handleChange}
              error={errors.discountvalue}
              required
              min="0"
              max={formData.discount_type === 'percentage' ? '100' : undefined}
              step={formData.discount_type === 'percentage' ? '1' : '0.01'}
              placeholder={formData.discount_type === 'percentage' ? '10' : '5.00'}
              helperText={formData.discount_type === 'percentage' ? 'Pourcentage de réduction' : 'Montant fixe en euros'}
              icon={
                <span className="text-sm">
                  {formData.discount_type === 'percentage' ? '%' : '€'}
                </span>
              }
            />

            {/* Date de début */}
            <div>
              <label htmlFor="date_from" className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
                Date de début
              </label>
              <input
                type="date"
                id="date_from"
                name="date_from"
                value={formData.date_from}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                Laisser vide pour activer immédiatement
              </p>
            </div>

            {/* Date de fin */}
            <div>
              <label htmlFor="date_to" className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
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
              {errors.date_to && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.date_to}</p>}
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                Laisser vide pour une validité illimitée
              </p>
            </div>

            {/* Limite d'utilisation */}
            <div>
              <label htmlFor="max_usage" className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
                Nombre maximum d'utilisations
              </label>
              <input
                type="number"
                id="max_usage"
                name="max_usage"
                value={formData.max_usage}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="0 = illimité"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                Laisser à 0 pour un nombre illimité d'utilisations
              </p>
            </div>

            {/* Boutons */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/coupons')}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={createCoupon.isPending}
                disabled={createCoupon.isPending}
              >
                Créer le coupon
              </Button>
            </div>
          </form>
        </div>

        {/* ToastContainer */}
        <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} position="top-right" />
      </div>
    </Layout>
  )
}
