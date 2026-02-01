import { useState, useEffect } from 'react'

interface Tab {
  id: string
  label: string
  count: number
}

interface SectionTabsProps {
  moduleId: string
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
}

export function SectionTabs({ tabs, activeTab, onTabChange }: SectionTabsProps) {
  return (
    <div className="sticky top-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 py-2">
      <div className="flex gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all
              ${activeTab === tab.id
                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-b-2 border-emerald-600 dark:border-emerald-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }
            `}
          >
            {tab.label}
            <span className="ml-1 text-xs opacity-60">({tab.count})</span>
          </button>
        ))}
      </div>
    </div>
  )
}
