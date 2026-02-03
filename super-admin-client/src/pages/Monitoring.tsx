/**
 * Monitoring Infrastructure
 *
 * Fonctionnalités :
 * - Provisioning jobs (auto-refresh toutes les 5s si running)
 * - System health (Backend, PostgreSQL, Redis, Stripe)
 * - Error logs avec filtres
 */

import { useQuery } from '@tanstack/react-query'
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { api } from '@/lib/api/gateway'
import { ProvisioningJobsResponseSchema, SystemHealthSchema, validateApiResponse } from '@/lib/validators'
import type { ProvisioningJobsResponse, SystemHealth } from '@/lib/validators'

export function Monitoring() {
  const { data: jobsResponse, isLoading: jobsLoading } = useQuery({
    queryKey: ['super-admin-provisioning-jobs'],
    queryFn: async () => {
      const response = await api.request<ProvisioningJobsResponse>({ method: 'GET', path: '/api/super-admin/provisioning-jobs' })
      return validateApiResponse(ProvisioningJobsResponseSchema, response.data)
    },
    refetchInterval: (query) => {
      const hasRunningJobs = (query.state.data as ProvisioningJobsResponse | undefined)?.data?.some(
        (job) => job.state === 'running' || job.state === 'pending'
      )
      return hasRunningJobs ? 5000 : false
    },
  })

  const jobs = jobsResponse?.data

  const { data: health } = useQuery({
    queryKey: ['super-admin-system-health'],
    queryFn: async () => {
      const response = await api.request<SystemHealth>({ method: 'GET', path: '/api/super-admin/system/health' })
      return validateApiResponse(SystemHealthSchema, response.data)
    },
    refetchInterval: 30000,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Monitoring Infrastructure</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">État des services et jobs de provisioning</p>
      </div>

      {/* System Health */}
      {health && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <HealthCard
            title="Backend API"
            status={health.backend_status}
            subtitle={`${health.backend_response_time_ms}ms`}
          />
          <HealthCard
            title="PostgreSQL"
            status={health.postgres_status}
            subtitle={`${health.postgres_connections} connexions`}
          />
          <HealthCard
            title="Redis"
            status={health.redis_status}
            subtitle={`${health.redis_memory_mb}MB mémoire`}
          />
          <HealthCard
            title="Stripe API"
            status={health.stripe_status}
            subtitle={health.last_webhook_received ? new Date(health.last_webhook_received).toLocaleTimeString('fr-FR') : 'N/A'}
          />
        </div>
      )}

      {/* Provisioning Jobs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Provisioning Jobs</h2>
          {jobs?.some((j) => j.state === 'running' || j.state === 'pending') && (
            <span className="flex items-center gap-2 text-sm text-teal-600 dark:text-teal-400">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Auto-refresh actif
            </span>
          )}
        </div>

        {jobsLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tenant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">État</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Progress</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Durée</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Démarré</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {jobs?.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{job.tenant_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{job.job_type}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          job.state === 'completed'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : job.state === 'running'
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                              : job.state === 'failed'
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {job.state}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-teal-500 h-2 rounded-full transition-all"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">{job.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {job.duration_seconds ? `${job.duration_seconds}s` : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {job.started_at ? new Date(job.started_at).toLocaleString('fr-FR') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function HealthCard({ title, status, subtitle }: { title: string; status: 'up' | 'down'; subtitle?: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="mt-2 text-xl font-bold text-gray-900 dark:text-white">{status.toUpperCase()}</p>
          {subtitle && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
        <div className={`p-2 rounded-lg ${status === 'up' ? 'bg-green-500' : 'bg-red-500'}`}>
          {status === 'up' ? <CheckCircle className="w-5 h-5 text-white" /> : <XCircle className="w-5 h-5 text-white" />}
        </div>
      </div>
    </div>
  )
}
