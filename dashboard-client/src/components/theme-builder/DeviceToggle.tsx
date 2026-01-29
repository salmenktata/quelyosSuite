import { Monitor, Tablet, Smartphone } from 'lucide-react';

type Device = 'desktop' | 'tablet' | 'mobile';

interface DeviceToggleProps {
  value: Device;
  onChange: (device: Device) => void;
}

/**
 * Toggle pour choisir le device de preview
 *
 * Features :
 * - 3 devices : Desktop (100%), Tablet (768px), Mobile (375px)
 * - Icons Lucide React (Monitor, Tablet, Smartphone)
 * - Active state avec bg indigo
 * - Dark mode complet
 * - Responsive avec labels cachés sur mobile
 */
export function DeviceToggle({ value, onChange }: DeviceToggleProps) {
  const devices: Array<{ id: Device; icon: typeof Monitor; label: string }> = [
    { id: 'desktop', icon: Monitor, label: 'Desktop' },
    { id: 'tablet', icon: Tablet, label: 'Tablet' },
    { id: 'mobile', icon: Smartphone, label: 'Mobile' },
  ];

  return (
    <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-1">
      {devices.map(({ id, icon: Icon, label }) => {
        const isActive = value === id;

        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all
              ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }
            `}
            aria-label={label}
            aria-pressed={isActive}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
