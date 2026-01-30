import { Globe, LayoutDashboard, ShieldCheck, ShoppingBag, type LucideIcon } from 'lucide-react'

/**
 * Configuration Sitemap Multi-Apps
 * Liste exhaustive des routes de l'écosystème Quelyos
 */

export interface AppRoute {
  path: string
  name: string
  description?: string
  module?: string
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
    baseUrl: 'http://localhost:3000',
    port: 3000,
    icon: Globe,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50',
    darkBgColor: 'dark:bg-blue-900/20',
    routes: [
      { path: '/', name: 'Accueil', description: 'Page principale' },
      { path: '/about', name: 'À propos' },
      { path: '/contact', name: 'Contact' },
      { path: '/docs', name: 'Documentation' },
      { path: '/faq', name: 'FAQ' },
      { path: '/modules', name: 'Modules' },
      { path: '/security', name: 'Sécurité' },
      { path: '/support', name: 'Support' },
      { path: '/tarifs', name: 'Tarifs' },

      // Modules
      { path: '/finance', name: 'Finance', module: 'Module Finance' },
      { path: '/finance/features', name: 'Finance - Fonctionnalités' },
      { path: '/finance/pricing', name: 'Finance - Tarifs' },
      { path: '/finance/compare', name: 'Finance - Comparatif' },
      { path: '/finance/customers', name: 'Finance - Clients' },
      { path: '/finance/tpe', name: 'Finance - TPE' },
      { path: '/finance/terms', name: 'Finance - Conditions' },
      { path: '/crm', name: 'CRM', module: 'Module CRM' },
      { path: '/hr', name: 'RH', module: 'Module RH' },
      { path: '/pos', name: 'Point de Vente', module: 'Module POS' },
      { path: '/stock', name: 'Stock', module: 'Module Stock' },
      { path: '/marketing', name: 'Marketing', module: 'Module Marketing' },
      { path: '/ecommerce', name: 'E-commerce', module: 'Module E-commerce' },
      { path: '/ecommerce/pricing', name: 'E-commerce - Tarifs' },

      // Finance Features
      { path: '/finance/features/dashboard', name: 'Finance - Dashboard' },
      { path: '/finance/features/accounts', name: 'Finance - Comptes' },
      { path: '/finance/features/budgets', name: 'Finance - Budgets' },
      { path: '/finance/features/forecast', name: 'Finance - Prévisions' },
      { path: '/finance/features/reports', name: 'Finance - Rapports' },
      { path: '/finance/features/alerts', name: 'Finance - Alertes' },
      { path: '/finance/features/team', name: 'Finance - Équipe' },
      { path: '/finance/features/security', name: 'Finance - Sécurité' },
      { path: '/finance/features/charts', name: 'Finance - Graphiques' },

      // Finance Templates
      { path: '/finance/templates', name: 'Finance - Templates' },
      { path: '/finance/templates/startup-saas', name: 'Finance - Template Startup SaaS' },
      { path: '/finance/templates/agence-web', name: 'Finance - Template Agence Web' },
      { path: '/finance/templates/cabinet-conseil', name: 'Finance - Template Cabinet Conseil' },
      { path: '/finance/templates/bureau-etudes', name: 'Finance - Template Bureau d\'Études' },

      // E-commerce
      { path: '/ecommerce/signup', name: 'E-commerce - Inscription' },
      { path: '/ecommerce/signup/success', name: 'E-commerce - Inscription Succès' },

      // Marketing
      { path: '/marketing/features', name: 'Marketing - Fonctionnalités' },
      { path: '/marketing/login', name: 'Marketing - Connexion' },
      { path: '/marketing/forgot-password', name: 'Marketing - Mot de passe oublié' },

      // Secteurs
      { path: '/secteurs', name: 'Secteurs' },
      { path: '/secteurs/[slug]', name: 'Secteurs - Détail' },

      // Auth
      { path: '/auth/login', name: 'Connexion' },
      { path: '/auth/register', name: 'Inscription' },
      { path: '/auth/forgot-password', name: 'Mot de passe oublié' },
      { path: '/register', name: 'Inscription (Legacy)' },
      { path: '/superadmin/login', name: 'Super Admin - Connexion' },

      // Legal
      { path: '/legal/cgu', name: 'CGU' },
      { path: '/legal/cgv', name: 'CGV' },
      { path: '/legal/confidentialite', name: 'Confidentialité' },
      { path: '/legal/mentions-legales', name: 'Mentions légales' },
      { path: '/legal/privacy', name: 'Privacy (EN)' },
      { path: '/cgu', name: 'CGU (Legacy)' },
      { path: '/cgv', name: 'CGV (Legacy)' },
      { path: '/confidentialite', name: 'Confidentialité (Legacy)' },
      { path: '/mentions-legales', name: 'Mentions légales (Legacy)' },
    ],
  },
  {
    id: 'dashboard-client',
    name: 'Dashboard Client',
    baseUrl: 'http://localhost:5175',
    port: 5175,
    icon: LayoutDashboard,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50',
    darkBgColor: 'dark:bg-emerald-900/20',
    routes: [
      // Home
      { path: '/dashboard', name: 'Tableau de bord', module: 'Home' },
      { path: '/analytics', name: 'Analytics', module: 'Home' },
      { path: '/admin/sitemap', name: 'Suivi Sitemap', module: 'Home' },
      { path: '/admin/notice-analytics', name: 'Analytics Notices', module: 'Home' },
      { path: '/admin/ai-config/page', name: 'Configuration IA', module: 'Home' },
      { path: '/settings', name: 'Paramètres Généraux', module: 'Home' },

      // Finance
      { path: '/finance', name: 'Finance - Vue d\'ensemble', module: 'Finance' },
      { path: '/finance/accounts', name: 'Tous les comptes', module: 'Finance' },
      { path: '/finance/portfolios', name: 'Portefeuilles', module: 'Finance' },
      { path: '/finance/expenses', name: 'Dépenses', module: 'Finance' },
      { path: '/finance/incomes', name: 'Revenus', module: 'Finance' },
      { path: '/finance/budgets', name: 'Budgets', module: 'Finance' },
      { path: '/finance/forecast', name: 'Trésorerie', module: 'Finance' },
      { path: '/finance/scenarios', name: 'Scénarios', module: 'Finance' },
      { path: '/finance/payment-planning', name: 'Échéancier', module: 'Finance' },
      { path: '/finance/reporting', name: 'Hub Rapports', module: 'Finance' },
      { path: '/finance/reporting/cashflow', name: 'Trésorerie', module: 'Finance' },
      { path: '/finance/reporting/by-category', name: 'Par catégorie', module: 'Finance' },
      { path: '/finance/reporting/by-account', name: 'Par compte', module: 'Finance' },
      { path: '/finance/reporting/profitability', name: 'Rentabilité', module: 'Finance' },
      { path: '/finance/categories', name: 'Catégories', module: 'Finance' },
      { path: '/finance/tags', name: 'Étiquettes', module: 'Finance' },
      { path: '/finance/currencies', name: 'Devises', module: 'Finance' },
      { path: '/finance/import', name: 'Import', module: 'Finance' },
      { path: '/finance/exports', name: 'Exports', module: 'Finance' },
      { path: '/finance/settings', name: 'Paramètres Finance', module: 'Finance' },

      // Store (E-commerce)
      { path: '/store', name: 'Boutique - Vue d\'ensemble', module: 'Store' },
      { path: '/store/products', name: 'Produits', module: 'Store' },
      { path: '/store/products/new', name: 'Nouveau produit', module: 'Store' },
      { path: '/store/categories', name: 'Catégories', module: 'Store' },
      { path: '/store/attributes', name: 'Attributs', module: 'Store' },
      { path: '/store/images', name: 'Images', module: 'Store' },
      { path: '/store/variants', name: 'Variantes', module: 'Store' },
      { path: '/store/inventory', name: 'Inventaire', module: 'Store' },
      { path: '/store/orders', name: 'Commandes', module: 'Store' },
      { path: '/store/payments', name: 'Paiements', module: 'Store' },
      { path: '/store/shipping', name: 'Expédition', module: 'Store' },
      { path: '/store/invoices', name: 'Factures', module: 'Store' },
      { path: '/store/reviews', name: 'Avis', module: 'Store' },
      { path: '/store/coupons', name: 'Coupons', module: 'Store' },
      { path: '/store/collections', name: 'Collections', module: 'Store' },
      { path: '/store/abandoned-carts', name: 'Paniers abandonnés', module: 'Store' },
      { path: '/store/wishlists', name: 'Listes de souhaits', module: 'Store' },
      { path: '/store/customer-support', name: 'Support Client', module: 'Store' },
      { path: '/store/faq', name: 'FAQ', module: 'Store' },
      { path: '/store/pages', name: 'Pages', module: 'Store' },
      { path: '/store/menus', name: 'Menus', module: 'Store' },
      { path: '/store/blog', name: 'Blog', module: 'Store' },
      { path: '/store/seo', name: 'SEO', module: 'Store' },
      { path: '/store/media', name: 'Médias', module: 'Store' },
      { path: '/store/themes', name: 'Thèmes', module: 'Store' },
      { path: '/store/settings', name: 'Paramètres Boutique', module: 'Store' },

      // Stock
      { path: '/stock', name: 'Stock - Vue d\'ensemble', module: 'Stock' },
      { path: '/stock/products', name: 'Produits', module: 'Stock' },
      { path: '/stock/inventory', name: 'Inventaire', module: 'Stock' },
      { path: '/stock/movements', name: 'Mouvements', module: 'Stock' },
      { path: '/stock/adjustments', name: 'Ajustements', module: 'Stock' },
      { path: '/stock/transfers', name: 'Transferts', module: 'Stock' },
      { path: '/stock/warehouses', name: 'Entrepôts', module: 'Stock' },
      { path: '/stock/locations', name: 'Emplacements', module: 'Stock' },
      { path: '/stock/reordering', name: 'Réapprovisionnement', module: 'Stock' },
      { path: '/stock/valuation', name: 'Valorisation', module: 'Stock' },
      { path: '/stock/kitting', name: 'Kits', module: 'Stock' },
      { path: '/stock/reporting', name: 'Rapports Stock', module: 'Stock' },
      { path: '/stock/settings', name: 'Paramètres Stock', module: 'Stock' },

      // CRM
      { path: '/crm', name: 'CRM - Vue d\'ensemble', module: 'CRM' },
      { path: '/crm/customers', name: 'Clients', module: 'CRM' },
      { path: '/crm/contacts', name: 'Contacts', module: 'CRM' },
      { path: '/crm/companies', name: 'Entreprises', module: 'CRM' },
      { path: '/crm/pipeline', name: 'Pipeline', module: 'CRM' },
      { path: '/crm/opportunities', name: 'Opportunités', module: 'CRM' },
      { path: '/crm/quotes', name: 'Devis', module: 'CRM' },
      { path: '/crm/activities', name: 'Activités', module: 'CRM' },
      { path: '/crm/segments', name: 'Segments', module: 'CRM' },
      { path: '/crm/reporting', name: 'Rapports CRM', module: 'CRM' },
      { path: '/crm/settings', name: 'Paramètres CRM', module: 'CRM' },

      // Marketing
      { path: '/marketing', name: 'Marketing - Vue d\'ensemble', module: 'Marketing' },
      { path: '/marketing/campaigns', name: 'Campagnes', module: 'Marketing' },
      { path: '/marketing/contacts', name: 'Contacts', module: 'Marketing' },
      { path: '/marketing/segments', name: 'Segments', module: 'Marketing' },
      { path: '/marketing/templates', name: 'Templates Email', module: 'Marketing' },
      { path: '/marketing/analytics', name: 'Analytics Marketing', module: 'Marketing' },
      { path: '/marketing/automation', name: 'Automation', module: 'Marketing' },
      { path: '/marketing/settings', name: 'Paramètres Marketing', module: 'Marketing' },

      // HR
      { path: '/hr', name: 'RH - Vue d\'ensemble', module: 'HR' },
      { path: '/hr/employees', name: 'Employés', module: 'HR' },
      { path: '/hr/departments', name: 'Départements', module: 'HR' },
      { path: '/hr/leaves', name: 'Congés', module: 'HR' },
      { path: '/hr/attendance', name: 'Présences', module: 'HR' },
      { path: '/hr/expenses', name: 'Notes de frais', module: 'HR' },
      { path: '/hr/payroll', name: 'Paie', module: 'HR' },
      { path: '/hr/recruitment', name: 'Recrutement', module: 'HR' },
      { path: '/hr/reporting', name: 'Rapports RH', module: 'HR' },
      { path: '/hr/settings', name: 'Paramètres RH', module: 'HR' },

      // POS
      { path: '/pos', name: 'Point de Vente - Vue d\'ensemble', module: 'POS' },
      { path: '/pos/session', name: 'Session', module: 'POS' },
      { path: '/pos/orders', name: 'Commandes', module: 'POS' },
      { path: '/pos/payments', name: 'Paiements', module: 'POS' },
      { path: '/pos/receipts', name: 'Tickets', module: 'POS' },
      { path: '/pos/cashier', name: 'Caisse', module: 'POS' },
      { path: '/pos/settings', name: 'Paramètres POS', module: 'POS' },

      // Support
      { path: '/support', name: 'Support - Vue d\'ensemble', module: 'Support' },
      { path: '/support/tickets', name: 'Tickets', module: 'Support' },
      { path: '/support/knowledge-base', name: 'Base de connaissances', module: 'Support' },
      { path: '/support/settings', name: 'Paramètres Support', module: 'Support' },
    ],
  },
  {
    id: 'super-admin-client',
    name: 'Super Admin Client',
    baseUrl: 'http://localhost:5176',
    port: 5176,
    icon: ShieldCheck,
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-50',
    darkBgColor: 'dark:bg-teal-900/20',
    routes: [
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/tenants', name: 'Tenants' },
      { path: '/plans', name: 'Plans' },
      { path: '/subscriptions', name: 'Abonnements' },
      { path: '/billing', name: 'Facturation' },
      { path: '/monitoring', name: 'Monitoring' },
      { path: '/security', name: 'Sécurité' },
      { path: '/ai-config', name: 'Configuration IA' },
      { path: '/support-tickets', name: 'Support Tickets' },
      { path: '/support-templates', name: 'Templates Support' },
      { path: '/customers/:customerId/tickets', name: 'Historique Tickets Client' },
      { path: '/audit-logs', name: 'Audit Logs' },
      { path: '/backups', name: 'Backups' },
      { path: '/settings', name: 'Paramètres' },
      { path: '/sitemap', name: 'Sitemap' },
    ],
  },
  {
    id: 'vitrine-client',
    name: 'Boutique E-commerce',
    baseUrl: 'http://localhost:3001',
    port: 3001,
    icon: ShoppingBag,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50',
    darkBgColor: 'dark:bg-purple-900/20',
    routes: [
      { path: '/', name: 'Accueil' },
      { path: '/about', name: 'À propos' },
      { path: '/contact', name: 'Contact' },
      { path: '/faq', name: 'FAQ' },
      { path: '/legal', name: 'Mentions légales' },
      { path: '/privacy', name: 'Confidentialité' },
      { path: '/terms', name: 'CGU' },
      { path: '/shipping', name: 'Livraison' },
      { path: '/returns', name: 'Retours' },
      { path: '/offline', name: 'Mode hors ligne' },

      // Products
      { path: '/products', name: 'Produits' },
      { path: '/products/[slug]', name: 'Produit - Détail' },
      { path: '/categories', name: 'Catégories' },
      { path: '/collections', name: 'Collections' },
      { path: '/collections/[slug]', name: 'Collection - Détail' },

      // Cart & Checkout
      { path: '/cart', name: 'Panier' },
      { path: '/cart/recover', name: 'Récupération panier' },
      { path: '/checkout', name: 'Commande' },
      { path: '/checkout/shipping', name: 'Commande - Livraison' },
      { path: '/checkout/payment', name: 'Commande - Paiement' },
      { path: '/checkout/payment/return', name: 'Commande - Retour paiement' },
      { path: '/checkout/success', name: 'Commande - Succès' },

      // Account
      { path: '/login', name: 'Connexion' },
      { path: '/register', name: 'Inscription' },
      { path: '/account', name: 'Mon compte' },
      { path: '/account/profile', name: 'Profil' },
      { path: '/account/orders', name: 'Mes commandes' },
      { path: '/account/orders/[id]', name: 'Commande - Détail' },
      { path: '/account/addresses', name: 'Adresses' },
      { path: '/account/wishlist', name: 'Liste de souhaits' },
      { path: '/account/loyalty', name: 'Programme fidélité' },
      { path: '/account/referral', name: 'Parrainage' },

      // Other
      { path: '/wishlist/[token]', name: 'Liste de souhaits partagée' },
      { path: '/compare', name: 'Comparateur' },
      { path: '/blog', name: 'Blog' },
      { path: '/blog/[slug]', name: 'Article - Détail' },
      { path: '/pages/[slug]', name: 'Page personnalisée' },

      // Admin
      { path: '/admin/analytics', name: 'Admin - Analytics' },

      // Theme
      { path: '/theme-preview', name: 'Aperçu thème' },
      { path: '/(shop)/theme-demo', name: 'Démo thème' },
    ],
  },
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
