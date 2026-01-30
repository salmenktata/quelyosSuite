/**
 * Badge SLA - Affiche le statut SLA avec code couleur
 */

interface SLABadgeProps {
  status: 'ok' | 'warning' | 'breached' | null
  deadline?: string | null
  label: string
}

export function SLABadge({ status, deadline, label }: SLABadgeProps) {
  if (!status) return null

  const config = {
    ok: {
      bg: 'bg-green-100 dark:bg-green-900/20',
      border: 'border-green-500 dark:border-green-400',
      text: 'text-green-700 dark:text-green-400',
      icon: '✓',
    },
    warning: {
      bg: 'bg-orange-100 dark:bg-orange-900/20',
      border: 'border-orange-500 dark:border-orange-400',
      text: 'text-orange-700 dark:text-orange-400',
      icon: '⚠',
    },
    breached: {
      bg: 'bg-red-100 dark:bg-red-900/20',
      border: 'border-red-500 dark:border-red-400',
      text: 'text-red-700 dark:text-red-400',
      icon: '✗',
    },
  }

  const { bg, border, text, icon } = config[status]

  const formatDeadline = (isoDate: string) => {
    const date = new Date(isoDate)
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    const diffHours = Math.round(diffMs / (1000 * 60 * 60))

    if (diffHours < 0) {
      return `Dépassé de ${Math.abs(diffHours)}h`
    } else if (diffHours < 24) {
      return `Dans ${diffHours}h`
    } else {
      const diffDays = Math.round(diffHours / 24)
      return `Dans ${diffDays}j`
    }
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${bg} ${border}`}>
      <span className={`text-sm font-medium ${text}`}>
        {icon} {label}
      </span>
      {deadline && (
        <span className={`text-xs ${text}`}>
          {formatDeadline(deadline)}
        </span>
      )}
    </div>
  )
}
