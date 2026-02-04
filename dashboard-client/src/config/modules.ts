import {
  Home,
  LayoutDashboard,
  BarChart3,
  Wallet,
  PieChart,
  TrendingUp,
  Coins,
  FolderOpen,
  Users,
  Mail,
  Bell,
  Calendar,
  Upload,
  Archive,
  Settings,
  ShieldCheck,
  Store,
  ShoppingCart,
  Package,
  Tag,
  Sparkles,
  Ticket,
  Image,
  Truck,
  FileText,
  List,
  MessageSquare,
  Award,
  Zap,
  Boxes,
  ClipboardList,
  ArrowRightLeft,
  Warehouse,
  MapPin,
  RefreshCw,
  Layers,
  Shuffle,
  UserCircle,
  Kanban,
  Target,
  Receipt,
  BadgePercent,
  Megaphone,
  UsersRound,
  Briefcase,
  ArrowDownCircle,
  ArrowUpCircle,
  GitBranch,
  Waves,
  CreditCard,
  // POS Icons
  Monitor,
  PlayCircle,
  Clock,
  Banknote,
  Printer,
  ScanBarcode,
  // Store Extended Icons
  Video,
  ChefHat,
  Star,
  HelpCircle,
  BookOpen,
  Timer,
  Gift,
  Quote,
  FileEdit,
  Heart,
  HeadphonesIcon,
  AlertTriangle,
  Sliders,
  Download,
  Palette,
  Paintbrush,
  FolderKanban,
  LayoutGrid,
  // Maintenance Icons
  Wrench,
  BarChart2,
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

export type ModuleId = 'home' | 'finance' | 'store' | 'stock' | 'crm' | 'marketing' | 'hr' | 'pos' | 'support' | 'maintenance'

export interface SubMenuItem {
  name: string
  path?: string
  badge?: string
  separator?: boolean
  icon?: React.ComponentType<{ className?: string }>
}

export interface MenuItem {
  name: string
  path?: string
  icon: React.ComponentType<{ className?: string }>
  subItems?: SubMenuItem[]
}

export interface MenuSection {
  title: string
  items: MenuItem[]
  tabGroup?: string
}

export interface Module {
  id: ModuleId
  name: string
  shortName: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  description: string
  basePath: string
  sections: MenuSection[]
}

// ============================================================================
// MODULE DEFINITIONS
// ============================================================================

export const MODULES: Module[] = [
  {
    id: 'home',
    name: 'Accueil',
    shortName: 'Accueil',
    icon: Home,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 dark:bg-gray-700',
    description: 'Vue d\'ensemble',
    basePath: '/dashboard',
    sections: [
      {
        title: 'Tableau de bord',
        tabGroup: 'Tableau de bord',
        items: [
          { name: 'Vue d\'ensemble', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Analytics', path: '/analytics', icon: BarChart3 },
        ],
      },
      {
        title: 'Abonnement',
        tabGroup: 'Abonnement',
        items: [
          { name: 'Mon abonnement', path: '/dashboard/subscriptions', icon: CreditCard },
        ],
      },
      {
        title: 'Configuration',
        tabGroup: 'Paramètres',
        items: [
          { name: 'Paramètres Généraux', path: '/settings', icon: Settings },
          { name: 'Sécurité & 2FA', path: '/settings/security', icon: ShieldCheck },
          { name: 'Équipe', path: '/settings/team', icon: Users },
        ],
      },
    ],
  },
  {
    id: 'finance',
    name: 'Finance',
    shortName: 'Finance',
    icon: Wallet,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    description: 'Trésorerie & Budgets',
    basePath: '/finance',
    sections: [
      {
        title: 'Tableau de bord',
        tabGroup: 'Tableau de bord',
        items: [
          { name: 'Vue d\'ensemble', path: '/finance', icon: LayoutDashboard },
        ],
      },
      {
        title: 'Facturation',
        tabGroup: 'Facturation',
        items: [
          { name: 'Factures', path: '/finance/invoices', icon: Receipt },
          { name: 'Facture Express', path: '/finance/invoices/quick', icon: Zap },
          { name: 'OCR Fournisseurs', path: '/finance/invoices/ocr', icon: Upload },
          { name: 'Abonnements', path: '/finance/subscriptions', icon: RefreshCw },
          { name: 'Approbations', path: '/finance/approvals', icon: ShieldCheck },
        ],
      },
      {
        title: 'Analytique',
        tabGroup: 'Analytique',
        items: [
          { name: 'Prévisionnel CA', path: '/finance/analytics/forecast', icon: TrendingUp },
          { name: 'Risques Paiement', path: '/finance/payment-risk', icon: AlertTriangle },
          { name: 'Compta Analytique', path: '/finance/analytics/analytic-accounts', icon: PieChart },
          { name: 'Rapprochement Bancaire', path: '/finance/bank/reconcile', icon: ArrowRightLeft },
        ],
      },
      {
        title: 'Comptes',
        tabGroup: 'Comptes',
        items: [
          { name: 'Tous les comptes', path: '/finance/accounts', icon: Wallet },
          { name: 'Portefeuilles', path: '/finance/portfolios', icon: Briefcase },
        ],
      },
      {
        title: 'Transactions',
        tabGroup: 'Transactions',
        items: [
          { name: 'Dépenses', path: '/finance/expenses', icon: ArrowDownCircle },
          { name: 'Revenus', path: '/finance/incomes', icon: ArrowUpCircle },
          { name: 'Import', path: '/finance/import', icon: Upload },
        ],
      },
      {
        title: 'Planification',
        tabGroup: 'Planification',
        items: [
          { name: 'Budgets', path: '/finance/budgets', icon: PieChart },
          { name: 'Trésorerie', path: '/finance/forecast', icon: TrendingUp },
          { name: 'Scénarios', path: '/finance/scenarios', icon: GitBranch },
          { name: 'Échéancier', path: '/finance/payment-planning', icon: Calendar },
        ],
      },
      {
        title: 'Rapports',
        tabGroup: 'Rapports',
        items: [
          { name: 'Hub Rapports', path: '/finance/reporting', icon: BarChart3 },
          { name: 'Trésorerie', path: '/finance/reporting/cashflow', icon: Waves },
          { name: 'Par catégorie', path: '/finance/reporting/by-category', icon: FolderOpen },
          { name: 'Par compte', path: '/finance/reporting/by-account', icon: CreditCard },
          { name: 'Rentabilité', path: '/finance/reporting/profitability', icon: TrendingUp },
        ],
      },
      {
        title: 'Configuration',
        tabGroup: 'Configuration',
        items: [
          { name: 'Catégories', path: '/finance/categories', icon: Tag },
          { name: 'Fournisseurs', path: '/finance/suppliers', icon: Users },
          { name: 'Plan Comptable', path: '/finance/charts', icon: Coins },
          { name: 'TVA & fiscalité', path: '/settings/tva', icon: Receipt },
          { name: 'Devises', path: '/finance/settings/currencies', icon: Coins },
          { name: 'Export FEC', path: '/finance/settings/export-fec', icon: Download },
          { name: 'Flux de paiement', path: '/finance/settings/flux', icon: CreditCard },
          { name: 'Notifications', path: '/finance/settings/notifications', icon: Mail },
          { name: 'Alertes', path: '/finance/alerts', icon: Bell },
          { name: 'Archives', path: '/finance/archives', icon: Archive },
          { name: 'Paramètres', path: '/finance/settings', icon: Settings },
        ],
      },
    ],
  },
  {
    id: 'store',
    name: 'Boutique',
    shortName: 'Boutique',
    icon: Store,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
    description: 'E-commerce',
    basePath: '/store',
    sections: [
      {
        title: 'Tableau de bord',
        tabGroup: 'Tableau de bord',
        items: [
          { name: 'Vue d\'ensemble', path: '/store', icon: LayoutDashboard },
        ],
      },
      {
        title: 'Homepage',
        items: [
          { name: 'Gestionnaire Homepage', path: '/store/homepage-builder', icon: LayoutGrid },
        ],
      },
      {
        title: 'Catalogue',
        tabGroup: 'Catalogue',
        items: [
          { name: 'Produits', path: '/store/catalog/products', icon: Package },
          { name: 'Catégories', path: '/store/catalog/categories', icon: Tag },
          { name: 'Collections', path: '/store/catalog/collections', icon: BookOpen },
          { name: 'Attributs', path: '/store/catalog/attributes', icon: Sliders },
          { name: 'Bundles', path: '/store/catalog/bundles', icon: Gift },
          { name: 'Import / Export', path: '/store/catalog/import-export', icon: Download },
        ],
      },
      {
        title: 'Commandes',
        tabGroup: 'Commandes',
        items: [
          { name: 'Toutes les commandes', path: '/store/orders', icon: ShoppingCart },
          { name: 'Paniers Abandonnés', path: '/store/orders/abandoned-carts', icon: ShoppingCart },
        ],
      },
      {
        title: 'Marketing',
        tabGroup: 'Marketing',
        items: [
          { name: 'Codes Promo', path: '/store/marketing/coupons', icon: Ticket },
          { name: 'Ventes Flash', path: '/store/marketing/flash-sales', icon: Timer },
          { name: 'Produits Vedette', path: '/store/marketing/featured', icon: Sparkles },
          { name: 'Produits Tendance', path: '/store/marketing/trending', icon: TrendingUp },
          { name: 'Bannières Promo', path: '/store/marketing/banners', icon: Image },
          { name: 'Popups', path: '/store/marketing/popups', icon: Zap },
          { name: 'Messages Promo', path: '/store/marketing/messages', icon: MessageSquare },
          { name: 'Newsletter', path: '/store/marketing/newsletter/campaigns', icon: Mail },
        ],
      },
      {
        title: 'Contenu',
        tabGroup: 'Contenu',
        items: [
          { name: 'Hero Slides', path: '/store/content/hero-slides', icon: Image },
          { name: 'Avis Clients', path: '/store/content/reviews', icon: Star },
          { name: 'Témoignages', path: '/store/content/testimonials', icon: Quote },
          { name: 'Programme Fidélité', path: '/store/content/loyalty', icon: Heart },
          { name: 'FAQ', path: '/store/content/faq', icon: HelpCircle },
          { name: 'Pages Statiques', path: '/store/content/pages', icon: FileText },
          { name: 'Blog', path: '/store/content/blog', icon: FileEdit },
          { name: 'Menus', path: '/store/content/menus', icon: List },
          { name: 'Badges Confiance', path: '/store/content/trust-badges', icon: Award },
          { name: 'Live Shopping', path: '/store/content/live-events', icon: Video },
        ],
      },
      {
        title: 'Thèmes',
        tabGroup: 'Thèmes',
        items: [
          { name: 'Mes Thèmes', path: '/store/themes', icon: Palette },
          { name: 'Theme Builder', path: '/store/themes/builder', icon: Paintbrush },
          { name: 'Marketplace', path: '/store/themes/marketplace', icon: Store },
          { name: 'Import JSON', path: '/store/themes/import', icon: Upload },
        ],
      },
      {
        title: 'Paramètres',
        items: [
          { name: 'Vue d\'ensemble', path: '/store/settings', icon: Settings },
        ],
      },
      {
        title: 'Rapports & Support',
        tabGroup: 'Rapports',
        items: [
          { name: 'Rapports Ventes', path: '/store/reports/sales', icon: BarChart3 },
          { name: 'Alertes Stock', path: '/store/reports/stock-alerts', icon: AlertTriangle },
        ],
      },
    ],
  },
  {
    id: 'stock',
    name: 'Stock',
    shortName: 'Stock',
    icon: Boxes,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    description: 'Inventaire',
    basePath: '/stock',
    sections: [
      {
        title: 'Tableau de bord',
        items: [
          { name: 'Vue d\'ensemble', path: '/stock', icon: LayoutDashboard },
        ],
      },
      {
        title: 'Stock',
        items: [
          { name: 'Stock Global', path: '/stock/inventory', icon: Boxes },
          { name: 'Inventaire Physique', path: '/inventory', icon: ClipboardList },
          { name: 'Règles Réapprovisionnement', path: '/stock/reordering-rules', icon: RefreshCw },
          { name: 'Groupes Inventaire', path: '/stock/inventory-groups', icon: FolderKanban },
        ],
      },
      {
        title: 'Logistique',
        items: [
          { name: 'Mouvements', path: '/stock/moves', icon: ArrowRightLeft },
          { name: 'Transferts', path: '/stock/transfers', icon: Truck },
          { name: 'Entrepôts', path: '/warehouses', icon: Warehouse },
          { name: 'Emplacements', path: '/stock/locations', icon: MapPin },
        ],
      },
      {
        title: 'Analyse',
        items: [
          { name: 'Valorisation', path: '/stock/valuation', icon: Layers },
          { name: 'Rotation', path: '/stock/turnover', icon: Shuffle },
        ],
      },
      {
        title: 'Configuration',
        items: [
          { name: 'Calendriers Entrepôts', path: '/stock/warehouse-calendars', icon: Calendar },
          { name: 'Paramètres', path: '/stock/settings', icon: Settings },
        ],
      },
    ],
  },
  {
    id: 'crm',
    name: 'CRM',
    shortName: 'CRM',
    icon: UserCircle,
    color: 'text-violet-600',
    bgColor: 'bg-violet-100 dark:bg-violet-900/30',
    description: 'Clients & Ventes',
    basePath: '/crm',
    sections: [
      {
        title: 'Tableau de bord',
        items: [
          { name: 'Vue d\'ensemble', path: '/crm', icon: LayoutDashboard },
        ],
      },
      {
        title: 'Pipeline',
        items: [
          { name: 'Pipeline', path: '/crm/pipeline', icon: Kanban },
          { name: 'Opportunités', path: '/crm/leads', icon: Target },
        ],
      },
      {
        title: 'Clients',
        items: [
          { name: 'Clients', path: '/crm/customers', icon: UserCircle },
          { name: 'Catégories Clients', path: '/crm/customer-categories', icon: Tag },
          { name: 'Listes de Prix', path: '/pricelists', icon: ClipboardList },
        ],
      },
      {
        title: 'Ventes',
        items: [
          { name: 'Devis', path: '/sales/quotes', icon: FileEdit },
          { name: 'Factures', path: '/invoices', icon: Receipt },
          { name: 'Paiements', path: '/payments', icon: BadgePercent },
        ],
      },
      {
        title: 'Configuration',
        items: [
          { name: 'Paramètres', path: '/crm/settings', icon: Settings },
        ],
      },
    ],
  },
  {
    id: 'marketing',
    name: 'Quelyos Marketing',
    shortName: 'Marketing',
    icon: Megaphone,
    color: 'text-pink-600',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
    description: 'Campagnes Email & SMS',
    basePath: '/marketing',
    sections: [
      {
        title: 'Tableau de bord',
        items: [
          { name: 'Vue d\'ensemble', path: '/marketing', icon: LayoutDashboard },
        ],
      },
      {
        title: 'Emails',
        items: [
          { name: 'Campagnes Email', path: '/marketing/email', icon: Mail },
          { name: 'Templates Email', path: '/marketing/email/templates', icon: FileText },
        ],
      },
      {
        title: 'SMS',
        items: [
          { name: 'Campagnes SMS', path: '/marketing/sms', icon: MessageSquare },
          { name: 'Templates SMS', path: '/marketing/sms/templates', icon: FileText },
        ],
      },
      {
        title: 'Audiences',
        items: [
          { name: 'Listes de diffusion', path: '/marketing/lists', icon: Users },
        ],
      },
      {
        title: 'Configuration',
        items: [
          { name: 'Paramètres', path: '/marketing/settings', icon: Settings },
        ],
      },
    ],
  },
  {
    id: 'hr',
    name: 'RH',
    shortName: 'RH',
    icon: UsersRound,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
    description: 'Ressources Humaines',
    basePath: '/hr',
    sections: [
      {
        title: 'Tableau de bord',
        items: [
          { name: 'Vue d\'ensemble', path: '/hr', icon: LayoutDashboard },
        ],
      },
      {
        title: 'Personnel',
        items: [
          { name: 'Employés', path: '/hr/employees', icon: UsersRound },
          { name: 'Départements', path: '/hr/departments', icon: Boxes },
          { name: 'Postes', path: '/hr/jobs', icon: Briefcase },
          { name: 'Contrats', path: '/hr/contracts', icon: FileText },
        ],
      },
      {
        title: 'Temps & Congés',
        items: [
          { name: 'Présences', path: '/hr/attendance', icon: ClipboardList },
          { name: 'Demandes de Congés', path: '/hr/leaves', icon: Calendar },
          { name: 'Calendrier', path: '/hr/leaves/calendar', icon: Calendar },
          { name: 'Allocations', path: '/hr/leaves/allocations', icon: PieChart },
          { name: 'Types de Congés', path: '/hr/leaves/types', icon: Tag },
        ],
      },
      {
        title: 'Évaluations',
        items: [
          { name: 'Entretiens', path: '/hr/appraisals', icon: ClipboardList },
          { name: 'Compétences', path: '/hr/skills', icon: Award },
        ],
      },
      {
        title: 'Configuration',
        items: [
          { name: 'Paramètres', path: '/hr/settings', icon: Settings },
        ],
      },
    ],
  },
  {
    id: 'support',
    name: 'Support',
    shortName: 'Support',
    icon: HeadphonesIcon,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    description: 'Assistance et tickets',
    basePath: '/support',
    sections: [
      {
        title: 'Tableau de bord',
        items: [
          { name: 'Vue d\'ensemble', path: '/support', icon: LayoutDashboard },
        ],
      },
      {
        title: 'Assistance',
        items: [
          { name: 'Mes Tickets', path: '/support/tickets', icon: MessageSquare },
          { name: 'Créer un Ticket', path: '/support/tickets/new', icon: FileEdit },
          { name: 'FAQ', path: '/support/faq', icon: HelpCircle },
        ],
      },
    ],
  },
  {
    id: 'pos',
    name: 'Point de Vente',
    shortName: 'POS',
    icon: Monitor,
    color: 'text-teal-600',
    bgColor: 'bg-teal-100 dark:bg-teal-900/30',
    description: 'Caisse & Ventes terrain',
    basePath: '/pos',
    sections: [
      {
        title: 'Tableau de bord',
        items: [
          { name: 'Vue d\'ensemble', path: '/pos', icon: LayoutDashboard },
        ],
      },
      {
        title: 'Caisse',
        items: [
          { name: 'Terminal', path: '/pos/terminal', icon: Monitor },
          { name: 'Mode Rush', path: '/pos/rush', icon: Zap },
          { name: 'Mode Kiosk', path: '/pos/kiosk', icon: ScanBarcode },
          { name: 'Mobile POS', path: '/pos/mobile', icon: Monitor },
          { name: 'Écran Cuisine', path: '/pos/kds', icon: ChefHat },
          { name: 'Écran Client', path: '/pos/customer-display', icon: Monitor },
          { name: 'Ouvrir Session', path: '/pos/session/open', icon: PlayCircle },
        ],
      },
      {
        title: 'Gestion',
        items: [
          { name: 'Commandes', path: '/pos/orders', icon: ClipboardList },
          { name: 'Sessions', path: '/pos/sessions', icon: Clock },
          { name: 'Click & Collect', path: '/pos/click-collect', icon: Package },
        ],
      },
      {
        title: 'Rapports',
        items: [
          { name: 'Ventes', path: '/pos/reports/sales', icon: BarChart3 },
          { name: 'Paiements', path: '/pos/reports/payments', icon: CreditCard },
          { name: 'Analytics IA', path: '/pos/analytics', icon: Sparkles },
        ],
      },
      {
        title: 'Configuration',
        items: [
          { name: 'Terminaux', path: '/pos/settings/terminals', icon: Monitor },
          { name: 'Paiements', path: '/pos/settings/payments', icon: Banknote },
          { name: 'Tickets', path: '/pos/settings/receipts', icon: Printer },
          { name: 'Paramètres', path: '/pos/settings', icon: Settings },
        ],
      },
    ],
  },
  {
    id: 'maintenance',
    name: 'GMAO',
    shortName: 'GMAO',
    icon: Wrench,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    description: 'Gestion Maintenance',
    basePath: '/maintenance',
    sections: [
      {
        title: 'Tableau de bord',
        tabGroup: 'Tableau de bord',
        items: [
          { name: 'Vue d\'ensemble', path: '/maintenance', icon: LayoutDashboard },
        ],
      },
      {
        title: 'Équipements',
        tabGroup: 'Équipements',
        items: [
          { name: 'Liste Équipements', path: '/maintenance/equipment', icon: Wrench },
          { name: 'Équipements Critiques', path: '/maintenance/equipment/critical', icon: AlertTriangle },
        ],
      },
      {
        title: 'Interventions',
        tabGroup: 'Interventions',
        items: [
          { name: 'Demandes', path: '/maintenance/requests', icon: ClipboardList },
          { name: 'Urgences', path: '/maintenance/requests/emergency', icon: Bell },
          { name: 'Planning', path: '/maintenance/calendar', icon: Calendar },
        ],
      },
      {
        title: 'Analyse',
        tabGroup: 'Analyse',
        items: [
          { name: 'KPI & Rapports', path: '/maintenance/reports', icon: BarChart2 },
          { name: 'Coûts Maintenance', path: '/maintenance/costs', icon: Coins },
        ],
      },
      {
        title: 'Configuration',
        tabGroup: 'Configuration',
        items: [
          { name: 'Catégories', path: '/maintenance/categories', icon: Tag },
          { name: 'Paramètres', path: '/maintenance/settings', icon: Settings },
        ],
      },
    ],
  },
]
