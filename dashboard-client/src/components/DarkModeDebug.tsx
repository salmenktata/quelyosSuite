import { useEffect, useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'

export function DarkModeDebug() {
  const { theme } = useTheme()
  const [htmlClass, setHtmlClass] = useState('')

  useEffect(() => {
    const updateHtmlClass = () => {
      setHtmlClass(document.documentElement.className)
    }

    updateHtmlClass()

    // Observer les changements de classe sur <html>
    const observer = new MutationObserver(updateHtmlClass)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [])

  if (import.meta.env.MODE === 'production') return null

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-3 rounded-lg shadow-lg z-50 font-mono">
      <div>
        <strong>Theme Context:</strong> {theme}
      </div>
      <div>
        <strong>HTML Class:</strong> {htmlClass || '(vide)'}
      </div>
      <div
        className={`mt-2 px-2 py-1 rounded ${
          htmlClass.includes('dark')
            ? 'bg-green-600'
            : 'bg-red-600'
        }`}
      >
        {htmlClass.includes('dark') ? '✓ Dark mode actif' : '✗ Dark mode inactif'}
      </div>
    </div>
  )
}
