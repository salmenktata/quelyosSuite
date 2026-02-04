/**
 * Notices contextuelles pour les pages
 */

// Re-export types from notices/types
export type { PageNoticeConfig, NoticeSection } from './notices/types'


export interface Notice {
  type: 'info' | 'warning' | 'success' | 'error'
  title?: string
  message: string
}

// Notices Finance
export const financeNotices: Record<string, Notice[]> = {
  dashboard: [{ type: 'info' as const, title: 'Dashboard Finance', message: 'Vue d\'ensemble de vos finances.' }],
  invoices: [{ type: 'info' as const, title: 'Factures Clients', message: 'Gérez vos factures de vente et suivez les paiements en temps réel.' }],
  bills: [{ type: 'info' as const, title: 'Factures Fournisseurs', message: 'Enregistrez et suivez vos factures d\'achat.' }],
  chartOfAccounts: [{ type: 'info' as const, title: 'Plan Comptable', message: 'Consultez et gérez votre plan comptable.' }],
  payments: [{ type: 'info' as const, title: 'Paiements', message: 'Suivez tous vos paiements clients et fournisseurs.' }],
  fiscalYears: [{ type: 'info' as const, title: 'Exercices Fiscaux', message: 'Gérez vos périodes comptables et exercices fiscaux.' }],
  journals: [{ type: 'info' as const, title: 'Journaux Comptables', message: 'Consultez vos journaux de ventes, achats, banque, etc.' }],
  taxDeclarations: [{ type: 'warning' as const, title: 'Déclarations TVA', message: 'Générez vos déclarations TVA mensuelles conformes DGFiP (France) et SPF Finances (Belgique).' }],
  suppliers: [{ type: 'info' as const, title: 'Fournisseurs', message: 'Gérez vos fournisseurs et planifiez vos paiements.' }],
}

// Notices Store/Ecommerce
export const storeNotices: Record<string, Notice[]> = {
  products: [{ type: 'info' as const, message: 'Gérez votre catalogue produits.' }],
  orders: [{ type: 'info' as const, message: 'Gérez vos commandes clients.' }],
  categories: [{ type: 'info' as const, message: 'Organisez vos catégories de produits.' }],
  coupons: [{ type: 'info' as const, message: 'Créez et gérez vos codes promotionnels.' }],
  featured: [{ type: 'info' as const, message: 'Gérez vos produits mis en avant.' }],
  abandonedCarts: [{ type: 'info' as const, message: 'Suivez les paniers abandonnés.' }],
  reviews: [{ type: 'info' as const, message: 'Gérez les avis clients.' }],
  testimonials: [{ type: 'info' as const, message: 'Gérez les témoignages clients.' }],
  trustBadges: [{ type: 'info' as const, message: 'Configurez vos badges de confiance.' }],
  promoBanners: [{ type: 'info' as const, message: 'Créez des bannières promotionnelles.' }],
  promoMessages: [{ type: 'info' as const, message: 'Configurez vos messages promotionnels.' }],
  staticPages: [{ type: 'info' as const, message: 'Gérez vos pages statiques.' }],
  checkoutConfig: [{ type: 'info' as const, message: 'Personnalisez le processus de commande : étapes, messages, options.' }],
  stockAlerts: [{ type: 'info' as const, message: 'Configurez les alertes de stock.' }],
  trendingProducts: [{ type: 'info' as const, message: 'Gérez les produits tendance.' }],
  tickets: [{ type: 'info' as const, message: 'Support client e-commerce.' }],
  salesReports: [{ type: 'info' as const, message: 'Rapports de ventes.' }],
  productImport: [{ type: 'info' as const, message: 'Importez vos produits en masse.' }],
  delivery: [{ type: 'info' as const, message: 'Configurez vos méthodes de livraison.' }],
  themes: [{ type: 'info' as const, message: 'Gérez les thèmes de votre boutique.' }],
  'themes.payouts': [{ type: 'info' as const, message: 'Gérez les paiements des thèmes.' }],
  attributes: [{ type: 'info' as const, message: 'Gérez les attributs produits.' }],
  blog: [{ type: 'info' as const, message: 'Gérez votre blog.' }],
  bundles: [{ type: 'info' as const, message: 'Gérez les packs produits.' }],
  collections: [{ type: 'info' as const, message: 'Gérez vos collections.' }],
  couponForm: [{ type: 'info' as const, message: 'Créez un nouveau coupon.' }],
  faq: [{ type: 'info' as const, message: 'Gérez la FAQ.' }],
  flashSales: [{ type: 'info' as const, message: 'Gérez les ventes flash.' }],
  heroSlides: [{ type: 'info' as const, message: 'Gérez les slides héro.' }],
  liveEvents: [{ type: 'info' as const, message: 'Gérez les événements en direct.' }],
  loyalty: [{ type: 'info' as const, message: 'Gérez le programme de fidélité.' }],
  menus: [{ type: 'info' as const, message: 'Gérez les menus de navigation.' }],
}

export const ecommerceNotices = storeNotices

export const crmNotices: Record<string, Notice[]> = {
  contacts: [{ type: 'info' as const, message: 'Gérez vos contacts clients et prospects.' }],
  analytics: [{ type: 'info' as const, message: 'Vue d\'ensemble des statistiques de votre boutique.' }],
  customerCategories: [{ type: 'info' as const, message: 'Gérez vos catégories de clients.' }],
}

export const marketingNotices: Record<string, Notice[]> = {
  campaigns: [{ type: 'info' as const, message: 'Créez et suivez vos campagnes marketing.' }],
}

export const supportNotices: Record<string, Notice[]> = {
  tickets: [{ type: 'info' as const, message: 'Gérez vos tickets de support.' }],
  newTicket: [{ type: 'info' as const, message: 'Créez un nouveau ticket de support.' }],
}

export const hrNotices: Record<string, Notice[]> = {
  employees: [{ type: 'info' as const, message: 'Gérez vos employés.' }],
  departments: [{ type: 'info' as const, message: 'Gérez vos départements.' }],
  jobs: [{ type: 'info' as const, message: 'Gérez les postes.' }],
  skills: [{ type: 'info' as const, message: 'Gérez les compétences.' }],
  appraisals: [{ type: 'info' as const, message: 'Gérez les évaluations.' }],
  contracts: [{ type: 'info' as const, message: 'Gérez les contrats.' }],
  leaves: [{ type: 'info' as const, message: 'Gérez les congés.' }],
  attendance: [{ type: 'info' as const, message: 'Gérez les présences.' }],
}

export { stockNotices } from './notices/stock-notices'

financeNotices.portfolios = [
  {
    type: 'info' as const,
    title: 'Portefeuilles',
    message: 'Organisez vos comptes en portefeuilles thématiques pour une gestion optimisée.',
  },
]

financeNotices.cashflow = [
  {
    type: 'info' as const,
    title: 'Trésorerie',
    message: 'Analysez vos flux de trésorerie et anticipez votre solde avec les prévisions à 30 jours.',
  },
]

financeNotices.bfr = [
  {
    type: 'info' as const,
    title: 'BFR',
    message: 'Besoin en Fonds de Roulement : optimisez votre cycle d\'exploitation.',
  },
]

financeNotices.forecasts = [
  {
    type: 'info' as const,
    title: 'Prédictions ML',
    message: 'Prévisions intelligentes des KPIs via algorithme Prophet (Machine Learning).',
  },
]
