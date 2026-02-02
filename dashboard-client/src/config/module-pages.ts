import type { ModuleId } from './modules'

export type AccessLevel = 'none' | 'read' | 'full'

export interface ModulePageConfig {
  id: string
  label: string
  description?: string
}

export interface UserModulePermission {
  level: AccessLevel
  pages: Record<string, AccessLevel>
}

export interface UserPermissions {
  modules: Record<string, UserModulePermission>
  is_manager: boolean
}

export const MODULE_PAGES: Record<ModuleId, ModulePageConfig[]> = {
  home: [
    { id: 'dashboard', label: 'Tableau de bord' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'subscriptions', label: 'Abonnement' },
    { id: 'settings', label: 'Paramètres' },
    { id: 'security', label: 'Sécurité & 2FA' },
  ],
  finance: [
    { id: 'dashboard', label: 'Vue d\'ensemble' },
    { id: 'accounts', label: 'Comptes' },
    { id: 'portfolios', label: 'Portefeuilles' },
    { id: 'expenses', label: 'Dépenses' },
    { id: 'incomes', label: 'Revenus' },
    { id: 'import', label: 'Import' },
    { id: 'budgets', label: 'Budgets' },
    { id: 'forecast', label: 'Trésorerie' },
    { id: 'scenarios', label: 'Scénarios' },
    { id: 'payment-planning', label: 'Échéancier' },
    { id: 'reporting', label: 'Rapports' },
    { id: 'categories', label: 'Catégories' },
    { id: 'suppliers', label: 'Fournisseurs' },
    { id: 'charts', label: 'Plan Comptable' },
    { id: 'tva', label: 'TVA & fiscalité' },
    { id: 'settings', label: 'Paramètres' },
  ],
  store: [
    { id: 'dashboard', label: 'Tableau de bord' },
    { id: 'orders', label: 'Commandes' },
    { id: 'products', label: 'Produits' },
    { id: 'categories', label: 'Catégories' },
    { id: 'attributes', label: 'Attributs' },
    { id: 'collections', label: 'Collections' },
    { id: 'bundles', label: 'Bundles' },
    { id: 'import-export', label: 'Import / Export' },
    { id: 'coupons', label: 'Codes Promo' },
    { id: 'flash-sales', label: 'Ventes Flash' },
    { id: 'featured', label: 'Produits Vedette' },
    { id: 'promo-banners', label: 'Bannières Promo' },
    { id: 'hero-slides', label: 'Hero Slides' },
    { id: 'marketing-popups', label: 'Popups Marketing' },
    { id: 'live-events', label: 'Live Shopping' },
    { id: 'trending-products', label: 'Produits Tendance' },
    { id: 'abandoned-carts', label: 'Paniers Abandonnés' },
    { id: 'reviews', label: 'Avis Clients' },
    { id: 'testimonials', label: 'Témoignages' },
    { id: 'loyalty', label: 'Programme Fidélité' },
    { id: 'faq', label: 'FAQ' },
    { id: 'static-pages', label: 'Pages Statiques' },
    { id: 'blog', label: 'Blog' },
    { id: 'menus', label: 'Menus Navigation' },
    { id: 'promo-messages', label: 'Messages Promo' },
    { id: 'trust-badges', label: 'Badges Confiance' },
    { id: 'themes', label: 'Thèmes' },
    { id: 'tickets', label: 'Tickets SAV' },
    { id: 'sales-reports', label: 'Rapports Ventes' },
    { id: 'stock-alerts', label: 'Alertes Stock' },
    { id: 'settings', label: 'Paramètres' },
  ],
  stock: [
    { id: 'dashboard', label: 'Vue d\'ensemble' },
    { id: 'inventory', label: 'Stock Global' },
    { id: 'physical-inventory', label: 'Inventaire Physique' },
    { id: 'reordering-rules', label: 'Réapprovisionnement' },
    { id: 'inventory-groups', label: 'Groupes Inventaire' },
    { id: 'moves', label: 'Mouvements' },
    { id: 'transfers', label: 'Transferts' },
    { id: 'warehouses', label: 'Entrepôts' },
    { id: 'locations', label: 'Emplacements' },
    { id: 'valuation', label: 'Valorisation' },
    { id: 'turnover', label: 'Rotation' },
    { id: 'warehouse-calendars', label: 'Calendriers' },
    { id: 'settings', label: 'Paramètres' },
  ],
  crm: [
    { id: 'dashboard', label: 'Vue d\'ensemble' },
    { id: 'pipeline', label: 'Pipeline' },
    { id: 'leads', label: 'Opportunités' },
    { id: 'customers', label: 'Clients' },
    { id: 'customer-categories', label: 'Catégories Clients' },
    { id: 'pricelists', label: 'Listes de Prix' },
    { id: 'invoices', label: 'Factures' },
    { id: 'payments', label: 'Paiements' },
    { id: 'settings', label: 'Paramètres' },
  ],
  marketing: [
    { id: 'dashboard', label: 'Vue d\'ensemble' },
    { id: 'email', label: 'Campagnes Email' },
    { id: 'email-templates', label: 'Templates Email' },
    { id: 'sms', label: 'Campagnes SMS' },
    { id: 'sms-templates', label: 'Templates SMS' },
    { id: 'lists', label: 'Listes de diffusion' },
    { id: 'settings', label: 'Paramètres' },
  ],
  hr: [
    { id: 'dashboard', label: 'Vue d\'ensemble' },
    { id: 'employees', label: 'Employés' },
    { id: 'departments', label: 'Départements' },
    { id: 'jobs', label: 'Postes' },
    { id: 'contracts', label: 'Contrats' },
    { id: 'attendance', label: 'Présences' },
    { id: 'leaves', label: 'Congés' },
    { id: 'leaves-calendar', label: 'Calendrier Congés' },
    { id: 'allocations', label: 'Allocations' },
    { id: 'leave-types', label: 'Types de Congés' },
    { id: 'appraisals', label: 'Entretiens' },
    { id: 'skills', label: 'Compétences' },
    { id: 'settings', label: 'Paramètres' },
  ],
  pos: [
    { id: 'dashboard', label: 'Vue d\'ensemble' },
    { id: 'terminal', label: 'Terminal' },
    { id: 'rush', label: 'Mode Rush' },
    { id: 'kiosk', label: 'Mode Kiosk' },
    { id: 'mobile', label: 'Mobile POS' },
    { id: 'kds', label: 'Écran Cuisine' },
    { id: 'customer-display', label: 'Écran Client' },
    { id: 'session-open', label: 'Ouvrir Session' },
    { id: 'orders', label: 'Commandes' },
    { id: 'sessions', label: 'Sessions' },
    { id: 'click-collect', label: 'Click & Collect' },
    { id: 'reports-sales', label: 'Ventes' },
    { id: 'reports-payments', label: 'Paiements' },
    { id: 'analytics', label: 'Analytics IA' },
    { id: 'settings-terminals', label: 'Terminaux' },
    { id: 'settings-payments', label: 'Paiements Config' },
    { id: 'settings-receipts', label: 'Tickets Config' },
    { id: 'settings', label: 'Paramètres' },
  ],
  support: [
    { id: 'dashboard', label: 'Vue d\'ensemble' },
    { id: 'tickets', label: 'Mes Tickets' },
    { id: 'new-ticket', label: 'Créer un Ticket' },
    { id: 'faq', label: 'FAQ' },
  ],
  maintenance: [
    { id: 'dashboard', label: 'Vue d\'ensemble' },
    { id: 'equipment', label: 'Équipements' },
    { id: 'equipment-critical', label: 'Équipements Critiques' },
    { id: 'requests', label: 'Demandes' },
    { id: 'emergency', label: 'Urgences' },
    { id: 'calendar', label: 'Planning' },
    { id: 'reports', label: 'KPI & Rapports' },
    { id: 'costs', label: 'Coûts' },
    { id: 'categories', label: 'Catégories' },
    { id: 'settings', label: 'Paramètres' },
  ],
}

export const ACCESS_LEVEL_LABELS: Record<AccessLevel, string> = {
  none: 'Aucun accès',
  read: 'Lecture seule',
  full: 'Accès complet',
}

export const MODULE_LABELS: Record<ModuleId, string> = {
  home: 'Accueil',
  finance: 'Finance',
  store: 'Boutique',
  stock: 'Stock',
  crm: 'CRM',
  marketing: 'Marketing',
  hr: 'RH',
  pos: 'Point de Vente',
  support: 'Support',
  maintenance: 'GMAO',
}
