/**
 * Wrapper pour l'application authentifiée avec auto-logout
 */

import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router'
import { Layout } from './Layout'
import { Dashboard } from '@/pages/Dashboard'
import { Tenants } from '@/pages/Tenants'
import { Subscriptions } from '@/pages/Subscriptions'
import { Billing } from '@/pages/Billing'
import { Monitoring } from '@/pages/Monitoring'
import { InactivityWarning } from './InactivityWarning'
import { useInactivityLogout } from '@/hooks/useInactivityLogout'
import { useAuth } from '@/hooks/useAuth'
import { useAnalytics } from '@/hooks/useAnalytics'

/**
 * Component pour tracker les page views automatiquement
 */
function PageViewTracker() {
  const location = useLocation()
  const { trackPageView } = useAnalytics()

  useEffect(() => {
    // Mapper les paths vers des noms de pages lisibles
    const pageNames: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/tenants': 'Tenants',
      '/subscriptions': 'Subscriptions',
      '/billing': 'Billing',
      '/monitoring': 'Monitoring',
    }

    const pageName = pageNames[location.pathname] || location.pathname
    trackPageView(pageName, { path: location.pathname })
  }, [location, trackPageView])

  return null
}

export function AuthenticatedApp() {
  const [showWarning, setShowWarning] = useState(false)
  const [warningTime, setWarningTime] = useState(0)
  const { logout } = useAuth()

  const { resetTimer } = useInactivityLogout({
    timeout: 30 * 60 * 1000, // 30 minutes
    warningTime: 2 * 60 * 1000, // 2 minutes avant
    onWarning: (remaining) => {
      setWarningTime(remaining)
      setShowWarning(true)
    },
    onLogout: () => {
      // Logout via API (révoque refresh token + clear cookies)
      console.info('[Auth] Session expirée pour inactivité')
      logout()
    },
  })

  const handleStayActive = () => {
    setShowWarning(false)
    resetTimer()
  }

  return (
    <>
      <BrowserRouter>
        <PageViewTracker />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="tenants" element={<Tenants />} />
            <Route path="subscriptions" element={<Subscriptions />} />
            <Route path="billing" element={<Billing />} />
            <Route path="monitoring" element={<Monitoring />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>

      {showWarning && (
        <InactivityWarning
          remainingTime={warningTime}
          onStayActive={handleStayActive}
        />
      )}
    </>
  )
}
