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
        title: 'Tableau de bord',
        items: [
          { name: 'Vue d\'ensemble', path: '/finance', icon: LayoutDashboard },
        ],
      },
      {
        title: 'Comptes',
        items: [
          { name: 'Tous les comptes', path: '/finance/accounts', icon: Wallet },
          { name: 'Portefeuilles', path: '/finance/portfolios', icon: Briefcase },
        ],
      },
      {
        title: 'Transactions',
        items: [
          { name: 'Dépenses', path: '/finance/expenses', icon: ArrowDownCircle },
          { name: 'Revenus', path: '/finance/incomes', icon: ArrowUpCircle },
        ],
      },
      {
        title: 'Planification',
        items: [
          { name: 'Budgets', path: '/finance/budgets', icon: PieChart },
          { name: 'Trésorerie', path: '/finance/forecast', icon: TrendingUp },
          { name: 'Scénarios', path: '/finance/scenarios', icon: GitBranch },
          { name: 'Échéancier', path: '/finance/payment-planning', icon: Calendar },
        ],
      },
      {
        title: 'Rapports',
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
        items: [
          { name: 'Catégories', path: '/finance/categories', icon: Tag },
          { name: 'Fournisseurs', path: '/finance/suppliers', icon: Users },
          { name: 'Plan Comptable', path: '/finance/charts', icon: Coins },
          { name: 'Alertes', path: '/finance/alerts', icon: Bell },
          { name: 'Import', path: '/finance/import', icon: Upload },
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
        items: [
          { name: 'Vue d\'ensemble', path: '/store', icon: LayoutDashboard },
        ],
      },
      {
        title: 'Ventes',
        items: [
          { name: 'Commandes', path: '/store/orders', icon: ShoppingCart },
          { name: 'Paniers Abandonnés', path: '/store/abandoned-carts', icon: ShoppingCart },
        ],
      },
      {
        title: 'Catalogue',
        items: [
          { name: 'Produits', path: '/store/products', icon: Package },
          { name: 'Catégories', path: '/store/categories', icon: Tag },
        ],
      },
      {
        title: 'Promotions',
        items: [
          { name: 'Codes Promo', path: '/store/coupons', icon: Ticket },
          { name: 'Produits Vedette', path: '/store/featured', icon: Sparkles },
          { name: 'Bannières', path: '/store/promo-banners', icon: Image },
          { name: 'Hero Slides', path: '/store/hero-slides', icon: Image },
          { name: 'Popups Marketing', path: '/store/marketing-popups', icon: Zap },
        ],
      },
      {
        title: 'Contenu',
        items: [
          { name: 'Pages Statiques', path: '/store/static-pages', icon: FileText },
          { name: 'Menus Navigation', path: '/store/menus', icon: List },
          { name: 'Messages Promo', path: '/store/promo-messages', icon: MessageSquare },
          { name: 'Badges Confiance', path: '/store/trust-badges', icon: Award },
        ],
      },
      {
        title: 'Configuration',
        items: [
          { name: 'Ma Boutique', path: '/store/my-shop', icon: Store },
          { name: 'Livraison', path: '/store/delivery', icon: Truck },
          { name: 'SEO', path: '/store/seo-metadata', icon: Globe },
          { name: 'Paramètres', path: '/store/settings', icon: Settings },
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
        title: 'Analyse',
        items: [
          { name: 'Valorisation', path: '/stock/valuation', icon: Layers },
          { name: 'Rotation', path: '/stock/turnover', icon: Shuffle },
        ],
      },
      {
        title: 'Configuration',
        items: [
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
