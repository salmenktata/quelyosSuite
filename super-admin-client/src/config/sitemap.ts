import { Globe, LayoutDashboard, ShieldCheck, ShoppingBag, type LucideIcon } from 'lucide-react'

const isDev = import.meta.env.DEV

/**
 * Configuration Sitemap Multi-Apps
 *
 * ⚠️  FICHIER GÉNÉRÉ AUTOMATIQUEMENT
 * Ne pas modifier manuellement - Utiliser `pnpm generate-sitemap`
 *
 * Total routes: 236
 * Généré le: 2026-01-30T17:58:00.882Z
 */

export interface AppRoute {
  path: string
  name: string
  description?: string
  module?: string
  type?: 'static' | 'dynamic'
}

export interface AppSection {
  id: string
  name: string
  baseUrl: string
  port: number
  icon: LucideIcon
  color: string
  bgColor: string
  darkBgColor: string
  routes: AppRoute[]
}

export const sitemapData: AppSection[] = [
  {
    id: 'vitrine-quelyos',
    name: 'Vitrine Quelyos',
    baseUrl: isDev ? 'http://localhost:3000' : 'https://quelyos.com',
    port: 3000,
    icon: Globe,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50',
    darkBgColor: 'dark:bg-blue-900/20',
    routes: [
      { path: '/', name: 'Accueil', type: 'static' },
      { path: '/about', name: 'About', type: 'static' },
      { path: '/auth/forgot-password', name: 'Forgot Password', type: 'static' },
      { path: '/auth/login', name: 'Login', type: 'static' },
      { path: '/auth/register', name: 'Register', type: 'static' },
      { path: '/cgu', name: 'Cgu', type: 'static' },
      { path: '/cgv', name: 'Cgv', type: 'static' },
      { path: '/confidentialite', name: 'Confidentialite', type: 'static' },
      { path: '/contact', name: 'Contact', type: 'static' },
      { path: '/crm', name: 'Crm', type: 'static' },
      { path: '/docs', name: 'Docs', type: 'static' },
      { path: '/ecommerce', name: 'Ecommerce', type: 'static' },
      { path: '/ecommerce/pricing', name: 'Pricing', type: 'static' },
      { path: '/ecommerce/signup', name: 'Signup', type: 'static' },
      { path: '/ecommerce/signup/success', name: 'Success', type: 'static' },
      { path: '/faq', name: 'Faq', type: 'static' },
      { path: '/finance', name: 'Finance', type: 'static' },
      { path: '/finance/compare', name: 'Compare', type: 'static' },
      { path: '/finance/customers', name: 'Customers', type: 'static' },
      { path: '/finance/features', name: 'Features', type: 'static' },
      { path: '/finance/features/accounts', name: 'Accounts', type: 'static' },
      { path: '/finance/features/alerts', name: 'Alerts', type: 'static' },
      { path: '/finance/features/budgets', name: 'Budgets', type: 'static' },
      { path: '/finance/features/charts', name: 'Charts', type: 'static' },
      { path: '/finance/features/comptes', name: 'Comptes', type: 'static' },
      { path: '/finance/features/dashboard', name: 'Dashboard', type: 'static' },
      { path: '/finance/features/forecast', name: 'Forecast', type: 'static' },
      { path: '/finance/features/previsions', name: 'Previsions', type: 'static' },
      { path: '/finance/features/reports', name: 'Reports', type: 'static' },
      { path: '/finance/features/security', name: 'Security', type: 'static' },
      { path: '/finance/features/team', name: 'Team', type: 'static' },
      { path: '/finance/pricing', name: 'Pricing', type: 'static' },
      { path: '/finance/templates', name: 'Templates', type: 'static' },
      { path: '/finance/templates/agence-web', name: 'Agence Web', type: 'static' },
      { path: '/finance/templates/bureau-etudes', name: 'Bureau Etudes', type: 'static' },
      { path: '/finance/templates/cabinet-conseil', name: 'Cabinet Conseil', type: 'static' },
      { path: '/finance/templates/startup-saas', name: 'Startup Saas', type: 'static' },
      { path: '/finance/terms', name: 'Terms', type: 'static' },
      { path: '/finance/tpe', name: 'Tpe', type: 'static' },
      { path: '/hr', name: 'Hr', type: 'static' },
      { path: '/legal/cgu', name: 'Cgu', type: 'static' },
      { path: '/legal/cgv', name: 'Cgv', type: 'static' },
      { path: '/legal/confidentialite', name: 'Confidentialite', type: 'static' },
      { path: '/legal/mentions-legales', name: 'Mentions Legales', type: 'static' },
      { path: '/legal/privacy', name: 'Privacy', type: 'static' },
      { path: '/marketing', name: 'Marketing', type: 'static' },
      { path: '/marketing/cgu', name: 'Cgu', type: 'static' },
      { path: '/marketing/confidentialite', name: 'Confidentialite', type: 'static' },
      { path: '/marketing/features', name: 'Features', type: 'static' },
      { path: '/marketing/forgot-password', name: 'Forgot Password', type: 'static' },
      { path: '/marketing/login', name: 'Login', type: 'static' },
      { path: '/marketing/mentions-legales', name: 'Mentions Legales', type: 'static' },
      { path: '/marketing/register.backup', name: 'Register.backup', type: 'static' },
      { path: '/mentions-legales', name: 'Mentions Legales', type: 'static' },
      { path: '/modules', name: 'Modules', type: 'static' },
      { path: '/pos', name: 'Pos', type: 'static' },
      { path: '/register', name: 'Register', type: 'static' },
      { path: '/secteurs', name: 'Secteurs', type: 'static' },
      { path: '/secteurs/[slug]', name: '', type: 'dynamic' },
      { path: '/security', name: 'Security', type: 'static' },
      { path: '/stock', name: 'Stock', type: 'static' },
      { path: '/superadmin/login', name: 'Login', type: 'static' },
      { path: '/support', name: 'Support', type: 'static' },
      { path: '/tarifs', name: 'Tarifs', type: 'static' },
    ],
  },
  {
    id: 'dashboard-client',
    name: 'Dashboard Client',
    baseUrl: isDev ? 'http://localhost:5175' : 'https://backoffice.quelyos.com',
    port: 5175,
    icon: LayoutDashboard,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50',
    darkBgColor: 'dark:bg-emerald-900/20',
    routes: [
      { path: '/admin/ai-config/page', name: 'Configuration IA', type: 'static' },
      { path: '/admin/notice-analytics', name: 'Analytics Notices', type: 'static' },
      { path: '/admin/sitemap', name: 'Suivi Sitemap', type: 'static' },
      { path: '/analytics', name: 'Analytics', type: 'static' },
      { path: '/crm/customer-categories', name: 'Catégories Clients', module: 'CRM', type: 'static' },
      { path: '/crm/customers', name: 'Clients', module: 'CRM', type: 'static' },
      { path: '/crm/leads', name: 'Opportunités', module: 'CRM', type: 'static' },
      { path: '/crm/pipeline', name: 'Pipeline', module: 'CRM', type: 'static' },
      { path: '/crm/settings', name: 'Paramètres', module: 'CRM', type: 'static' },
      { path: '/finance/accounts', name: 'Tous les comptes', module: 'Finance', type: 'static' },
      { path: '/finance/alerts', name: 'Alertes', module: 'Finance', type: 'static' },
      { path: '/finance/archives', name: 'Archives', module: 'Finance', type: 'static' },
      { path: '/finance/budgets', name: 'Budgets', module: 'Finance', type: 'static' },
      { path: '/finance/categories', name: 'Catégories', module: 'Finance', type: 'static' },
      { path: '/finance/charts', name: 'Plan Comptable', module: 'Finance', type: 'static' },
      { path: '/finance/expenses', name: 'Dépenses', module: 'Finance', type: 'static' },
      { path: '/finance/forecast', name: 'Trésorerie', module: 'Finance', type: 'static' },
      { path: '/finance/import', name: 'Import', module: 'Finance', type: 'static' },
      { path: '/finance/incomes', name: 'Revenus', module: 'Finance', type: 'static' },
      { path: '/finance/payment-planning', name: 'Échéancier', module: 'Finance', type: 'static' },
      { path: '/finance/portfolios', name: 'Portefeuilles', module: 'Finance', type: 'static' },
      { path: '/finance/reporting', name: 'Hub Rapports', module: 'Finance', type: 'static' },
      { path: '/finance/reporting/by-account', name: 'Par compte', module: 'Finance', type: 'static' },
      { path: '/finance/reporting/by-category', name: 'Par catégorie', module: 'Finance', type: 'static' },
      { path: '/finance/reporting/cashflow', name: 'Trésorerie', module: 'Finance', type: 'static' },
      { path: '/finance/reporting/profitability', name: 'Rentabilité', module: 'Finance', type: 'static' },
      { path: '/finance/scenarios', name: 'Scénarios', module: 'Finance', type: 'static' },
      { path: '/finance/settings', name: 'Paramètres', module: 'Finance', type: 'static' },
      { path: '/finance/suppliers', name: 'Fournisseurs', module: 'Finance', type: 'static' },
      { path: '/hr/appraisals', name: 'Entretiens', module: 'RH', type: 'static' },
      { path: '/hr/attendance', name: 'Présences', module: 'RH', type: 'static' },
      { path: '/hr/contracts', name: 'Contrats', module: 'RH', type: 'static' },
      { path: '/hr/departments', name: 'Départements', module: 'RH', type: 'static' },
      { path: '/hr/employees', name: 'Employés', module: 'RH', type: 'static' },
      { path: '/hr/jobs', name: 'Postes', module: 'RH', type: 'static' },
      { path: '/hr/leaves', name: 'Demandes', module: 'RH', type: 'static' },
      { path: '/hr/leaves/allocations', name: 'Allocations', module: 'RH', type: 'static' },
      { path: '/hr/leaves/calendar', name: 'Calendrier', module: 'RH', type: 'static' },
      { path: '/hr/leaves/types', name: 'Types de congés', module: 'RH', type: 'static' },
      { path: '/hr/settings', name: 'Paramètres', module: 'RH', type: 'static' },
      { path: '/hr/skills', name: 'Compétences', module: 'RH', type: 'static' },
      { path: '/inventory', name: 'Inventaire Physique', type: 'static' },
      { path: '/invoices', name: 'Factures', type: 'static' },
      { path: '/marketing/campaigns', name: 'Toutes les campagnes', module: 'Quelyos Marketing', type: 'static' },
      { path: '/marketing/contacts', name: 'Listes de contacts', module: 'Quelyos Marketing', type: 'static' },
      { path: '/marketing/email', name: 'Emails', module: 'Quelyos Marketing', type: 'static' },
      { path: '/marketing/email/templates', name: 'Templates', module: 'Quelyos Marketing', type: 'static' },
      { path: '/marketing/settings', name: 'Paramètres', module: 'Quelyos Marketing', type: 'static' },
      { path: '/marketing/sms', name: 'SMS', module: 'Quelyos Marketing', type: 'static' },
      { path: '/payments', name: 'Paiements', type: 'static' },
      { path: '/pos', name: 'Tableau de bord', module: 'Point de Vente', type: 'static' },
      { path: '/pos/analytics', name: 'Analytics IA', module: 'Point de Vente', type: 'static' },
      { path: '/pos/click-collect', name: 'Click & Collect', module: 'Point de Vente', type: 'static' },
      { path: '/pos/customer-display', name: 'Écran Client', module: 'Point de Vente', type: 'static' },
      { path: '/pos/kds', name: 'Écran Cuisine', module: 'Point de Vente', type: 'static' },
      { path: '/pos/kiosk', name: 'Mode Kiosk', module: 'Point de Vente', type: 'static' },
      { path: '/pos/mobile', name: 'Mobile POS', module: 'Point de Vente', type: 'static' },
      { path: '/pos/orders', name: 'Commandes', module: 'Point de Vente', type: 'static' },
      { path: '/pos/reports/payments', name: 'Paiements', module: 'Point de Vente', type: 'static' },
      { path: '/pos/reports/sales', name: 'Ventes', module: 'Point de Vente', type: 'static' },
      { path: '/pos/rush', name: 'Mode Rush', module: 'Point de Vente', type: 'static' },
      { path: '/pos/session/open', name: 'Ouvrir Session', module: 'Point de Vente', type: 'static' },
      { path: '/pos/sessions', name: 'Sessions', module: 'Point de Vente', type: 'static' },
      { path: '/pos/settings', name: 'Paramètres', module: 'Point de Vente', type: 'static' },
      { path: '/pos/settings/payments', name: 'Paiements', module: 'Point de Vente', type: 'static' },
      { path: '/pos/settings/receipts', name: 'Tickets', module: 'Point de Vente', type: 'static' },
      { path: '/pos/settings/terminals', name: 'Terminaux', module: 'Point de Vente', type: 'static' },
      { path: '/pos/terminal', name: 'Terminal', module: 'Point de Vente', type: 'static' },
      { path: '/pricelists', name: 'Listes de Prix', type: 'static' },
      { path: '/settings', name: 'Paramètres Généraux', type: 'static' },
      { path: '/stock', name: 'Stock', module: 'Stock', type: 'static' },
      { path: '/stock/locations', name: 'Emplacements', module: 'Stock', type: 'static' },
      { path: '/stock/moves', name: 'Mouvements', module: 'Stock', type: 'static' },
      { path: '/stock/reordering-rules', name: 'Règles Réapprovisionnement', module: 'Stock', type: 'static' },
      { path: '/stock/settings', name: 'Paramètres', module: 'Stock', type: 'static' },
      { path: '/stock/transfers', name: 'Transferts', module: 'Stock', type: 'static' },
      { path: '/stock/turnover', name: 'Rotation', module: 'Stock', type: 'static' },
      { path: '/stock/valuation', name: 'Valorisation', module: 'Stock', type: 'static' },
      { path: '/store/abandoned-carts', name: 'Paniers Abandonnés', module: 'Boutique', type: 'static' },
      { path: '/store/attributes', name: 'Attributs', module: 'Boutique', type: 'static' },
      { path: '/store/blog', name: 'Blog / Articles', module: 'Boutique', type: 'static' },
      { path: '/store/bundles', name: 'Bundles / Packs', module: 'Boutique', type: 'static' },
      { path: '/store/categories', name: 'Catégories', module: 'Boutique', type: 'static' },
      { path: '/store/collections', name: 'Collections', module: 'Boutique', type: 'static' },
      { path: '/store/coupons', name: 'Codes Promo', module: 'Boutique', type: 'static' },
      { path: '/store/faq', name: 'FAQ', module: 'Boutique', type: 'static' },
      { path: '/store/featured', name: 'Produits Vedette', module: 'Boutique', type: 'static' },
      { path: '/store/flash-sales', name: 'Ventes Flash', module: 'Boutique', type: 'static' },
      { path: '/store/hero-slides', name: 'Hero Slides', module: 'Boutique', type: 'static' },
      { path: '/store/import-export', name: 'Import / Export', module: 'Boutique', type: 'static' },
      { path: '/store/live-events', name: 'Live Shopping', module: 'Boutique', type: 'static' },
      { path: '/store/loyalty', name: 'Programme Fidélité', module: 'Boutique', type: 'static' },
      { path: '/store/marketing-popups', name: 'Popups Marketing', module: 'Boutique', type: 'static' },
      { path: '/store/menus', name: 'Menus Navigation', module: 'Boutique', type: 'static' },
      { path: '/store/orders', name: 'Commandes', module: 'Boutique', type: 'static' },
      { path: '/store/products', name: 'Produits', module: 'Boutique', type: 'static' },
      { path: '/store/promo-banners', name: 'Bannières', module: 'Boutique', type: 'static' },
      { path: '/store/promo-messages', name: 'Messages Promo', module: 'Boutique', type: 'static' },
      { path: '/store/reviews', name: 'Avis Clients', module: 'Boutique', type: 'static' },
      { path: '/store/sales-reports', name: 'Ventes', module: 'Boutique', type: 'static' },
      { path: '/store/settings', name: 'Paramètres', module: 'Boutique', type: 'static' },
      { path: '/store/static-pages', name: 'Pages Statiques', module: 'Boutique', type: 'static' },
      { path: '/store/stock-alerts', name: 'Alertes Stock', module: 'Boutique', type: 'static' },
      { path: '/store/testimonials', name: 'Témoignages', module: 'Boutique', type: 'static' },
      { path: '/store/themes', name: 'Thèmes', module: 'Boutique', type: 'static' },
      { path: '/store/themes/builder', name: 'Theme Builder', module: 'Boutique', type: 'static' },
      { path: '/store/themes/import', name: 'Import Thèmes JSON', module: 'Boutique', type: 'static' },
      { path: '/store/themes/marketplace', name: 'Marketplace Thèmes', module: 'Boutique', type: 'static' },
      { path: '/store/themes/my-submissions', name: 'Mes Soumissions', module: 'Boutique', type: 'static' },
      { path: '/store/themes/submit', name: 'Soumettre un Thème', module: 'Boutique', type: 'static' },
      { path: '/store/tickets', name: 'Tickets SAV', module: 'Boutique', type: 'static' },
      { path: '/store/trending-products', name: 'Produits Tendance', module: 'Boutique', type: 'static' },
      { path: '/store/trust-badges', name: 'Badges Confiance', module: 'Boutique', type: 'static' },
      { path: '/support/faq', name: 'FAQ', module: 'Support', type: 'static' },
      { path: '/support/tickets', name: 'Mes Tickets', module: 'Support', type: 'static' },
      { path: '/support/tickets/new', name: 'Créer un Ticket', module: 'Support', type: 'static' },
      { path: '/warehouses', name: 'Entrepôts', type: 'static' },
    ],
  },
  {
    id: 'super-admin-client',
    name: 'Super Admin Client',
    baseUrl: isDev ? 'http://localhost:9000' : 'https://admin.quelyos.com',
    port: 9000,
    icon: ShieldCheck,
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-50',
    darkBgColor: 'dark:bg-teal-900/20',
    routes: [
      { path: '/ai-config', name: 'Configuration IA', type: 'static' },
      { path: '/audit-logs', name: 'Audit Logs', type: 'static' },
      { path: '/backups', name: 'Backups', type: 'static' },
      { path: '/billing', name: 'Facturation', type: 'static' },
      { path: '/dashboard', name: 'Dashboard', type: 'static' },
      { path: '/email-settings', name: 'Email (SMTP)', type: 'static' },
      { path: '/monitoring', name: 'Monitoring', type: 'static' },
      { path: '/plans', name: 'Plans', type: 'static' },
      { path: '/security', name: 'Sécurité', type: 'static' },
      { path: '/settings', name: 'Paramètres', type: 'static' },
      { path: '/sitemap', name: 'Sitemap', type: 'static' },
      { path: '/subscriptions', name: 'Abonnements', type: 'static' },
      { path: '/support-templates', name: 'Templates', type: 'static' },
      { path: '/support-tickets', name: 'Support', type: 'static' },
      { path: '/tenants', name: 'Tenants', type: 'static' },
    ],
  },
  {
    id: 'vitrine-client',
    name: 'Boutique E-commerce',
    baseUrl: isDev ? 'http://localhost:3001' : 'https://boutique.quelyos.com',
    port: 3001,
    icon: ShoppingBag,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50',
    darkBgColor: 'dark:bg-purple-900/20',
    routes: [
      { path: '/', name: 'Accueil', type: 'static' },
      { path: '/(shop)/theme-demo', name: 'Theme Demo', type: 'static' },
      { path: '/about', name: 'About', type: 'static' },
      { path: '/account', name: 'Account', type: 'static' },
      { path: '/account/addresses', name: 'Addresses', type: 'static' },
      { path: '/account/loyalty', name: 'Loyalty', type: 'static' },
      { path: '/account/orders', name: 'Orders', type: 'static' },
      { path: '/account/orders/[id]', name: '', type: 'dynamic' },
      { path: '/account/profile', name: 'Profile', type: 'static' },
      { path: '/account/referral', name: 'Referral', type: 'static' },
      { path: '/account/wishlist', name: 'Wishlist', type: 'static' },
      { path: '/admin/analytics', name: 'Analytics', type: 'static' },
      { path: '/blog', name: 'Blog', type: 'static' },
      { path: '/blog/[slug]', name: '', type: 'dynamic' },
      { path: '/cart', name: 'Cart', type: 'static' },
      { path: '/cart/recover', name: 'Recover', type: 'static' },
      { path: '/categories', name: 'Categories', type: 'static' },
      { path: '/checkout', name: 'Checkout', type: 'static' },
      { path: '/checkout/payment', name: 'Payment', type: 'static' },
      { path: '/checkout/payment/return', name: 'Return', type: 'static' },
      { path: '/checkout/shipping', name: 'Shipping', type: 'static' },
      { path: '/checkout/success', name: 'Success', type: 'static' },
      { path: '/collections', name: 'Collections', type: 'static' },
      { path: '/collections/[slug]', name: '', type: 'dynamic' },
      { path: '/compare', name: 'Compare', type: 'static' },
      { path: '/contact', name: 'Contact', type: 'static' },
      { path: '/faq', name: 'Faq', type: 'static' },
      { path: '/legal', name: 'Legal', type: 'static' },
      { path: '/login', name: 'Login', type: 'static' },
      { path: '/offline', name: 'Offline', type: 'static' },
      { path: '/pages/[slug]', name: '', type: 'dynamic' },
      { path: '/privacy', name: 'Privacy', type: 'static' },
      { path: '/products', name: 'Products', type: 'static' },
      { path: '/products/[slug]', name: '', type: 'dynamic' },
      { path: '/register', name: 'Register', type: 'static' },
      { path: '/returns', name: 'Returns', type: 'static' },
      { path: '/shipping', name: 'Shipping', type: 'static' },
      { path: '/terms', name: 'Terms', type: 'static' },
      { path: '/theme-preview', name: 'Theme Preview', type: 'static' },
      { path: '/wishlist/[token]', name: '', type: 'dynamic' },
    ],
  }
]

// Statistiques globales
export const getSitemapStats = () => {
  const totalRoutes = sitemapData.reduce((acc, app) => acc + app.routes.length, 0)
  const appStats = sitemapData.map(app => ({
    id: app.id,
    name: app.name,
    count: app.routes.length,
  }))

  return {
    totalRoutes,
    totalApps: sitemapData.length,
    appStats,
  }
}

// Détecter type route (static vs dynamic)
export function getRouteType(path: string): 'static' | 'dynamic' {
  return /\[|:/.test(path) ? 'dynamic' : 'static'
}

// Extraire modules uniques (Dashboard Client)
export function getDashboardModules(): string[] {
  const dashboardApp = sitemapData.find(app => app.id === 'dashboard-client')
  if (!dashboardApp) return []

  const modules = new Set<string>()
  dashboardApp.routes.forEach(route => {
    if (route.module) {
      modules.add(route.module)
    }
  })

  return Array.from(modules).sort()
}

// Enrichir routes avec type auto-détecté
export const enrichedSitemapData = sitemapData.map(app => ({
  ...app,
  routes: app.routes.map(route => ({
    ...route,
    type: route.type || getRouteType(route.path),
  })),
}))
