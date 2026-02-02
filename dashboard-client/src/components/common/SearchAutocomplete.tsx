import { useState, useRef, useEffect, useCallback, ReactNode } from 'react'
import { logger } from '@quelyos/logger'

export interface SearchSuggestion<T = unknown> {
  id: string | number
  label: string
  data: T
}

export interface SearchAutocompleteProps<T = unknown> {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  onSelect?: (item: SearchSuggestion<T>) => void
  onSearch?: (query: string) => void
  fetchSuggestions: (query: string) => Promise<SearchSuggestion<T>[]>
  renderSuggestion?: (item: SearchSuggestion<T>, isHighlighted: boolean) => ReactNode
  minChars?: number
  debounceMs?: number
  maxSuggestions?: number
  className?: string
  disabled?: boolean
  showSearchButton?: boolean
  searchButtonText?: string
}

export function SearchAutocomplete<T = unknown>({
  placeholder = 'Rechercher...',
  value: controlledValue,
  onChange,
  onSelect,
  onSearch,
  fetchSuggestions,
  renderSuggestion,
  minChars = 2,
  debounceMs = 300,
  maxSuggestions = 8,
  className = '',
  disabled = false,
  showSearchButton = true,
  searchButtonText = 'Rechercher',
}: SearchAutocompleteProps<T>) {
  const [inputValue, setInputValue] = useState(controlledValue || '')
  const [suggestions, setSuggestions] = useState<SearchSuggestion<T>[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync with controlled value
  useEffect(() => {
    if (controlledValue !== undefined) {
      setInputValue(controlledValue)
    }
  }, [controlledValue])

  // Fetch suggestions with debounce
  const fetchSuggestionsDebounced = useCallback(
    async (query: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      if (query.length < minChars) {
        setSuggestions([])
        setIsOpen(false)
        return
      }

      debounceTimerRef.current = setTimeout(async () => {
        setIsLoading(true)
        try {
          const results = await fetchSuggestions(query)
          setSuggestions(results.slice(0, maxSuggestions))
          setIsOpen(results.length > 0)
          setHighlightedIndex(-1)
        } catch (_error) {
          logger.error('Error fetching suggestions:', error)
          setSuggestions([])
        } finally {
          setIsLoading(false)
        }
      }, debounceMs)
    },
    [fetchSuggestions, minChars, debounceMs, maxSuggestions]
  )

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    onChange?.(value)
    fetchSuggestionsDebounced(value)
  }

  // Handle suggestion selection
  const handleSelectSuggestion = (item: SearchSuggestion<T>) => {
    setInputValue(item.label)
    onChange?.(item.label)
    onSelect?.(item)
    setIsOpen(false)
    setSuggestions([])
    inputRef.current?.blur()
  }

  // Handle search button click or enter
  const handleSearch = () => {
    setIsOpen(false)
    onSearch?.(inputValue)
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1))
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0) {
          handleSelectSuggestion(suggestions[highlightedIndex])
        } else {
          handleSearch()
        }
        break
      case 'Escape':
        setIsOpen(false)
        setHighlightedIndex(-1)
        break
    }
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Default suggestion renderer
  const defaultRenderSuggestion = (item: SearchSuggestion<T>, isHighlighted: boolean) => (
    <div
      className={`px-4 py-2 cursor-pointer transition-colors ${
        isHighlighted
          ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
      }`}
    >
      {item.label}
    </div>
  )

  return (
    <div className={`relative ${className}`}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) setIsOpen(true)
            }}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       placeholder-gray-500 dark:placeholder-gray-400
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                       disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {/* Search icon */}
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            {isLoading ? (
              <svg
                className="w-5 h-5 text-gray-400 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            )}
          </div>

          {/* Clear button */}
          {inputValue && (
            <button
              type="button"
              onClick={() => {
                setInputValue('')
                onChange?.('')
                setSuggestions([])
                setIsOpen(false)
                inputRef.current?.focus()
              }}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {showSearchButton && (
          <button
            type="button"
            onClick={handleSearch}
            disabled={disabled}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {searchButtonText}
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200
                     dark:border-gray-700 rounded-lg shadow-lg max-h-80 overflow-y-auto"
        >
          {suggestions.map((item, index) => (
            <div
              key={item.id}
              onClick={() => handleSelectSuggestion(item)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              {renderSuggestion
                ? renderSuggestion(item, index === highlightedIndex)
                : defaultRenderSuggestion(item, index === highlightedIndex)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
