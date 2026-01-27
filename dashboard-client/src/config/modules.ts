import {
  Home,
  LayoutDashboard,
  BarChart3,
  Wallet,
  ArrowLeftRight,
  PieChart,
  TrendingUp,
  Coins,
  FolderOpen,
  Users,
  Bell,
  Calendar,
  Upload,
  Archive,
  Settings,
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
  Globe,
  Zap,
  Boxes,
  ClipboardList,
  ArrowRightLeft,
  Warehouse,
  MapPin,
  RefreshCw,
  ClipboardCheck,
  Lock,
  Layers,
  Shuffle,
  UserCircle,
  Kanban,
  Target,
  Receipt,
  BadgePercent,
  Megaphone,
  UsersRound,
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

export type ModuleId = 'home' | 'finance' | 'store' | 'stock' | 'crm' | 'marketing' | 'hr'

export interface SubMenuItem {
  name: string
  path?: string
  badge?: string
  separator?: boolean
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
        items: [
          { name: 'Vue d\'ensemble', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Analytics', path: '/analytics', icon: BarChart3 },
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
        title: 'Principal',
        items: [
          { name: 'Tableau de bord', path: '/finance', icon: LayoutDashboard },
          {
            name: 'Comptes',
            icon: Wallet,
            subItems: [
              { name: 'Tous les comptes', path: '/finance/accounts' },
              { name: 'Portefeuilles', path: '/finance/portfolios' },
            ],
          },
          {
            name: 'Transactions',
            icon: ArrowLeftRight,
            subItems: [
              { name: 'Toutes', path: '/finance/transactions' },
              { name: 'Dépenses', path: '/finance/expenses' },
              { name: 'Revenus', path: '/finance/incomes' },
            ],
          },
          { name: 'Budgets', path: '/finance/budgets', icon: PieChart },
          {
            name: 'Prévisions',
            icon: TrendingUp,
            subItems: [
              { name: 'Trésorerie', path: '/finance/forecast' },
              { name: 'Scénarios', path: '/finance/scenarios', badge: 'Nouveau' },
            ],
          },
          {
            name: 'Rapports',
            icon: BarChart3,
            subItems: [
              { name: 'Tableau de bord', separator: true },
              { name: 'Hub', path: '/finance/reporting' },
              { name: 'Vue d\'ensemble', path: '/finance/reporting/overview' },
              { name: 'Trésorerie', separator: true },
              { name: 'Trésorerie', path: '/finance/reporting/cashflow' },
              { name: 'Prévisions', path: '/finance/reporting/forecast' },
              { name: 'Analyses prév.', path: '/finance/reporting/forecasts' },
              { name: 'Analyses', separator: true },
              { name: 'Par catégorie', path: '/finance/reporting/by-category' },
              { name: 'Par flux', path: '/finance/reporting/by-flow' },
              { name: 'Par compte', path: '/finance/reporting/by-account' },
              { name: 'Par portefeuille', path: '/finance/reporting/by-portfolio' },
              { name: 'Indicateurs', separator: true },
              { name: 'Rentabilité', path: '/finance/reporting/profitability' },
              { name: 'EBITDA', path: '/finance/reporting/ebitda' },
              { name: 'DSO', path: '/finance/reporting/dso' },
              { name: 'BFR', path: '/finance/reporting/bfr' },
              { name: 'Point mort', path: '/finance/reporting/breakeven' },
              { name: 'Qualité', separator: true },
              { name: 'Qualité données', path: '/finance/reporting/data-quality' },
            ],
          },
          { name: 'Plan Comptable', path: '/finance/charts', icon: Coins },
        ],
      },
      {
        title: 'Configuration',
        items: [
          { name: 'Catégories', path: '/finance/categories', icon: FolderOpen },
          { name: 'Fournisseurs', path: '/finance/suppliers', icon: Users },
          { name: 'Alertes', path: '/finance/alerts', icon: Bell },
          { name: 'Planification', path: '/finance/payment-planning', icon: Calendar },
          { name: 'Import', path: '/finance/import', icon: Upload },
          { name: 'Archives', path: '/finance/archives', icon: Archive },
          {
            name: 'Paramètres',
            icon: Settings,
            subItems: [
              { name: 'Général', path: '/finance/settings' },
              { name: 'Catégories', path: '/finance/settings/categories' },
              { name: 'Devise', path: '/finance/settings/devise' },
              { name: 'Flux', path: '/finance/settings/flux' },
              { name: 'TVA', path: '/finance/settings/tva' },
              { name: 'Facturation', path: '/finance/settings/billing' },
              { name: 'Notifications', path: '/finance/settings/notifications' },
              { name: 'Intégrations', path: '/finance/settings/integrations' },
              { name: 'Sécurité', path: '/finance/settings/security' },
            ],
          },
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
        title: 'Gestion',
        items: [
          { name: 'Ma Boutique', path: '/store/my-shop', icon: Store },
          { name: 'Commandes', path: '/store/orders', icon: ShoppingCart },
          { name: 'Produits', path: '/store/products', icon: Package },
          { name: 'Catégories', path: '/store/categories', icon: Tag },
          { name: 'Paniers Abandonnés', path: '/store/abandoned-carts', icon: ShoppingCart },
        ],
      },
      {
        title: 'Marketing',
        items: [
          { name: 'Produits Vedette', path: '/store/featured', icon: Sparkles },
          { name: 'Codes Promo', path: '/store/coupons', icon: Ticket },
          { name: 'Bannières', path: '/store/promo-banners', icon: Image },
          { name: 'Hero Slides', path: '/store/hero-slides', icon: Image },
        ],
      },
      {
        title: 'Configuration',
        items: [
          { name: 'Livraison', path: '/store/delivery', icon: Truck },
          { name: 'Configuration Site', path: '/store/site-config', icon: Settings },
          { name: 'Pages Statiques', path: '/store/static-pages', icon: FileText },
          { name: 'Menus Navigation', path: '/store/menus', icon: List },
          { name: 'Messages Promo', path: '/store/promo-messages', icon: MessageSquare },
          { name: 'Badges Confiance', path: '/store/trust-badges', icon: Award },
          { name: 'SEO Métadonnées', path: '/store/seo-metadata', icon: Globe },
          { name: 'Popups Marketing', path: '/store/marketing-popups', icon: Zap },
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
        title: 'Inventaire',
        items: [
          { name: 'Stock', path: '/stock', icon: Boxes },
          { name: 'Inventaire Physique', path: '/inventory', icon: ClipboardList },
          { name: 'Mouvements', path: '/stock/moves', icon: ArrowRightLeft },
          { name: 'Transferts', path: '/stock/transfers', icon: Truck },
          { name: 'Entrepôts', path: '/warehouses', icon: Warehouse },
          { name: 'Emplacements', path: '/stock/locations', icon: MapPin },
          { name: 'Règles Réapprovisionnement', path: '/stock/reordering-rules', icon: RefreshCw },
        ],
      },
      {
        title: 'Fonctionnalités OCA',
        items: [
          { name: 'Raisons Changement Stock', path: '/stock/change-reasons', icon: FileText },
          { name: 'Inventaires OCA', path: '/stock/inventories-oca', icon: ClipboardCheck },
          { name: 'Verrouillage Emplacements', path: '/stock/location-locks', icon: Lock },
        ],
      },
      {
        title: 'Analyse',
        items: [
          { name: 'Valorisation', path: '/stock/valuation', icon: Layers },
          { name: 'Rotation', path: '/stock/turnover', icon: Shuffle },
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
        title: 'Facturation',
        items: [
          { name: 'Factures', path: '/invoices', icon: Receipt },
          { name: 'Paiements', path: '/payments', icon: BadgePercent },
        ],
      },
    ],
  },
  {
    id: 'marketing',
    name: 'Marketing',
    shortName: 'Marketing',
    icon: Megaphone,
    color: 'text-pink-600',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
    description: 'Campagnes & Analytics',
    basePath: '/marketing',
    sections: [
      {
        title: 'Campagnes',
        items: [
          { name: 'Tableau de bord', path: '/marketing', icon: LayoutDashboard },
          { name: 'Emails', path: '/marketing/emails', icon: FileText },
          { name: 'SMS', path: '/marketing/sms', icon: Megaphone },
        ],
      },
      {
        title: 'Automatisation',
        items: [
          { name: 'Workflows', path: '/marketing/workflows', icon: ArrowRightLeft },
          { name: 'Segments', path: '/marketing/segments', icon: Users },
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
    description: 'Employés & Paie',
    basePath: '/hr',
    sections: [
      {
        title: 'Personnel',
        items: [
          { name: 'Employés', path: '/hr/employees', icon: UsersRound },
          { name: 'Départements', path: '/hr/departments', icon: Boxes },
          { name: 'Contrats', path: '/hr/contracts', icon: FileText },
        ],
      },
      {
        title: 'Temps & Absences',
        items: [
          { name: 'Congés', path: '/hr/leaves', icon: Calendar },
          { name: 'Présences', path: '/hr/attendance', icon: ClipboardList },
        ],
      },
    ],
  },
]
