import type { BreadcrumbItem } from '@/components/common/Breadcrumbs'

const routeBreadcrumbs: Record<string, BreadcrumbItem[]> = {
  '/dashboard': [
    { label: 'Dashboard' },
  ],
  '/tenants': [
    { label: 'Business', path: '/tenants' },
    { label: 'Tenants' },
  ],
  '/tenants/install': [
    { label: 'Business', path: '/tenants' },
    { label: 'Tenants', path: '/tenants' },
    { label: 'Installation' },
  ],
  '/plans': [
    { label: 'Business', path: '/plans' },
    { label: 'Plans' },
  ],
  '/subscriptions': [
    { label: 'Business', path: '/subscriptions' },
    { label: 'Abonnements' },
  ],
  '/billing': [
    { label: 'Business', path: '/billing' },
    { label: 'Facturation' },
  ],
  '/monitoring': [
    { label: 'Opérations', path: '/monitoring' },
    { label: 'Monitoring' },
  ],
  '/database-performance': [
    { label: 'Opérations', path: '/monitoring' },
    { label: 'Database Performance' },
  ],
  '/backups': [
    { label: 'Opérations', path: '/backups' },
    { label: 'Backups' },
  ],
  '/backup-schedules': [
    { label: 'Opérations', path: '/backups' },
    { label: 'Planifications' },
  ],
  '/seed-data': [
    { label: 'Opérations', path: '/seed-data' },
    { label: 'Données Seed' },
  ],
  '/support-tickets': [
    { label: 'Support', path: '/support-tickets' },
    { label: 'Tickets' },
  ],
  '/support-templates': [
    { label: 'Support', path: '/support-tickets' },
    { label: 'Templates' },
  ],
  '/security': [
    { label: 'Sécurité', path: '/security' },
    { label: 'Vue Générale' },
  ],
  '/security/2fa': [
    { label: 'Sécurité', path: '/security' },
    { label: '2FA / TOTP' },
  ],
  '/security/groups': [
    { label: 'Sécurité', path: '/security' },
    { label: 'Groupes' },
  ],
  '/security/alerts': [
    { label: 'Sécurité', path: '/security' },
    { label: 'Alertes' },
  ],
  '/audit-logs': [
    { label: 'Sécurité', path: '/security' },
    { label: 'Audit Logs' },
  ],
  '/settings': [
    { label: 'Configuration', path: '/settings' },
    { label: 'Paramètres' },
  ],
  '/email-settings': [
    { label: 'Configuration', path: '/settings' },
    { label: 'Email (SMTP)' },
  ],
  '/ai-config': [
    { label: 'Configuration', path: '/settings' },
    { label: 'Configuration IA' },
  ],
  '/legal-settings': [
    { label: 'Configuration', path: '/settings' },
    { label: 'Mentions légales' },
  ],
  '/sitemap': [
    { label: 'Configuration', path: '/settings' },
    { label: 'Sitemap' },
  ],
  '/notice-analytics': [
    { label: 'Tableau de bord', path: '/dashboard' },
    { label: 'Analytiques Notices' },
  ],
}

export function getBreadcrumbs(pathname: string): BreadcrumbItem[] | null {
  // Exact match
  if (routeBreadcrumbs[pathname]) {
    return routeBreadcrumbs[pathname]
  }

  // Dynamic routes: /customers/:id/tickets
  if (pathname.match(/^\/customers\/\d+\/tickets$/)) {
    return [
      { label: 'Support', path: '/support-tickets' },
      { label: 'Historique Tickets Client' },
    ]
  }

  return null
}
