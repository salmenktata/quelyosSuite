import { useState, useEffect } from 'react'

interface AttributeValue {
  id: number
  name: string
  html_color?: string | null
  sequence: number
}

interface Attribute {
  id: number
  name: string
  display_type: string
  create_variant: string
  values: AttributeValue[]
}

interface AttributeFilterProps {
  attributes: Attribute[]
  selectedValues: number[]
  onChange: (valueIds: number[]) => void
  loading?: boolean
}

export function AttributeFilter({
  attributes,
  selectedValues,
  onChange,
  loading = false,
}: AttributeFilterProps) {
  const [expandedAttributes, setExpandedAttributes] = useState<Set<number>>(new Set())

  // Expand attributes that have selected values by default
  useEffect(() => {
    if (selectedValues.length > 0) {
      const expandedSet = new Set<number>()
      attributes.forEach((attr) => {
        if (attr.values.some((v) => selectedValues.includes(v.id))) {
          expandedSet.add(attr.id)
        }
      })
      setExpandedAttributes(expandedSet)
    }
  }, [attributes, selectedValues])

  const toggleAttribute = (attributeId: number) => {
    setExpandedAttributes((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(attributeId)) {
        newSet.delete(attributeId)
      } else {
        newSet.add(attributeId)
      }
      return newSet
    })
  }

  const toggleValue = (valueId: number) => {
    const newSelection = selectedValues.includes(valueId)
      ? selectedValues.filter((id) => id !== valueId)
      : [...selectedValues, valueId]
    onChange(newSelection)
  }

  const clearAttributeSelection = (attributeId: number) => {
    const attribute = attributes.find((a) => a.id === attributeId)
    if (!attribute) return

    const attributeValueIds = attribute.values.map((v) => v.id)
    const newSelection = selectedValues.filter((id) => !attributeValueIds.includes(id))
    onChange(newSelection)
  }

  const getSelectedCountForAttribute = (attributeId: number): number => {
    const attribute = attributes.find((a) => a.id === attributeId)
    if (!attribute) return 0
    return attribute.values.filter((v) => selectedValues.includes(v.id)).length
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2" />
            <div className="flex gap-2">
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (attributes.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {attributes.map((attribute) => {
        const isExpanded = expandedAttributes.has(attribute.id)
        const selectedCount = getSelectedCountForAttribute(attribute.id)
        const isColorAttribute = attribute.display_type === 'color'

        return (
          <div key={attribute.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
            {/* Attribute Header */}
            <button
              type="button"
              onClick={() => toggleAttribute(attribute.id)}
              className="flex items-center justify-between w-full text-left group"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {attribute.name}
                </span>
                {selectedCount > 0 && (
                  <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 rounded-full">
                    {selectedCount}
                  </span>
                )}
              </div>
              <svg
                className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
                  isExpanded ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Attribute Values */}
            {isExpanded && (
              <div className="mt-3">
                {selectedCount > 0 && (
                  <button
                    type="button"
                    onClick={() => clearAttributeSelection(attribute.id)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline mb-2"
                  >
                    Effacer la sélection
                  </button>
                )}

                {isColorAttribute ? (
                  // Color Swatches
                  <div className="flex flex-wrap gap-2">
                    {attribute.values.map((value) => {
                      const isSelected = selectedValues.includes(value.id)
                      const hasColor = value.html_color && value.html_color !== '#FFFFFF'

                      return (
                        <button
                          key={value.id}
                          type="button"
                          onClick={() => toggleValue(value.id)}
                          className={`
                            relative group flex items-center justify-center
                            w-8 h-8 rounded-full border-2 transition-all duration-150
                            ${isSelected
                              ? 'border-indigo-500 ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-gray-800'
                              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                            }
                          `}
                          title={value.name}
                          aria-label={`${value.name}${isSelected ? ' (sélectionné)' : ''}`}
                        >
                          {hasColor ? (
                            <span
                              className="w-6 h-6 rounded-full"
                              style={{ backgroundColor: value.html_color || '#808080' }}
                            />
                          ) : (
                            <span className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-200 to-gray-400 dark:from-gray-600 dark:to-gray-800 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
                              {value.name.charAt(0).toUpperCase()}
                            </span>
                          )}

                          {/* Checkmark for selected */}
                          {isSelected && (
                            <span className="absolute -top-1 -right-1 bg-indigo-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </span>
                          )}

                          {/* Tooltip */}
                          <span className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 text-xs font-medium text-white bg-gray-900 dark:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                            {value.name}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  // Regular Pills/Checkboxes
                  <div className="flex flex-wrap gap-2">
                    {attribute.values.map((value) => {
                      const isSelected = selectedValues.includes(value.id)

                      return (
                        <button
                          key={value.id}
                          type="button"
                          onClick={() => toggleValue(value.id)}
                          className={`
                            inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium
                            transition-all duration-150 border
                            ${isSelected
                              ? 'bg-indigo-100 text-indigo-700 border-indigo-500 dark:bg-indigo-900/50 dark:text-indigo-300 dark:border-indigo-400'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:border-gray-500'
                            }
                          `}
                        >
                          {isSelected && (
                            <svg className="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                          {value.name}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export type { Attribute, AttributeValue, AttributeFilterProps }
