/**
 * Paramètres Super Admin
 *
 * Fonctionnalités :
 * - Gestion whitelist CORS (domaines autorisés)
 * - Ajouter/Supprimer domaines
 * - Activer/Désactiver domaines
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Globe,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Shield,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { api } from '@/lib/api/gateway'
import { CorsSettingsSchema, validateApiResponse } from '@/lib/validators'
import type { CorsSettings, CorsEntry } from '@/lib/validators'
import { ConfirmModal } from '@/components/common/ConfirmModal'
import { useToast } from '@/hooks/useToast'

export function Settings() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [newDomain, setNewDomain] = useState('')
  const [domainError, setDomainError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<CorsEntry | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['super-admin-cors'],
    queryFn: async () => {
      const response = await api.request<CorsSettings>({
        method: 'GET',
        path: '/api/super-admin/settings/cors',
      })
      return validateApiResponse(CorsSettingsSchema, response.data)
    },
  })

  const addDomain = useMutation({
    mutationFn: async (domain: string) => {
      return api.request({
        method: 'POST',
        path: '/api/super-admin/settings/cors',
        body: { domain },
      })
    },
    onSuccess: () => {
      showToast('Domaine ajouté avec succès', 'success')
      setNewDomain('')
      queryClient.invalidateQueries({ queryKey: ['super-admin-cors'] })
    },
    onError: () => {
      showToast('Erreur lors de l\'ajout du domaine', 'error')
    },
  })

  const removeDomain = useMutation({
    mutationFn: async (id: number) => {
      return api.request({
        method: 'DELETE',
        path: `/api/super-admin/settings/cors/${id}`,
      })
    },
    onSuccess: () => {
      showToast('Domaine supprimé', 'success')
      setDeleteTarget(null)
      queryClient.invalidateQueries({ queryKey: ['super-admin-cors'] })
    },
    onError: () => {
      showToast('Erreur lors de la suppression', 'error')
    },
  })

  const toggleDomain = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) => {
      return api.request({
        method: 'PATCH',
        path: `/api/super-admin/settings/cors/${id}`,
        body: { is_active },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-cors'] })
    },
  })

  const validateDomain = (domain: string): boolean => {
    setDomainError('')
    if (!domain) {
      setDomainError('Domaine requis')
      return false
    }
    // Regex simple pour valider un domaine
    const domainRegex = /^(\*\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/
    if (!domainRegex.test(domain)) {
      setDomainError('Format invalide (ex: example.com ou *.example.com)')
      return false
    }
    return true
  }

  const handleAddDomain = () => {
    if (validateDomain(newDomain)) {
      addDomain.mutate(newDomain)
    }
  }

  const entries = data?.entries || []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Paramètres</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Configuration globale de la plateforme
        </p>
      </div>

      {/* CORS Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                CORS Whitelist
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Domaines autorisés à accéder à l&apos;API
              </p>
            </div>
          </div>
        </div>

        {/* Add Domain Form */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newDomain}
                  onChange={(e) => {
                    setNewDomain(e.target.value)
                    setDomainError('')
                  }}
                  placeholder="example.com ou *.example.com"
                  className={`flex-1 px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 ${
                    domainError
                      ? 'border-red-500 dark:border-red-400'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddDomain()}
                />
                <button
                  onClick={handleAddDomain}
                  disabled={addDomain.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition disabled:opacity-50"
                >
                  {addDomain.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Ajouter
                </button>
              </div>
              {domainError && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {domainError}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Domains List */}
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center">
            <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Aucun domaine configuré</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30"
              >
                <div className="flex items-center gap-4">
                  <button
                    onClick={() =>
                      toggleDomain.mutate({ id: entry.id, is_active: !entry.is_active })
                    }
                    className={`transition ${
                      entry.is_active
                        ? 'text-teal-600 dark:text-teal-400'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}
                    title={entry.is_active ? 'Désactiver' : 'Activer'}
                  >
                    {entry.is_active ? (
                      <ToggleRight className="w-6 h-6" />
                    ) : (
                      <ToggleLeft className="w-6 h-6" />
                    )}
                  </button>
                  <div>
                    <p
                      className={`font-mono text-sm ${
                        entry.is_active
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-400 dark:text-gray-500 line-through'
                      }`}
                    >
                      {entry.domain}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {entry.tenant_name ? `Tenant: ${entry.tenant_name}` : 'Global'} • Ajouté par{' '}
                      {entry.created_by} le{' '}
                      {new Date(entry.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDeleteTarget(entry)}
                  className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => removeDomain.mutate(deleteTarget.id)}
          title="Supprimer le domaine"
          message={`Êtes-vous sûr de vouloir supprimer "${deleteTarget.domain}" de la whitelist ? Les requêtes depuis ce domaine seront bloquées.`}
          confirmLabel="Supprimer"
          confirmVariant="danger"
          isLoading={removeDomain.isPending}
        />
      )}
    </div>
  )
}
