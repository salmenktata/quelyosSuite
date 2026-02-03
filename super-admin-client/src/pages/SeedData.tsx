/**
 * Génération de Données Seed
 *
 * Fonctionnalités :
 * - Sélection tenant cible
 * - Configuration modules et volumétrie
 * - Génération asynchrone avec progress monitoring
 * - Téléchargement rapport JSON
 * - Option reset données avant génération
 */

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Database,
  Download,
  Play,
  Loader2,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { api } from '@/lib/api/gateway'
import { TenantsResponseSchema, validateApiResponse } from '@/lib/validators'
import type { TenantsResponse } from '@/lib/validators'
import { ConfirmModal } from '@/components/common/ConfirmModal'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/ToastContainer'

// Modules disponibles
const AVAILABLE_MODULES = [
  { id: 'store', label: 'Store', description: 'Produits, variants, images' },
  { id: 'stock', label: 'Stock', description: 'Inventaire, locations' },
  { id: 'crm', label: 'CRM', description: 'Clients, leads' },
  { id: 'marketing', label: 'Marketing', description: 'Campagnes, listes' },
  { id: 'finance', label: 'Finance', description: 'Factures, paiements' },
  { id: 'pos', label: 'POS', description: 'Sessions, commandes' },
  { id: 'support', label: 'Support', description: 'Tickets, messages' },
  { id: 'hr', label: 'RH', description: 'Employés, contrats' },
]

// Volumétries prédéfinies
const VOLUMETRY_PRESETS = {
  minimal: { label: 'Minimale (~200 records)', value: 'minimal' },
  standard: { label: 'Standard (~2000 records)', value: 'standard' },
  large: { label: 'Large (~5000 records)', value: 'large' },
}

interface SeedConfig {
  tenant_id: number
  volumetry: string
  modules: string[]
  reset_before_seed: boolean
  enable_relations: boolean
  enable_unsplash_images: boolean
}

interface SeedJobStatus {
  job_id: string
  tenant_id: number
  tenant_name: string
  status: 'pending' | 'running' | 'completed' | 'error'
  progress_percent: number
  current_module: string | null
  logs: Array<{ timestamp: string; message: string; module: string }>
  results: Record<string, { count: number; duration_seconds: number }>
  duration_seconds?: number
  error_message?: string | null
}

export function SeedData() {
  const queryClient = useQueryClient()
  const toast = useToast()

  // État configuration
  const [selectedTenant, setSelectedTenant] = useState<number | null>(null)
  const [volumetry, setVolumetry] = useState<string>('standard')
  const [selectedModules, setSelectedModules] = useState<string[]>(
    AVAILABLE_MODULES.map((m) => m.id)
  )
  const [resetBeforeSeed, setResetBeforeSeed] = useState(false)
  const [enableRelations, setEnableRelations] = useState(true)
  const [enableUnsplashImages, setEnableUnsplashImages] = useState(true)

  // État génération
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)

  // Fetch tenants
  const { data: tenantsData } = useQuery({
    queryKey: ['super-admin-tenants'],
    queryFn: async () => {
      const response = await api.request<TenantsResponse>({
        method: 'GET',
        path: '/api/super-admin/tenants',
      })
      return validateApiResponse(TenantsResponseSchema, response.data)
    },
  })

  const tenants = tenantsData?.data || []

  // Polling status job (toutes les 3s si job en cours)
  const { data: jobStatus } = useQuery({
    queryKey: ['seed-job-status', currentJobId],
    queryFn: async () => {
      if (!currentJobId) return null

      const response = await api.request<{ success: boolean; data: SeedJobStatus }>({
        method: 'GET',
        path: `/api/super-admin/seed-data/status/${currentJobId}`,
      })

      return response.data.data
    },
    enabled: !!currentJobId,
    refetchInterval: (query) => {
      const data = query.state.data
      return currentJobId && data?.status === 'running' ? 3000 : false
    },
  })

  // Timer elapsed
  useEffect(() => {
    if (jobStatus?.status === 'running' && !startTime) {
      setStartTime(Date.now())
    } else if (jobStatus?.status !== 'running' && startTime) {
      setStartTime(null)
      setElapsedTime(0)
    }

    if (jobStatus?.status === 'running' && startTime) {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [jobStatus?.status, startTime])

  // Mutation génération
  const generateSeed = useMutation({
    mutationFn: async (config: SeedConfig) => {
      const response = await api.request<{ success: boolean; job_id: string }>({
        method: 'POST',
        path: '/api/super-admin/seed-data/generate',
        body: config,
      })

      return response.data
    },
    onSuccess: (data) => {
      toast.success('Génération seed démarrée')
      setCurrentJobId(data.job_id)
    },
    onError: (error: Error) => {
      toast.error(`Erreur génération: ${error.message}`)
    },
  })

  // Handler génération
  const handleGenerate = () => {
    if (!selectedTenant) {
      toast.error('Veuillez sélectionner un tenant')
      return
    }

    if (selectedModules.length === 0) {
      toast.error('Veuillez sélectionner au moins un module')
      return
    }

    // Si reset demandé, afficher confirmation
    if (resetBeforeSeed) {
      setShowResetConfirm(true)
      return
    }

    // Lancer génération
    executeGeneration()
  }

  const executeGeneration = () => {
    if (!selectedTenant) return

    const config: SeedConfig = {
      tenant_id: selectedTenant,
      volumetry,
      modules: selectedModules,
      reset_before_seed: resetBeforeSeed,
      enable_relations: enableRelations,
      enable_unsplash_images: enableUnsplashImages,
    }

    generateSeed.mutate(config)
    setShowResetConfirm(false)
  }

  // Handler téléchargement rapport
  const handleDownloadReport = async () => {
    if (!currentJobId) return

    try {
      const response = await api.request<Blob>({
        method: 'GET',
        path: `/api/super-admin/seed-data/report/${currentJobId}`,
        responseType: 'blob',
      })

      // Créer lien téléchargement
      const url = window.URL.createObjectURL(response.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `seed_report_${currentJobId}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Rapport téléchargé')
    } catch (error) {
      toast.error('Erreur téléchargement rapport')
    }
  }

  // Helper toggle module
  const toggleModule = (moduleId: string) => {
    if (selectedModules.includes(moduleId)) {
      setSelectedModules(selectedModules.filter((m) => m !== moduleId))
    } else {
      setSelectedModules([...selectedModules, moduleId])
    }
  }

  const isGenerating = jobStatus?.status === 'running' || jobStatus?.status === 'pending'
  const isCompleted = jobStatus?.status === 'completed'
  const isError = jobStatus?.status === 'error'

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Database className="h-8 w-8 text-indigo-500 dark:text-indigo-400" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Données Seed
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Générer des données de test réalistes pour tous les modules de Quelyos Suite
        </p>
      </div>

      {/* Configuration Panel */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Configuration
        </h2>

        {/* Sélection Tenant */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tenant Cible
          </label>
          <select
            value={selectedTenant || ''}
            onChange={(e) => setSelectedTenant(Number(e.target.value))}
            disabled={isGenerating}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
          >
            <option value="">Sélectionnez un tenant</option>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name} ({tenant.status})
              </option>
            ))}
          </select>
        </div>

        {/* Volumétrie */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Volumétrie
          </label>
          <div className="grid grid-cols-3 gap-4">
            {Object.values(VOLUMETRY_PRESETS).map((preset) => (
              <button
                key={preset.value}
                onClick={() => setVolumetry(preset.value)}
                disabled={isGenerating}
                className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                  volumetry === preset.value
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                    : 'border-gray-300 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-700'
                } disabled:opacity-50`}
              >
                <div className="text-sm font-medium">{preset.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Modules */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Modules à Générer
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {AVAILABLE_MODULES.map((module) => (
              <button
                key={module.id}
                onClick={() => toggleModule(module.id)}
                disabled={isGenerating}
                className={`px-4 py-3 rounded-lg border-2 transition-colors text-left ${
                  selectedModules.includes(module.id)
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-700'
                } disabled:opacity-50`}
              >
                <div className="font-medium text-gray-900 dark:text-white">
                  {module.label}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {module.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Options
          </label>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={resetBeforeSeed}
                onChange={(e) => setResetBeforeSeed(e.target.checked)}
                disabled={isGenerating}
                className="mr-3 h-4 w-4 text-indigo-600 rounded"
              />
              <span className="text-gray-700 dark:text-gray-300">
                Supprimer données existantes avant génération (DANGER)
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={enableRelations}
                onChange={(e) => setEnableRelations(e.target.checked)}
                disabled={isGenerating}
                className="mr-3 h-4 w-4 text-indigo-600 rounded"
              />
              <span className="text-gray-700 dark:text-gray-300">
                Générer relations inter-modules
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={enableUnsplashImages}
                onChange={(e) => setEnableUnsplashImages(e.target.checked)}
                disabled={isGenerating}
                className="mr-3 h-4 w-4 text-indigo-600 rounded"
              />
              <span className="text-gray-700 dark:text-gray-300">
                Générer images Unsplash (requiert connexion Internet)
              </span>
            </label>
          </div>
        </div>

        {/* Bouton Génération */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !selectedTenant}
          className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Génération en cours...
            </>
          ) : (
            <>
              <Play className="h-5 w-5" />
              Générer Données Seed
            </>
          )}
        </button>
      </div>

      {/* Progress Monitor */}
      {jobStatus && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Progression
          </h2>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {jobStatus.progress_percent}%
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {elapsedTime > 0 && `${elapsedTime}s`}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${jobStatus.progress_percent}%` }}
              />
            </div>
          </div>

          {/* Statut */}
          <div className="flex items-center gap-2 mb-4">
            {jobStatus.status === 'running' && (
              <>
                <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" />
                <span className="text-gray-700 dark:text-gray-300">
                  En cours: {jobStatus.current_module || 'Initialisation...'}
                </span>
              </>
            )}
            {jobStatus.status === 'completed' && (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-green-600 dark:text-green-400 font-medium">
                  Terminé avec succès !
                </span>
              </>
            )}
            {jobStatus.status === 'error' && (
              <>
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="text-red-600 dark:text-red-400 font-medium">
                  Erreur: {jobStatus.error_message}
                </span>
              </>
            )}
          </div>

          {/* Logs */}
          {jobStatus.logs && jobStatus.logs.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Logs
              </label>
              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
                {jobStatus.logs.map((log, idx) => (
                  <div key={idx} className="text-gray-700 dark:text-gray-300 mb-1">
                    <span className="text-gray-500 dark:text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    {' - '}
                    {log.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Résultats */}
          {isCompleted && jobStatus.results && Object.keys(jobStatus.results).length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Résultats
              </label>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Module
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Records Créés
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Durée (s)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {Object.entries(jobStatus.results).map(([module, result]) => (
                      <tr key={module}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {module}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {result.count.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {result.duration_seconds.toFixed(1)}s
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bouton téléchargement rapport */}
              <button
                onClick={handleDownloadReport}
                className="mt-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Télécharger Rapport JSON
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal confirmation reset */}
      <ConfirmModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={executeGeneration}
        title="Confirmer Suppression Données"
        message={`⚠️ ATTENTION : Cette action va SUPPRIMER TOUTES les données seed du tenant sélectionné avant de générer de nouvelles données. Cette action est IRRÉVERSIBLE.`}
        confirmText="Supprimer et Générer"
        cancelText="Annuler"
        variant="danger"
      />
    </div>
  )
}
