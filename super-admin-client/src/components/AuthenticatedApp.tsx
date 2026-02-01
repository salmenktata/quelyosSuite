/**
 * Wrapper pour l'application authentifiée avec auto-logout
 */

import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router'
import { Layout } from './Layout'
import { Dashboard } from '@/pages/Dashboard'
import { Tenants } from '@/pages/Tenants'
import { Plans } from '@/pages/Plans'
import { Subscriptions } from '@/pages/Subscriptions'
import { Billing } from '@/pages/Billing'
import { Monitoring } from '@/pages/Monitoring'
import { Backups } from '@/pages/Backups'
import { BackupSchedules } from '@/pages/BackupSchedules'
import { Security } from '@/pages/Security'
import { AiConfig } from '@/pages/AiConfig'
import { SupportTickets } from '@/pages/SupportTickets'
import { SupportTemplates } from '@/pages/SupportTemplates'
import { CustomerTicketHistory } from '@/pages/CustomerTicketHistory'
import { AuditLogs } from '@/pages/AuditLogs'
import { NoticeAnalytics } from '@/pages/NoticeAnalytics'
import { Settings } from '@/pages/Settings'
import { EmailSettings } from '@/pages/EmailSettings'
import { Sitemap } from '@/pages/Sitemap'
import { SeedData } from '@/pages/SeedData'
import { InstallWizardPage } from '@/pages/InstallWizardPage'
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
      '/plans': 'Plans',
      '/subscriptions': 'Subscriptions',
      '/billing': 'Billing',
      '/monitoring': 'Monitoring',
      '/security': 'Security',
      '/ai-config': 'AI Configuration',
      '/support-tickets': 'Support Tickets',
      '/support-templates': 'Support Templates',
      '/audit-logs': 'Audit Logs',
      '/notice-analytics': 'Notice Analytics',
      '/backups': 'Backups',
      '/backup-schedules': 'Backup Schedules',
      '/settings': 'Settings',
      '/email-settings': 'Email Settings',
      '/sitemap': 'Sitemap',
      '/seed-data': 'Seed Data',
      '/tenants/install': 'Install Wizard',
    }

    // Gérer les routes dynamiques (ex: /customers/:id/tickets)
    if (location.pathname.match(/^\/customers\/\d+\/tickets$/)) {
      return 'Customer Ticket History'
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
      <PageViewTracker />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="tenants" element={<Tenants />} />
          <Route path="tenants/install" element={<InstallWizardPage />} />
          <Route path="plans" element={<Plans />} />
          <Route path="subscriptions" element={<Subscriptions />} />
          <Route path="billing" element={<Billing />} />
          <Route path="monitoring" element={<Monitoring />} />
          <Route path="security" element={<Security />} />
          <Route path="ai-config" element={<AiConfig />} />
          <Route path="support-tickets" element={<SupportTickets />} />
          <Route path="support-templates" element={<SupportTemplates />} />
          <Route path="customers/:customerId/tickets" element={<CustomerTicketHistory />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="notice-analytics" element={<NoticeAnalytics />} />
          <Route path="backups" element={<Backups />} />
          <Route path="backup-schedules" element={<BackupSchedules />} />
          <Route path="settings" element={<Settings />} />
          <Route path="email-settings" element={<EmailSettings />} />
          <Route path="sitemap" element={<Sitemap />} />
          <Route path="seed-data" element={<SeedData />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>

      {showWarning && (
        <InactivityWarning
          remainingTime={warningTime}
          onStayActive={handleStayActive}
        />
      )}
    </>
  )
}
