/**
 * Page de configuration des providers IA pour le chat assistant Quelyos.
 * Accessible uniquement aux Super Admins.
 */

import { useState, useEffect } from 'react'
import { Plus, Sparkles, Activity, TrendingUp, Loader2, CheckCircle2, XCircle, Settings, Trash2, TestTube, Save, X, RotateCcw } from 'lucide-react'
import { config } from '../lib/config'

interface AiProvider {
  id: number
  name: string
  provider: 'groq' | 'claude' | 'openai'
  is_enabled: boolean
  priority: number
  model: string
  max_tokens: number
  temperature: number
  has_api_key: boolean
  test_result: 'success' | 'failed' | null
  test_message: string
  last_tested_at: string | null
  total_requests: number
  success_rate: number
  avg_latency_ms: number
  total_cost: number
}

interface AiMetrics {
  total_requests: number
  total_tokens: number
  total_cost: number
  avg_success_rate: number
  avg_latency_ms: number
  providers_count: number
  active_providers_count: number
}

const PROVIDER_LABELS: Record<string, string> = {
  groq: 'Groq',
  claude: 'Anthropic Claude',
  openai: 'OpenAI GPT',
}

const DEFAULT_MODELS: Record<string, string[]> = {
  groq: ['llama-3.1-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
  claude: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
  openai: ['gpt-4-turbo-preview', 'gpt-4', 'gpt-3.5-turbo'],
}

export function AiConfig() {
  const [providers, setProviders] = useState<AiProvider[]>([])
  const [metrics, setMetrics] = useState<AiMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'providers' | 'metrics'>('providers')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<AiProvider | null>(null)
  const [seeding, setSeeding] = useState(false)

  useEffect(() => {
    loadProviders()
    loadMetrics()
  }, [])

  const loadProviders = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`${config.apiUrl}/api/super-admin/ai/providers`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        setProviders(data.providers)
      } else {
        throw new Error(data.error || 'Erreur chargement')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  const loadMetrics = async () => {
    try {
      const response = await fetch(`${config.apiUrl}/api/super-admin/ai/metrics`, {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        if (data.success) setMetrics(data.metrics)
      }
    } catch {
      // Non-bloquant
    }
  }

  const handleSeedDefaults = async () => {
    setSeeding(true)
    try {
      const response = await fetch(`${config.apiUrl}/api/super-admin/ai/seed-defaults`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      alert(`Configuration par défaut appliquée : ${data.created} créés, ${data.updated} mis à jour`)
      await loadProviders()
      await loadMetrics()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur initialisation')
    } finally {
      setSeeding(false)
    }
  }

  const handleDelete = async (providerId: number) => {
    if (!confirm('Supprimer ce provider ?')) return

    try {
      const response = await fetch(`${config.apiUrl}/api/super-admin/ai/providers/${providerId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      await loadProviders()
      await loadMetrics()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur suppression')
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-teal-600 dark:text-teal-400" />
              Configuration IA Chat Assistant
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Gérez les providers IA utilisés pour le chat assistant Quelyos
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSeedDefaults}
              disabled={seeding}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              title="Insérer ou actualiser les providers par défaut (Groq principal, Groq fallback, Claude premium)"
            >
              {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
              Config par défaut
            </button>
            <button
              onClick={() => {
                setSelectedProvider(null)
                setIsModalOpen(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Ajouter un Provider
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('providers')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'providers'
                ? 'border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Providers
          </button>
          <button
            onClick={() => setActiveTab('metrics')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'metrics'
                ? 'border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Métriques
          </button>
        </nav>
      </div>

      {/* Content */}
      {loading && providers.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : activeTab === 'providers' ? (
        <div>
          {providers.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <Sparkles className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Aucun provider configuré
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Commencez par ajouter un provider IA (Groq gratuit recommandé)
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                <Plus className="w-4 h-4" />
                Ajouter un Provider
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {providers.map(provider => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  onEdit={(p) => {
                    setSelectedProvider(p)
                    setIsModalOpen(true)
                  }}
                  onDelete={handleDelete}
                  onRefresh={loadProviders}
                />
              ))}
            </div>
          )}
        </div>
      ) : metrics ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Requêtes"
            value={metrics.total_requests.toLocaleString()}
            icon={Activity}
            color="text-indigo-600 dark:text-indigo-400"
          />
          <MetricCard
            title="Taux de Succès"
            value={`${metrics.avg_success_rate.toFixed(1)}%`}
            icon={TrendingUp}
            color="text-green-600 dark:text-green-400"
          />
          <MetricCard
            title="Latence Moyenne"
            value={`${metrics.avg_latency_ms.toFixed(0)}ms`}
            icon={Activity}
            color="text-blue-600 dark:text-blue-400"
          />
          <MetricCard
            title="Coût Total"
            value={`$${metrics.total_cost.toFixed(4)}`}
            icon={Sparkles}
            color="text-yellow-600 dark:text-yellow-400"
          />
        </div>
      ) : null}

      {/* Modal */}
      {isModalOpen && (
        <ProviderModal
          provider={selectedProvider}
          onClose={(success) => {
            setIsModalOpen(false)
            setSelectedProvider(null)
            if (success) {
              loadProviders()
              loadMetrics()
            }
          }}
        />
      )}
    </div>
  )
}

// Provider Card Component
function ProviderCard({
  provider,
  onEdit,
  onDelete,
  onRefresh,
}: {
  provider: AiProvider
  onEdit: (provider: AiProvider) => void
  onDelete: (id: number) => void
  onRefresh: () => void
}) {
  const [testing, setTesting] = useState(false)

  const handleTest = async () => {
    setTesting(true)
    try {
      const response = await fetch(`${config.apiUrl}/api/super-admin/ai/providers/${provider.id}/test`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await response.json()
      alert(data.success ? `✅ ${data.message}` : `❌ ${data.error}`)
      onRefresh()
    } catch (err) {
      alert(`Erreur: ${err instanceof Error ? err.message : 'Inconnue'}`)
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className={`p-6 rounded-lg border transition-all ${provider.is_enabled ? 'border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-900/10' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{provider.name}</h3>
          <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            {PROVIDER_LABELS[provider.provider]}
          </span>
        </div>
        {provider.is_enabled && (
          <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
            Actif
          </span>
        )}
      </div>

      <div className="mb-4 space-y-1 text-sm text-gray-600 dark:text-gray-400">
        <div><span className="font-medium">Modèle:</span> {provider.model}</div>
        <div><span className="font-medium">Priorité:</span> {provider.priority}</div>
      </div>

      {provider.test_result && (
        <div className={`mb-4 p-3 rounded-lg flex items-start gap-2 ${provider.test_result === 'success' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
          {provider.test_result === 'success' ? <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" /> : <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />}
          <p className={`text-xs ${provider.test_result === 'success' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
            {provider.test_message}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 dark:bg-gray-900/30 p-3 rounded">
          <div className="text-xs text-gray-600 dark:text-gray-400">Requêtes</div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">{provider.total_requests}</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900/30 p-3 rounded">
          <div className="text-xs text-gray-600 dark:text-gray-400">Succès</div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">{provider.success_rate.toFixed(1)}%</div>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={handleTest} disabled={testing} className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50">
          {testing ? <Loader2 className="w-4 h-4 mx-auto animate-spin" /> : <TestTube className="w-4 h-4 mx-auto" />}
        </button>
        <button onClick={() => onEdit(provider)} className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
          <Settings className="w-4 h-4 mx-auto" />
        </button>
        <button onClick={() => onDelete(provider.id)} className="px-3 py-2 text-sm text-red-600 dark:text-red-400 border border-red-300 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// Metric Card Component
function MetricCard({ title, value, icon: Icon, color }: { title: string; value: string; icon: React.ComponentType<{ className?: string }>; color: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">{title}</span>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
    </div>
  )
}

// Provider Modal Component (simplified version)
function ProviderModal({ provider, onClose }: { provider: AiProvider | null; onClose: (success: boolean) => void }) {
  const [formData, setFormData] = useState({
    name: provider?.name || '',
    provider: provider?.provider || 'groq',
    api_key: '',
    model: provider?.model || 'llama-3.1-70b-versatile',
    max_tokens: provider?.max_tokens || 800,
    temperature: provider?.temperature || 0.7,
    is_enabled: provider?.is_enabled || false,
    priority: provider?.priority || 1,
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const url = provider ? `${config.apiUrl}/api/super-admin/ai/providers/${provider.id}` : `${config.apiUrl}/api/super-admin/ai/providers`
      const method = provider ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      onClose(true)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {provider ? 'Modifier' : 'Ajouter'} un Provider
          </h2>
          <button onClick={() => onClose(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type *</label>
            <select
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value as 'groq' | 'claude' | 'openai' })}
              disabled={!!provider}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white disabled:opacity-50"
            >
              <option value="groq">Groq (Gratuit)</option>
              <option value="claude">Anthropic Claude</option>
              <option value="openai">OpenAI GPT</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">API Key {!provider && '*'}</label>
            <input
              type="password"
              value={formData.api_key}
              onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
              placeholder={provider ? 'Laisser vide pour ne pas modifier' : 'Votre API key...'}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Modèle *</label>
            <select
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              {DEFAULT_MODELS[formData.provider].map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Tokens</label>
              <input
                type="number"
                value={formData.max_tokens}
                onChange={(e) => setFormData({ ...formData, max_tokens: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Température</label>
              <input
                type="number"
                step="0.1"
                value={formData.temperature}
                onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priorité</label>
              <input
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_enabled}
              onChange={(e) => setFormData({ ...formData, is_enabled: e.target.checked })}
              className="w-4 h-4 text-teal-600 border-gray-300 dark:border-gray-600 rounded"
            />
            <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">Activer ce provider</label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => onClose(false)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  )
}
