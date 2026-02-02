import { useState, useRef, useEffect } from 'react'
import { Bell, ShieldAlert, Check } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'

interface NotificationCenterProps {
  collapsed?: boolean
}

const severityColors: Record<string, string> = {
  critical: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  high: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  low: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
}

export function NotificationCenter({ collapsed }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()

  // Fermer au clic extérieur
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex items-center ${collapsed ? 'justify-center' : 'gap-3'} w-full px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {!collapsed && <span className="font-medium text-sm">Notifications</span>}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={`absolute ${collapsed ? 'left-full ml-2' : 'left-0'} bottom-full mb-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50`}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-teal-600 dark:text-teal-400 hover:underline"
              >
                Tout marquer lu
              </button>
            )}
          </div>

          {/* Items */}
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                Aucune notification
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700/50 last:border-0 ${
                    !n.read ? 'bg-teal-50/50 dark:bg-teal-900/10' : ''
                  }`}
                >
                  <ShieldAlert className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                    n.severity === 'critical' ? 'text-red-500' :
                    n.severity === 'high' ? 'text-orange-500' :
                    'text-yellow-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{n.title}</p>
                      {n.severity && (
                        <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${severityColors[n.severity] || ''}`}>
                          {n.severity}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                      {n.timestamp ? new Date(n.timestamp).toLocaleString('fr-FR') : ''}
                    </p>
                  </div>
                  {!n.read && (
                    <button
                      onClick={() => markAsRead(n.id)}
                      className="flex-shrink-0 p-1 text-gray-400 hover:text-teal-600 dark:hover:text-teal-400"
                      title="Marquer comme lu"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
