'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useMarketingPopups, trackPopupView, trackPopupClick, MarketingPopup } from '@/hooks/useMarketingPopups'
import { X } from 'lucide-react'
import { sanitizeHtml } from '@/lib/utils/sanitize'

export function PopupManager() {
  const { popups, loading } = useMarketingPopups()
  const [activePopup, setActivePopup] = useState<MarketingPopup | null>(null)
  const [dismissedIds, setDismissedIds] = useState<number[]>([])

  useEffect(() => {
    if (loading || popups.length === 0) return

    // Filtrer popups déjà affichées
    const shownSession = JSON.parse(sessionStorage.getItem('shown_popups') || '[]')
    const shownUser = getCookiePopupIds()

    const availablePopups = popups.filter(p => {
      if (dismissedIds.includes(p.id)) return false
      if (p.show_once_per_session && shownSession.includes(p.id)) return false
      if (p.show_once_per_user && shownUser.includes(p.id)) return false
      return true
    })

    if (availablePopups.length === 0) return

    const popup = availablePopups[0] // Prendre le premier (sequence)

    // Gérer déclencheur
    const handleTrigger = () => {
      setActivePopup(popup)
      trackPopupView(popup.id)

      // Marquer comme affiché
      if (popup.show_once_per_session) {
        const shown = JSON.parse(sessionStorage.getItem('shown_popups') || '[]')
        sessionStorage.setItem('shown_popups', JSON.stringify([...shown, popup.id]))
      }
      if (popup.show_once_per_user) {
        document.cookie = `popup_${popup.id}=1;max-age=${popup.cookie_duration_days * 86400};path=/`
      }
    }

    switch (popup.trigger_type) {
      case 'immediate':
        handleTrigger()
        break

      case 'delay':
        const delayTimeout = setTimeout(handleTrigger, popup.trigger_delay * 1000)
        return () => clearTimeout(delayTimeout)

      case 'scroll':
        const handleScroll = () => {
          const scrolled = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
          if (scrolled >= popup.trigger_scroll_percent) {
            handleTrigger()
            window.removeEventListener('scroll', handleScroll)
          }
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)

      case 'exit_intent':
        const handleMouseLeave = (e: MouseEvent) => {
          if (e.clientY <= 0) {
            handleTrigger()
            document.removeEventListener('mouseleave', handleMouseLeave)
          }
        }
        document.addEventListener('mouseleave', handleMouseLeave)
        return () => document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [popups, loading, dismissedIds])

  const handleClose = () => {
    if (activePopup) {
      setDismissedIds([...dismissedIds, activePopup.id])
      setActivePopup(null)
    }
  }

  const handleCTA = () => {
    if (!activePopup) return

    trackPopupClick(activePopup.id)

    if (activePopup.cta_link !== 'close') {
      window.location.href = activePopup.cta_link
    } else {
      handleClose()
    }
  }

  if (!activePopup) return null

  return (
    <>
      {/* Overlay */}
      {activePopup.position === 'center' && (
        <div
          className="fixed inset-0 z-50 bg-black transition-opacity"
          style={{ opacity: activePopup.overlay_opacity }}
          onClick={handleClose}
        />
      )}

      {/* Popup */}
      <div
        className={`fixed z-50 ${getPositionClasses(activePopup.position)}`}
        style={{
          maxWidth: activePopup.position === 'center' ? `${activePopup.max_width}px` : undefined,
          backgroundColor: activePopup.background_color,
          color: activePopup.text_color,
        }}
      >
        {/* Close button */}
        {activePopup.show_close_button && (
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Image */}
        {activePopup.image_url && (
          <div className="relative w-full h-48 overflow-hidden rounded-t-lg">
            <Image src={activePopup.image_url} alt={activePopup.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 500px" />
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-2">{activePopup.title}</h2>
          {activePopup.subtitle && (
            <p className="text-lg opacity-80 mb-4">{activePopup.subtitle}</p>
          )}
          {activePopup.content && (
            <div
              className="mb-6 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(activePopup.content) }}
            />
          )}

          {/* CTAs */}
          <div className="flex gap-3">
            <button
              onClick={handleCTA}
              className="flex-1 px-6 py-3 rounded-lg font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: activePopup.cta_color }}
            >
              {activePopup.cta_text}
            </button>
            {activePopup.show_close_button && (
              <button
                onClick={handleClose}
                className="px-6 py-3 rounded-lg font-semibold border-2 transition-colors hover:bg-gray-50"
                style={{ borderColor: activePopup.cta_color, color: activePopup.cta_color }}
              >
                {activePopup.close_text}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function getPositionClasses(position: string): string {
  switch (position) {
    case 'center':
      return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg shadow-2xl'
    case 'bottom_right':
      return 'bottom-6 right-6 w-96 rounded-lg shadow-xl'
    case 'bottom_left':
      return 'bottom-6 left-6 w-96 rounded-lg shadow-xl'
    case 'top_banner':
      return 'top-0 left-0 right-0 shadow-lg'
    default:
      return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg shadow-2xl'
  }
}

function getCookiePopupIds(): number[] {
  const cookies = document.cookie.split(';')
  const popupCookies = cookies.filter(c => c.trim().startsWith('popup_'))
  return popupCookies.map(c => {
    const id = c.split('_')[1]?.split('=')[0]
    return id ? parseInt(id) : 0
  }).filter(id => id > 0)
}
