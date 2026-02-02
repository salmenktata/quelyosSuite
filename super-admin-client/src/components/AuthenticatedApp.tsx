/**
 * Wrapper pour l'application authentifiée avec auto-logout
 */

import { useState, useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router'
import { Loader2 } from 'lucide-react'
import { Layout } from './Layout'
import { InactivityWarning } from './InactivityWarning'
import { useInactivityLogout } from '@/hooks/useInactivityLogout'
import { useAuth } from '@/hooks/useAuth'
import { useAnalytics } from '@/hooks/useAnalytics'

// Lazy load toutes les pages pour optimiser le bundle initial
const Dashboard = lazy(() => import('@/pages/Dashboard').then(m => ({ default: m.Dashboard })))
const Tenants = lazy(() => import('@/pages/Tenants').then(m => ({ default: m.Tenants })))
const Plans = lazy(() => import('@/pages/Plans').then(m => ({ default: m.Plans })))
const Subscriptions = lazy(() => import('@/pages/Subscriptions').then(m => ({ default: m.Subscriptions })))
const Billing = lazy(() => import('@/pages/Billing').then(m => ({ default: m.Billing })))
const Monitoring = lazy(() => import('@/pages/Monitoring').then(m => ({ default: m.Monitoring })))
const Backups = lazy(() => import('@/pages/Backups').then(m => ({ default: m.Backups })))
const BackupSchedules = lazy(() => import('@/pages/BackupSchedules').then(m => ({ default: m.BackupSchedules })))
const Security = lazy(() => import('@/pages/Security').then(m => ({ default: m.Security })))
const SecurityAlerts = lazy(() => import('@/pages/SecurityAlerts').then(m => ({ default: m.SecurityAlerts })))
const AiConfig = lazy(() => import('@/pages/AiConfig').then(m => ({ default: m.AiConfig })))
const SupportTickets = lazy(() => import('@/pages/SupportTickets').then(m => ({ default: m.SupportTickets })))
const SupportTemplates = lazy(() => import('@/pages/SupportTemplates').then(m => ({ default: m.SupportTemplates })))
const CustomerTicketHistory = lazy(() => import('@/pages/CustomerTicketHistory').then(m => ({ default: m.CustomerTicketHistory })))
const AuditLogs = lazy(() => import('@/pages/AuditLogs').then(m => ({ default: m.AuditLogs })))
const NoticeAnalytics = lazy(() => import('@/pages/NoticeAnalytics').then(m => ({ default: m.NoticeAnalytics })))
const Settings = lazy(() => import('@/pages/Settings').then(m => ({ default: m.Settings })))
const EmailSettings = lazy(() => import('@/pages/EmailSettings').then(m => ({ default: m.EmailSettings })))
const Sitemap = lazy(() => import('@/pages/Sitemap').then(m => ({ default: m.Sitemap })))
const SeedData = lazy(() => import('@/pages/SeedData').then(m => ({ default: m.SeedData })))
const InstallWizardPage = lazy(() => import('@/pages/InstallWizardPage').then(m => ({ default: m.InstallWizardPage })))
const LegalSettings = lazy(() => import('@/pages/LegalSettings').then(m => ({ default: m.LegalSettings })))
const SecuritySettings = lazy(() => import('@/pages/SecuritySettings').then(m => ({ default: m.SecuritySettings })))
const SecurityGroups = lazy(() => import('@/pages/SecurityGroups').then(m => ({ default: m.SecurityGroups })))
const NotFound = lazy(() => import('@/pages/NotFound').then(m => ({ default: m.NotFound })))

// Composant de chargement pour Suspense
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-teal-600 dark:text-teal-400" />
      <p className="text-sm text-gray-600 dark:text-gray-400">Chargement...</p>
    </div>
  </div>
)

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
      '/security/2fa': 'Security 2FA Settings',
      '/security/groups': 'Security Groups',
      '/security/alerts': 'Security Alerts',
      '/ai-config': 'AI Configuration',
      '/support-tickets': 'Support Tickets',
      '/support-templates': 'Support Templates',
      '/audit-logs': 'Audit Logs',
      '/notice-analytics': 'Notice Analytics',
      '/backups': 'Backups',
      '/backup-schedules': 'Backup Schedules',
      '/settings': 'Settings',
      '/email-settings': 'Email Settings',
      '/legal-settings': 'Legal Settings',
      '/sitemap': 'Sitemap',
      '/seed-data': 'Seed Data',
      '/tenants/install': 'Install Wizard',
    }

    // Gérer les routes dynamiques (ex: /customers/:id/tickets)
    let pageName: string
    if (location.pathname.match(/^\/customers\/\d+\/tickets$/)) {
      pageName = 'Customer Ticket History'
    } else {
      pageName = pageNames[location.pathname] || location.pathname
    }

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
      <Suspense fallback={<PageLoader />}>
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
          <Route path="security/2fa" element={<SecuritySettings />} />
          <Route path="security/groups" element={<SecurityGroups />} />
          <Route path="security/alerts" element={<SecurityAlerts />} />
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
          <Route path="legal-settings" element={<LegalSettings />} />
          <Route path="sitemap" element={<Sitemap />} />
          <Route path="seed-data" element={<SeedData />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      </Suspense>

      {showWarning && (
        <InactivityWarning
          remainingTime={warningTime}
          onStayActive={handleStayActive}
        />
      )}
    </>
  )
}
