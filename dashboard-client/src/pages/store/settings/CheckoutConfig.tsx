/**
 * Checkout Configuration Page
 *
 * Configuration complète du processus de checkout e-commerce
 *
 * Features principales:
 * - Personnalisation 4 étapes (label, message, icon)
 * - Activation/désactivation étape livraison
 * - Preview temps réel du stepper
 * - Options checkout (guest, champs requis, progress bar)
 * - Sauvegarde automatique via React Query
 *
 * API Endpoints:
 * - POST /api/admin/checkout-config (get)
 * - POST /api/admin/checkout-config/save (save)
 */

import { Layout } from '@/components/Layout'
import { Breadcrumbs, Button, PageNotice } from '@/components/common'
import { Save } from 'lucide-react'
import { storeNotices } from '@/lib/notices'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { CheckoutPreviewEnhanced } from '@/components/store/CheckoutPreviewEnhanced'

interface CheckoutConfig {
  id: number
  // Étape 1
  step1_label: string
  step1_message: string
  step1_icon: string
  // Étape 2
  step2_label: string
  step2_message: string
  step2_icon: string
  step2_active: boolean
  // Étape 3
  step3_label: string
  step3_message: string
  step3_icon: string
  // Étape 4
  step4_label: string
  step4_message: string
  step4_icon: string
  // Général
  show_progress_bar: boolean
  allow_guest_checkout: boolean
  require_phone: boolean
  require_company: boolean
}

export default function CheckoutConfigPage() {
  const queryClient = useQueryClient()
  const [previewStep, setPreviewStep] = useState(2)

  const breadcrumbItems = [
    { label: 'Tableau de bord', path: '/dashboard' },
    { label: 'Store', path: '/store' },
    { label: 'Paramètres', path: '/store/settings' },
    { label: 'Configuration Checkout' },
  ]

  // Fetch config
  const { data: config, isLoading } = useQuery<CheckoutConfig>({
    queryKey: ['checkout-config'],
    queryFn: async () => {
      const response = await api.post('/api/admin/checkout-config', {})
      return response.data.config
    },
  })

  // Save config mutation
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<CheckoutConfig>) => {
      const response = await api.post('/api/admin/checkout-config/save', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkout-config'] })
    },
  })

  const handleSave = () => {
    if (config) {
      saveMutation.mutate(config)
    }
  }

  const handleChange = (field: keyof CheckoutConfig, value: string | boolean) => {
    if (config) {
      queryClient.setQueryData(['checkout-config'], { ...config, [field]: value })
    }
  }

  if (isLoading || !config) {
    return (
      <Layout>
        <Breadcrumbs items={breadcrumbItems} />
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </Layout>
    )
  }

  // Construire les étapes pour le preview
  const previewSteps = [
    { number: 1, label: config.step1_label, icon: config.step1_icon, message: config.step1_message },
    ...(config.step2_active ? [{ number: 2, label: config.step2_label, icon: config.step2_icon, message: config.step2_message }] : []),
    { number: config.step2_active ? 3 : 2, label: config.step3_label, icon: config.step3_icon, message: config.step3_message },
    { number: config.step2_active ? 4 : 3, label: config.step4_label, icon: config.step4_icon, message: config.step4_message },
  ]

  return (
    <Layout>
      <Breadcrumbs items={breadcrumbItems} />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Configuration Checkout
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Personnalisez le processus de commande de votre boutique
          </p>
        </div>
        <Button
          icon={<Save className="h-4 w-4" />}
          onClick={handleSave}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>

      <PageNotice config={storeNotices.checkoutConfig} className="mb-6" />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Configuration */}
        <div className="space-y-6">
          {/* Étape 1 - Panier */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Étape 1 : {config.step1_label}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Libellé
                </label>
                <input
                  type="text"
                  value={config.step1_label}
                  onChange={(e) => handleChange('step1_label', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Icône (emoji)
                </label>
                <input
                  type="text"
                  value={config.step1_icon}
                  onChange={(e) => handleChange('step1_icon', e.target.value)}
                  className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-center text-2xl"
                  maxLength={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Message personnalisé (optionnel)
                </label>
                <textarea
                  value={config.step1_message}
                  onChange={(e) => handleChange('step1_message', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="Message affiché au-dessus du panier"
                />
              </div>
            </div>
          </div>

          {/* Étape 2 - Livraison */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Étape 2 : {config.step2_label}
              </h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.step2_active}
                  onChange={(e) => handleChange('step2_active', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
              </label>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Libellé
                </label>
                <input
                  type="text"
                  value={config.step2_label}
                  onChange={(e) => handleChange('step2_label', e.target.value)}
                  disabled={!config.step2_active}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Icône (emoji)
                </label>
                <input
                  type="text"
                  value={config.step2_icon}
                  onChange={(e) => handleChange('step2_icon', e.target.value)}
                  disabled={!config.step2_active}
                  className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-center text-2xl disabled:opacity-50"
                  maxLength={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Message personnalisé
                </label>
                <textarea
                  value={config.step2_message}
                  onChange={(e) => handleChange('step2_message', e.target.value)}
                  disabled={!config.step2_active}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white disabled:opacity-50"
                  placeholder="Message affiché au-dessus du formulaire de livraison"
                />
              </div>
            </div>
          </div>

          {/* Étape 3 - Paiement */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Étape 3 : {config.step3_label}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Libellé
                </label>
                <input
                  type="text"
                  value={config.step3_label}
                  onChange={(e) => handleChange('step3_label', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Icône (emoji)
                </label>
                <input
                  type="text"
                  value={config.step3_icon}
                  onChange={(e) => handleChange('step3_icon', e.target.value)}
                  className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-center text-2xl"
                  maxLength={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Message personnalisé
                </label>
                <textarea
                  value={config.step3_message}
                  onChange={(e) => handleChange('step3_message', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="Message affiché au-dessus des méthodes de paiement"
                />
              </div>
            </div>
          </div>

          {/* Étape 4 - Confirmation */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Étape 4 : {config.step4_label}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Libellé
                </label>
                <input
                  type="text"
                  value={config.step4_label}
                  onChange={(e) => handleChange('step4_label', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Icône (emoji)
                </label>
                <input
                  type="text"
                  value={config.step4_icon}
                  onChange={(e) => handleChange('step4_icon', e.target.value)}
                  className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-center text-2xl"
                  maxLength={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Message de remerciement
                </label>
                <textarea
                  value={config.step4_message}
                  onChange={(e) => handleChange('step4_message', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="Message affiché après validation de la commande"
                />
              </div>
            </div>
          </div>

          {/* Options générales */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Options générales
            </h3>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.show_progress_bar}
                  onChange={(e) => handleChange('show_progress_bar', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Afficher la barre de progression</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Indicateur visuel de progression en mobile</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.allow_guest_checkout}
                  onChange={(e) => handleChange('allow_guest_checkout', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Autoriser commande invité</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Permettre aux visiteurs de commander sans créer de compte</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.require_phone}
                  onChange={(e) => handleChange('require_phone', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Téléphone requis</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Rendre le champ téléphone obligatoire</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.require_company}
                  onChange={(e) => handleChange('require_company', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Entreprise requise</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Rendre le champ entreprise obligatoire (B2B)</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Preview Enhanced */}
        <div className="lg:sticky lg:top-24 h-fit">
          <CheckoutPreviewEnhanced
            steps={previewSteps}
            currentStep={previewStep}
            showProgressBar={config.show_progress_bar}
            onStepChange={setPreviewStep}
          />
        </div>
      </div>
    </Layout>
  )
}
