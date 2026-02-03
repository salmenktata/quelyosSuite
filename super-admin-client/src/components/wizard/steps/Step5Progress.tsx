import { useState, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { InstallConfig } from '@/hooks/useInstallWizard'
import { CheckCircle, Loader2, XCircle, AlertTriangle, ExternalLink } from 'lucide-react'
import { api } from '@/lib/api/gateway'
import { mockWizardApi, MOCK_ENABLED } from '@/lib/api/mockWizardApi'

interface Step5ProgressProps {
  config: InstallConfig
}

interface ProvisioningStatus {
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress_percent: number
  current_step: string
  tenant_id?: number
  store_url?: string
  admin_url?: string
  temp_password?: string
  error_message?: string
}

interface SeedJobStatus {
  status: 'pending' | 'running' | 'completed' | 'error'
  progress_percent: number
  current_module: string | null
  results: Record<string, { count: number; duration_seconds: number }>
  error_message?: string
}

export function Step5Progress({ config }: Step5ProgressProps) {
  const navigate = useNavigate()
  const [provisioningJobId, setProvisioningJobId] = useState<string | null>(null)
  const [seedJobId, setSeedJobId] = useState<string | null>(null)
  const [phase, setPhase] = useState<'provisioning' | 'seed' | 'completed' | 'error'>('provisioning')
  const [finalData, setFinalData] = useState<{
    storeUrl?: string
    adminUrl?: string
    tempPassword?: string
    seedResults?: Record<string, { count: number; duration_seconds: number }>
  }>({})

  // Mutation création tenant + provisioning
  const createTenant = useMutation({
    mutationFn: async () => {
      if (MOCK_ENABLED) {
        // Mode MOCK : Simuler provisioning
        await new Promise(resolve => setTimeout(resolve, 500))
        const mockResponse = mockWizardApi.provisioning.start(config.name)
        return mockResponse.data
      }

      // Mode PRODUCTION : Appel API réel
      const response = await api.request<{
        success: boolean
        data: { tenant_id: number; provisioning_job_id: string }
      }>({
        method: 'POST',
        path: '/api/super-admin/tenants',
        body: {
          name: config.name,
          domain: config.domain,
          plan_code: config.plan_code,
          admin_email: config.admin_email,
          admin_name: config.admin_name,
        },
      })

      return response.data.data
    },
    onSuccess: data => {
      setProvisioningJobId(data.provisioning_job_id)
    },
    onError: () => {
      setPhase('error')
    },
  })

  // Polling provisioning status
  const provisioningQuery = useQuery({
    queryKey: ['provisioning-status', provisioningJobId],
    queryFn: async () => {
      if (!provisioningJobId) return null

      if (MOCK_ENABLED) {
        // Mode MOCK : Simuler status
        await new Promise(resolve => setTimeout(resolve, 200))
        const mockStatus = mockWizardApi.provisioning.getStatus(provisioningJobId)
        return mockStatus.data
      }

      // Mode PRODUCTION : Appel API réel
      const response = await api.request<{ success: boolean; data: ProvisioningStatus }>({
        method: 'GET',
        path: `/api/super-admin/provisioning/status/${provisioningJobId}`,
      })

      return response.data.data
    },
    enabled: !!provisioningJobId && phase === 'provisioning',
    refetchInterval: 3000,
  })

  const provisioningStatus = provisioningQuery.data

  // Arrêter le polling si completed ou failed
  useEffect(() => {
    if (provisioningStatus && (provisioningStatus.status === 'completed' || provisioningStatus.status === 'failed')) {
      provisioningQuery.refetch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- provisioningQuery.refetch is stable
  }, [provisioningStatus?.status])

  // Mutation génération seed data
  const generateSeed = useMutation({
    mutationFn: async (_tenantId: number) => {
      if (MOCK_ENABLED) {
        // Mode MOCK : Simuler seed data
        await new Promise(resolve => setTimeout(resolve, 500))
        const mockResponse = mockWizardApi.seedData.start({
          modules: config.seed_modules!,
          volumetry: config.seed_volumetry!,
        })
        return mockResponse.job_id
      }

      // Mode PRODUCTION : Appel API réel
      const response = await api.request<{ success: boolean; job_id: string }>({
        method: 'POST',
        path: '/api/super-admin/seed-data/generate',
        body: {
          tenant_id: _tenantId,
          volumetry: config.seed_volumetry!,
          modules: config.seed_modules!,
          reset_before_seed: false,
          enable_relations: config.seed_enable_relations!,
          enable_unsplash_images: config.seed_enable_unsplash!,
        },
      })

      return response.data.job_id
    },
    onSuccess: jobId => {
      setSeedJobId(jobId)
      setPhase('seed')
    },
    onError: () => {
      setPhase('error')
    },
  })

  // Polling seed status
  const seedQuery = useQuery({
    queryKey: ['seed-status', seedJobId],
    queryFn: async () => {
      if (!seedJobId) return null

      if (MOCK_ENABLED) {
        // Mode MOCK : Simuler status
        await new Promise(resolve => setTimeout(resolve, 200))
        const mockStatus = mockWizardApi.seedData.getStatus(seedJobId)
        return mockStatus.data
      }

      // Mode PRODUCTION : Appel API réel
      const response = await api.request<{ success: boolean; data: SeedJobStatus }>({
        method: 'GET',
        path: `/api/super-admin/seed-data/status/${seedJobId}`,
      })

      return response.data.data
    },
    enabled: !!seedJobId && phase === 'seed',
    refetchInterval: 3000,
  })

  const seedStatus = seedQuery.data

  // Arrêter le polling si completed ou error
  useEffect(() => {
    if (seedStatus && (seedStatus.status === 'completed' || seedStatus.status === 'error')) {
      seedQuery.refetch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seedQuery.refetch is stable
  }, [seedStatus?.status])

  // Lancer création tenant au montage
  useEffect(() => {
    createTenant.mutate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Gérer transition provisioning → seed
  useEffect(() => {
    if (provisioningStatus?.status === 'completed') {
      // Sauvegarder les données finales
      setFinalData(prev => ({
        ...prev,
        storeUrl: provisioningStatus.store_url,
        adminUrl: provisioningStatus.admin_url,
        tempPassword: provisioningStatus.temp_password,
      }))

      if (config.generate_seed && provisioningStatus.tenant_id) {
        generateSeed.mutate(provisioningStatus.tenant_id)
      } else {
        setPhase('completed')
      }
    } else if (provisioningStatus?.status === 'failed') {
      setPhase('error')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- generateSeed.mutate is stable, config/provisioningStatus fields already tracked via status
  }, [provisioningStatus?.status])

  // Gérer fin seed
  useEffect(() => {
    if (seedStatus?.status === 'completed') {
      setFinalData(prev => ({
        ...prev,
        seedResults: seedStatus.results,
      }))
      setPhase('completed')
    } else if (seedStatus?.status === 'error') {
      setPhase('error')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seedStatus.results tracked via status change
  }, [seedStatus?.status])

  // Rendu par phase
  if (phase === 'error') {
    return (
      <div className="text-center py-12">
        <XCircle className="h-16 w-16 text-red-500 dark:text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Erreur lors de l&apos;installation</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {provisioningStatus?.error_message || seedStatus?.error_message || "Une erreur s'est produite"}
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate('/tenants')}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Retour aux tenants
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'provisioning') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <Loader2 className="h-16 w-16 text-teal-600 dark:text-teal-400 mx-auto mb-4 animate-spin" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Provisioning de l&apos;instance
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Configuration infrastructure backend en cours...
          </p>
        </div>

        {/* Progress bar */}
        <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
          <div
            className="bg-teal-600 dark:bg-teal-500 h-full transition-all duration-500"
            style={{ width: `${provisioningStatus?.progress_percent || 0}%` }}
          />
        </div>

        <div className="text-center">
          <div className="text-3xl font-bold text-teal-600 dark:text-teal-400 mb-2">
            {provisioningStatus?.progress_percent || 0}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {provisioningStatus?.current_step || 'Initialisation...'}
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'seed') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <Loader2 className="h-16 w-16 text-teal-600 dark:text-teal-400 mx-auto mb-4 animate-spin" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Génération des données de test
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Création de données fictives en cours...
          </p>
        </div>

        {/* Progress bar */}
        <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
          <div
            className="bg-teal-600 dark:bg-teal-500 h-full transition-all duration-500"
            style={{ width: `${seedStatus?.progress_percent || 0}%` }}
          />
        </div>

        <div className="text-center">
          <div className="text-3xl font-bold text-teal-600 dark:text-teal-400 mb-2">
            {seedStatus?.progress_percent || 0}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Module: {seedStatus?.current_module || 'Démarrage...'}
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'completed') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 dark:text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Installation réussie !
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Votre instance est prête à être utilisée
          </p>
        </div>

        {/* URLs d'accès */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Accès à votre instance
          </h3>
          <div className="space-y-3">
            {finalData.storeUrl && (
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Boutique</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{finalData.storeUrl}</div>
                </div>
                <a
                  href={finalData.storeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white text-sm rounded transition-colors"
                >
                  Ouvrir
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            )}

            {finalData.adminUrl && (
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Backoffice</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{finalData.adminUrl}</div>
                </div>
                <a
                  href={finalData.adminUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white text-sm rounded transition-colors"
                >
                  Ouvrir
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Credentials */}
        {finalData.tempPassword && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-900 dark:text-amber-200 mb-1">
                  Informations de connexion
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Changez votre mot de passe lors de la première connexion
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                <span className="text-sm text-gray-600 dark:text-gray-400">Email:</span>
                <code className="text-sm font-mono text-gray-900 dark:text-white">{config.admin_email}</code>
              </div>
              <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                <span className="text-sm text-gray-600 dark:text-gray-400">Mot de passe:</span>
                <code className="text-sm font-mono text-gray-900 dark:text-white">{finalData.tempPassword}</code>
              </div>
            </div>
          </div>
        )}

        {/* Stats seed data */}
        {finalData.seedResults && Object.keys(finalData.seedResults).length > 0 && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Données générées
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(finalData.seedResults).map(([module, data]) => (
                <div key={module} className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">{data.count}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">{module}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {data.duration_seconds.toFixed(1)}s
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 justify-center pt-4">
          <button
            onClick={() => navigate('/tenants/install')}
            className="px-6 py-2 bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white rounded-lg transition-colors"
          >
            Créer une autre instance
          </button>
          <button
            onClick={() => navigate('/tenants')}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Retour aux tenants
          </button>
        </div>
      </div>
    )
  }

  return null
}
