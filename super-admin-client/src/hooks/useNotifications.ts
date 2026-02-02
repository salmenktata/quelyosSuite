import { useQuery } from '@tanstack/react-query'
import { useState, useCallback } from 'react'
import { api } from '@/lib/api/gateway'

interface NotificationItem {
  id: string
  type: 'security' | 'ticket' | 'provisioning'
  title: string
  message: string
  severity?: 'critical' | 'high' | 'medium' | 'low'
  timestamp: string
  read: boolean
}

const STORAGE_KEY = 'quelyos-notifications-read'

function getReadIds(): Set<string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return new Set(JSON.parse(stored))
  } catch { /* ignore */ }
  return new Set()
}

function saveReadIds(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
}

export function useNotifications() {
  const [readIds, setReadIds] = useState<Set<string>>(getReadIds)

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['super-admin-notifications'],
    queryFn: async () => {
      const items: NotificationItem[] = []
      const currentRead = getReadIds()

      try {
        const alertsRes = await api.request<{
          data: Array<{
            id: number
            alert_type: string
            severity: string
            message: string
            created_at: string
            status: string
          }>
        }>({
          method: 'GET',
          path: '/api/super-admin/security/alerts',
          params: { status: 'active', limit: 10 },
        })

        if (alertsRes.data?.data) {
          for (const a of alertsRes.data.data) {
            items.push({
              id: `alert-${a.id}`,
              type: 'security',
              title: a.alert_type?.replace(/_/g, ' ') || 'Alerte sécurité',
              message: a.message,
              severity: a.severity as NotificationItem['severity'],
              timestamp: a.created_at,
              read: currentRead.has(`alert-${a.id}`),
            })
          }
        }
      } catch {
        // Silently fail — endpoint might not exist yet
      }

      return items
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  })

  const markAsRead = useCallback((id: string) => {
    setReadIds(prev => {
      const next = new Set(prev)
      next.add(id)
      saveReadIds(next)
      return next
    })
  }, [])

  const markAllAsRead = useCallback(() => {
    setReadIds(prev => {
      const next = new Set(prev)
      for (const n of notifications) next.add(n.id)
      saveReadIds(next)
      return next
    })
  }, [notifications])

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length

  const enriched = notifications.map(n => ({
    ...n,
    read: readIds.has(n.id),
  }))

  return { notifications: enriched, unreadCount, isLoading, markAsRead, markAllAsRead }
}
