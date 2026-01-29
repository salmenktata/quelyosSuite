import { Command } from 'cmdk'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MODULES } from '@/config/modules'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Command Palette (Cmd+K / Ctrl+K) pour navigation rapide
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  // Écoute Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
    >
      <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />

      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-gray-500 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12">
          <div className="flex items-center border-b border-gray-200 dark:border-gray-700 px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 text-gray-400" />
            <Command.Input
              placeholder="Rechercher une page..."
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50 text-gray-900 dark:text-white"
            />
          </div>

          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-gray-500">
              Aucun résultat trouvé.
            </Command.Empty>

            {MODULES.map((module) => (
              <Command.Group
                key={module.id}
                heading={module.name}
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-gray-500 dark:text-gray-400"
              >
                {module.sections.map((section) =>
                  section.items.map((item) => {
                    const Icon = item.icon
                    const items = []

                    // Item principal
                    if (item.path) {
                      items.push(
                        <Command.Item
                          key={item.path}
                          value={`${module.name} ${section.title} ${item.name}`}
                          onSelect={() => {
                            navigate(item.path!)
                            setOpen(false)
                          }}
                          className="relative flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-2 text-sm outline-none hover:bg-gray-100 dark:hover:bg-gray-700 aria-selected:bg-gray-100 dark:aria-selected:bg-gray-700"
                        >
                          {Icon && <Icon className={cn('w-4 h-4', module.color)} />}
                          <span className="text-gray-900 dark:text-white">{item.name}</span>
                          <span className="ml-auto text-xs text-gray-400">{section.title}</span>
                        </Command.Item>
                      )
                    }

                    // Sub-items
                    item.subItems?.forEach((sub) => {
                      if (sub.path && !sub.separator) {
                        const SubIcon = sub.icon
                        items.push(
                          <Command.Item
                            key={sub.path}
                            value={`${module.name} ${section.title} ${item.name} ${sub.name}`}
                            onSelect={() => {
                              navigate(sub.path!)
                              setOpen(false)
                            }}
                            className="relative flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-2 text-sm outline-none hover:bg-gray-100 dark:hover:bg-gray-700 aria-selected:bg-gray-100 dark:aria-selected:bg-gray-700 pl-8"
                          >
                            {SubIcon ? (
                              <SubIcon className="w-3.5 h-3.5 text-gray-400" />
                            ) : (
                              <span className="w-3.5" />
                            )}
                            <span className="text-gray-900 dark:text-white">{sub.name}</span>
                            <span className="ml-auto text-xs text-gray-400">{item.name}</span>
                          </Command.Item>
                        )
                      }
                    })

                    return items
                  })
                )}
              </Command.Group>
            ))}
          </Command.List>

          <div className="border-t border-gray-200 dark:border-gray-700 px-3 py-2 text-xs text-gray-500">
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-gray-200 bg-gray-100 px-1.5 font-mono text-[10px] font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
              <span className="text-xs">⌘</span>K
            </kbd>
            {' '}
            pour ouvrir/fermer
          </div>
        </Command>
      </div>
    </Command.Dialog>
  )
}
