import { useState } from 'react'
import { Calendar } from 'lucide-react'

export interface DateRange {
  from: Date | undefined
  to: Date | undefined
}

interface DateRangePickerProps {
  value?: DateRange
  onChange: (range: DateRange | undefined) => void
  placeholder?: string
  className?: string
}

const presets = [
  {
    label: "Aujourd'hui",
    getValue: () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return { from: today, to: new Date() }
    }
  },
  {
    label: '7 derniers jours',
    getValue: () => {
      const today = new Date()
      const from = new Date()
      from.setDate(today.getDate() - 7)
      from.setHours(0, 0, 0, 0)
      return { from, to: today }
    }
  },
  {
    label: '30 derniers jours',
    getValue: () => {
      const today = new Date()
      const from = new Date()
      from.setDate(today.getDate() - 30)
      from.setHours(0, 0, 0, 0)
      return { from, to: today }
    }
  },
  {
    label: '90 derniers jours',
    getValue: () => {
      const today = new Date()
      const from = new Date()
      from.setDate(today.getDate() - 90)
      from.setHours(0, 0, 0, 0)
      return { from, to: today }
    }
  },
  {
    label: 'Ce mois',
    getValue: () => {
      const today = new Date()
      const from = new Date(today.getFullYear(), today.getMonth(), 1)
      from.setHours(0, 0, 0, 0)
      return { from, to: today }
    }
  },
  {
    label: 'Mois dernier',
    getValue: () => {
      const today = new Date()
      const from = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const to = new Date(today.getFullYear(), today.getMonth(), 0)
      from.setHours(0, 0, 0, 0)
      to.setHours(23, 59, 59, 999)
      return { from, to }
    }
  }
]

function formatDateRange(range: DateRange | undefined): string {
  if (!range?.from) return 'Sélectionner une période'

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  if (!range.to) {
    return formatDate(range.from)
  }

  return `${formatDate(range.from)} - ${formatDate(range.to)}`
}

export function DateRangePicker({ value, onChange, placeholder, className = '' }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [tempRange, setTempRange] = useState<DateRange | undefined>(value)

  const handlePresetClick = (preset: typeof presets[0]) => {
    const newRange = preset.getValue()
    setTempRange(newRange)
    onChange(newRange)
    setIsOpen(false)
  }

  const handleClear = () => {
    setTempRange(undefined)
    onChange(undefined)
    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full inline-flex items-center justify-between px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>{value ? formatDateRange(value) : (placeholder || 'Sélectionner une période')}</span>
        </div>
        {value && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleClear()
            }}
            className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ×
          </button>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white dark:text-gray-100 mb-3">
                Périodes prédéfinies
              </h3>
              <div className="space-y-1">
                {presets.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handlePresetClick(preset)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                <button
                  onClick={handleClear}
                  className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  Effacer
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
