/**
 * Health Dashboard Component
 *
 * Affiche l'état de santé de tous les services:
 * - API Backend
 * - Base de données
 * - Redis Cache
 * - WebSocket
 * - Jobs Queue
 *
 * @module components/admin/HealthDashboard
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Activity,
  Database,
  Server,
  Wifi,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Clock,
  Cpu,
  HardDrive,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Types
interface ServiceHealth {
  name: string
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown'
  latency?: number
  lastCheck?: string
  details?: Record<string, unknown>
  error?: string
}

interface SystemMetrics {
  cpu?: number
  memory?: number
  disk?: number
  uptime?: number
  activeConnections?: number
}

interface HealthData {
  overall: 'healthy' | 'degraded' | 'unhealthy'
  services: ServiceHealth[]
  metrics?: SystemMetrics
  timestamp: string
}

// Composants d'icône de statut
function StatusIcon({ status }: { status: ServiceHealth['status'] }) {
  switch (status) {
    case 'healthy':
      return <CheckCircle className="h-5 w-5 text-green-500" />
    case 'degraded':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    case 'unhealthy':
      return <XCircle className="h-5 w-5 text-red-500" />
    default:
      return <Activity className="h-5 w-5 text-gray-400" />
  }
}

function ServiceIcon({ name }: { name: string }) {
  const iconClass = 'h-5 w-5'

  switch (name.toLowerCase()) {
    case 'api':
    case 'backend':
      return <Server className={iconClass} />
    case 'database':
    case 'postgresql':
      return <Database className={iconClass} />
    case 'redis':
    case 'cache':
      return <Zap className={iconClass} />
    case 'websocket':
      return <Wifi className={iconClass} />
    default:
      return <Activity className={iconClass} />
  }
}

// Carte de service
function ServiceCard({ service }: { service: ServiceHealth }) {
  const statusColors = {
    healthy: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20',
    degraded: 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20',
    unhealthy: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20',
    unknown: 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800',
  }

  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-all hover:shadow-md',
        statusColors[service.status]
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <ServiceIcon name={service.name} />
          <h3 className="font-medium text-gray-900 dark:text-white">{service.name}</h3>
        </div>
        <StatusIcon status={service.status} />
      </div>

      {service.latency !== undefined && (
        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
          <Clock className="h-4 w-4" />
          <span>{service.latency}ms</span>
        </div>
      )}

      {service.error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{service.error}</p>
      )}

      {service.details && Object.keys(service.details).length > 0 && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {Object.entries(service.details).map(([key, value]) => (
            <div key={key}>
              {key}: {String(value)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Jauge de métrique
function MetricGauge({
  label,
  value,
  icon: Icon,
  unit = '%',
}: {
  label: string
  value: number
  icon: typeof Cpu
  unit?: string
}) {
  const getColor = (val: number) => {
    if (val < 60) return 'bg-green-500'
    if (val < 80) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <Icon className="h-8 w-8 text-gray-400" />
      <div className="flex-1">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300">{label}</span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {value.toFixed(1)}
            {unit}
          </span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={cn('h-full transition-all duration-500', getColor(value))}
            style={{ width: `${Math.min(100, value)}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// Composant principal
export function HealthDashboard() {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchHealth = useCallback(async () => {
    try {
      const response = await fetch('/api/health/detailed')

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      setHealth(data)
      setError(null)
    } catch (_err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch health status')

      // Données de fallback pour affichage
      setHealth({
        overall: 'unknown' as 'unhealthy',
        services: [
          { name: 'API', status: 'unknown' },
          { name: 'Database', status: 'unknown' },
          { name: 'Redis', status: 'unknown' },
          { name: 'WebSocket', status: 'unknown' },
        ],
        timestamp: new Date().toISOString(),
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHealth()

    if (autoRefresh) {
      const interval = setInterval(fetchHealth, 30000) // 30 secondes
      return () => clearInterval(interval)
    }
  }, [fetchHealth, autoRefresh])

  const overallStatusColors = {
    healthy: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    degraded: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    unhealthy: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  }

  if (loading && !health) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            État du Système
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Dernière mise à jour:{' '}
            {health?.timestamp
              ? new Date(health.timestamp).toLocaleTimeString('fr-FR')
              : '-'}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Toggle auto-refresh */}
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            Actualisation auto
          </label>

          {/* Refresh button */}
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            Rafraîchir
          </button>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
            <AlertTriangle className="h-5 w-5" />
            <span>Erreur: {error}</span>
          </div>
        </div>
      )}

      {/* Statut global */}
      {health && (
        <div
          className={cn(
            'p-4 rounded-lg flex items-center justify-between',
            overallStatusColors[health.overall] || overallStatusColors.unhealthy
          )}
        >
          <div className="flex items-center gap-3">
            {health.overall === 'healthy' ? (
              <CheckCircle className="h-6 w-6" />
            ) : health.overall === 'degraded' ? (
              <AlertTriangle className="h-6 w-6" />
            ) : (
              <XCircle className="h-6 w-6" />
            )}
            <div>
              <span className="font-medium">
                {health.overall === 'healthy'
                  ? 'Tous les systèmes sont opérationnels'
                  : health.overall === 'degraded'
                    ? 'Certains services sont dégradés'
                    : 'Problèmes détectés'}
              </span>
            </div>
          </div>

          <span className="text-sm uppercase font-medium">{health.overall}</span>
        </div>
      )}

      {/* Grille des services */}
      {health?.services && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Services</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {health.services.map((service) => (
              <ServiceCard key={service.name} service={service} />
            ))}
          </div>
        </div>
      )}

      {/* Métriques système */}
      {health?.metrics && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Métriques Système
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {health.metrics.cpu !== undefined && (
              <MetricGauge label="CPU" value={health.metrics.cpu} icon={Cpu} />
            )}
            {health.metrics.memory !== undefined && (
              <MetricGauge label="Mémoire" value={health.metrics.memory} icon={Zap} />
            )}
            {health.metrics.disk !== undefined && (
              <MetricGauge label="Disque" value={health.metrics.disk} icon={HardDrive} />
            )}
          </div>

          {health.metrics.uptime !== undefined && (
            <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Clock className="h-5 w-5" />
                <span>
                  Uptime:{' '}
                  {formatUptime(health.metrics.uptime)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Helper pour formater l'uptime
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  const parts: string[] = []
  if (days > 0) parts.push(`${days}j`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)

  return parts.join(' ') || '< 1m'
}

export default HealthDashboard
