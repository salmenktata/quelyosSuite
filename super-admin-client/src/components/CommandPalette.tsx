import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { Search, FileText, Users, MessageSquare, ArrowRight } from 'lucide-react'
import { api } from '@/lib/api/gateway'
import { SECTIONS } from '@/components/sidebar/SidebarNav'

interface SearchResult {
  id: string
  type: 'page' | 'tenant' | 'ticket'
  title: string
  subtitle?: string
  path: string
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  page: FileText,
  tenant: Users,
  ticket: MessageSquare,
}

const typeLabels: Record<string, string> = {
  page: 'Pages',
  tenant: 'Tenants',
  ticket: 'Tickets',
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  // Pages statiques pour la recherche
  const pageResults = useMemo(() => {
    const pages: SearchResult[] = []
    for (const section of SECTIONS) {
      for (const item of section.items) {
        pages.push({
          id: `page-${item.path}`,
          type: 'page',
          title: item.name,
          subtitle: section.label,
          path: item.path,
        })
      }
    }
    return pages
  }, [])

  // Filtrer pages localement
  const filteredPages = useMemo(() => {
    if (!query.trim()) return pageResults.slice(0, 6)
    const q = query.toLowerCase()
    return pageResults.filter(p =>
      p.title.toLowerCase().includes(q) || (p.subtitle?.toLowerCase().includes(q))
    )
  }, [query, pageResults])

  // Recherche API debounced
  const searchApi = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([])
      setIsSearching(false)
      return
    }
    setIsSearching(true)
    try {
      const [tenantsRes, ticketsRes] = await Promise.allSettled([
        api.request<{ data: Array<{ id: number; name: string; domain: string }> }>({
          method: 'GET',
          path: '/api/super-admin/tenants',
          params: { search: q, limit: 5 },
        }),
        api.request<{ data: Array<{ id: number; reference: string; subject: string }> }>({
          method: 'GET',
          path: '/api/super-admin/tickets',
          params: { search: q, limit: 5 },
        }),
      ])

      const apiResults: SearchResult[] = []

      if (tenantsRes.status === 'fulfilled' && tenantsRes.value.data?.data) {
        for (const t of tenantsRes.value.data.data) {
          apiResults.push({
            id: `tenant-${t.id}`,
            type: 'tenant',
            title: t.name,
            subtitle: t.domain,
            path: '/tenants',
          })
        }
      }

      if (ticketsRes.status === 'fulfilled' && ticketsRes.value.data?.data) {
        for (const t of ticketsRes.value.data.data) {
          apiResults.push({
            id: `ticket-${t.id}`,
            type: 'ticket',
            title: t.reference || `#${t.id}`,
            subtitle: t.subject,
            path: '/support-tickets',
          })
        }
      }

      setResults(apiResults)
    } catch {
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchApi(query), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, searchApi])

  // Combiner résultats
  const allResults = useMemo(() => {
    return [...filteredPages, ...results]
  }, [filteredPages, results])

  // Reset à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setResults([])
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Clamp selected index
  useEffect(() => {
    if (selectedIndex >= allResults.length) {
      setSelectedIndex(Math.max(0, allResults.length - 1))
    }
  }, [allResults.length, selectedIndex])

  const handleSelect = useCallback((result: SearchResult) => {
    navigate(result.path)
    onClose()
  }, [navigate, onClose])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, allResults.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (allResults[selectedIndex]) {
          handleSelect(allResults[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
    }
  }, [allResults, selectedIndex, handleSelect, onClose])

  if (!isOpen) return null

  // Grouper par type
  const grouped = allResults.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = []
    acc[r.type].push(r)
    return acc
  }, {})

  let globalIndex = -1

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0) }}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher pages, tenants, tickets..."
            className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 outline-none text-sm"
          />
          <kbd className="px-1.5 py-0.5 text-xs font-mono text-gray-400 bg-gray-100 dark:bg-gray-700 rounded">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {allResults.length === 0 && query.length > 0 && !isSearching && (
            <p className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              Aucun résultat pour &quot;{query}&quot;
            </p>
          )}

          {isSearching && query.length >= 2 && (
            <p className="px-4 py-2 text-xs text-gray-400 dark:text-gray-500">Recherche...</p>
          )}

          {Object.entries(grouped).map(([type, items]) => {
            const Icon = typeIcons[type] || FileText
            return (
              <div key={type}>
                <p className="px-4 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {typeLabels[type] || type}
                </p>
                {items.map((result) => {
                  globalIndex++
                  const idx = globalIndex
                  const isSelected = idx === selectedIndex

                  return (
                    <button
                      key={result.id}
                      onClick={() => handleSelect(result)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center gap-3 w-full px-4 py-2 text-left text-sm transition-colors ${
                        isSelected
                          ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{result.title}</p>
                        {result.subtitle && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{result.subtitle}</p>
                        )}
                      </div>
                      {isSelected && <ArrowRight className="w-4 h-4 flex-shrink-0" />}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-400">
          <span><kbd className="font-mono">↑↓</kbd> naviguer</span>
          <span><kbd className="font-mono">↵</kbd> ouvrir</span>
          <span><kbd className="font-mono">esc</kbd> fermer</span>
        </div>
      </div>
    </div>
  )
}
