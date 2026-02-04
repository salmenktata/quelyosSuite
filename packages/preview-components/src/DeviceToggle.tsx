import { Monitor, Tablet, Smartphone } from 'lucide-react'
import { clsx } from 'clsx'
import { DeviceType } from './PreviewPanel'

/**
 * Props du composant DeviceToggle
 */
export interface DeviceToggleProps {
  /** Device actuellement sélectionné */
  value: DeviceType
  /** Callback appelé lors du changement de device */
  onChange: (device: DeviceType) => void
  /** Classe CSS additionnelle */
  className?: string
}

/**
 * Configuration des devices
 */
const DEVICES: Array<{
  type: DeviceType
  icon: typeof Monitor
  label: string
}> = [
  { type: 'mobile', icon: Smartphone, label: 'Mobile' },
  { type: 'tablet', icon: Tablet, label: 'Tablette' },
  { type: 'desktop', icon: Monitor, label: 'Desktop' },
]

/**
 * DeviceToggle - Sélecteur de device pour preview
 *
 * @example
 * ```tsx
 * const [device, setDevice] = useState<DeviceType>('desktop')
 * <DeviceToggle value={device} onChange={setDevice} />
 * ```
 */
export function DeviceToggle({ value, onChange, className }: DeviceToggleProps) {
  return (
    <div
      className={clsx(
        'device-toggle',
        'inline-flex items-center gap-1',
        'bg-gray-100 dark:bg-gray-800',
        'rounded-lg p-1',
        className
      )}
      role="tablist"
      aria-label="Sélection du type d'appareil"
    >
      {DEVICES.map(({ type, icon: Icon, label }) => {
        const isActive = value === type

        return (
          <button
            key={type}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={label}
            onClick={() => onChange(type)}
            className={clsx(
              'flex items-center gap-2 px-3 py-2 rounded-md',
              'text-sm font-medium',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
              'dark:focus:ring-offset-gray-800',
              isActive
                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
