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
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

export type ModuleId = 'home' | 'finance' | 'store' | 'stock' | 'crm' | 'marketing' | 'hr' | 'pos' | 'support'

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
      {
        title: 'Configuration',
        items: [
          { name: 'Paramètres Généraux', path: '/settings', icon: Settings },
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
          { name: 'Attributs', path: '/store/attributes', icon: Sliders },
          { name: 'Collections', path: '/store/collections', icon: BookOpen },
          { name: 'Bundles / Packs', path: '/store/bundles', icon: Gift },
          { name: 'Import / Export', path: '/store/import-export', icon: Download },
        ],
      },
      {
        title: 'Promotions',
        items: [
          { name: 'Codes Promo', path: '/store/coupons', icon: Ticket },
          { name: 'Ventes Flash', path: '/store/flash-sales', icon: Timer },
          { name: 'Produits Vedette', path: '/store/featured', icon: Sparkles },
          { name: 'Bannières', path: '/store/promo-banners', icon: Image },
          { name: 'Hero Slides', path: '/store/hero-slides', icon: Image },
          { name: 'Popups Marketing', path: '/store/marketing-popups', icon: Zap },
          { name: 'Live Shopping', path: '/store/live-events', icon: Video },
          { name: 'Produits Tendance', path: '/store/trending-products', icon: TrendingUp },
        ],
      },
      {
        title: 'Engagement Client',
        items: [
          { name: 'Avis Clients', path: '/store/reviews', icon: Star },
          { name: 'Témoignages', path: '/store/testimonials', icon: Quote },
          { name: 'Programme Fidélité', path: '/store/loyalty', icon: Heart },
          { name: 'FAQ', path: '/store/faq', icon: HelpCircle },
        ],
      },
      {
        title: 'Contenu',
        items: [
          { name: 'Pages Statiques', path: '/store/static-pages', icon: FileText },
          { name: 'Blog / Articles', path: '/store/blog', icon: FileEdit },
          { name: 'Menus Navigation', path: '/store/menus', icon: List },
          { name: 'Messages Promo', path: '/store/promo-messages', icon: MessageSquare },
          { name: 'Badges Confiance', path: '/store/trust-badges', icon: Award },
        ],
      },
      {
        title: 'Support',
        items: [
          { name: 'Tickets SAV', path: '/store/tickets', icon: HeadphonesIcon },
        ],
      },
      {
        title: 'Rapports',
        items: [
          { name: 'Ventes', path: '/store/sales-reports', icon: BarChart3 },
          { name: 'Alertes Stock', path: '/store/stock-alerts', icon: AlertTriangle },
        ],
      },
      {
        title: 'Configuration',
        items: [
          { name: 'Thèmes', path: '/store/themes', icon: Palette },
          { name: 'Theme Builder', path: '/store/themes/builder', icon: Paintbrush },
          { name: 'Import Thèmes JSON', path: '/store/themes/import', icon: Upload },
          { name: 'Marketplace Thèmes', path: '/store/themes/marketplace', icon: Store },
          { name: 'Soumettre un Thème', path: '/store/themes/submit', icon: Upload },
          { name: 'Mes Soumissions', path: '/store/themes/my-submissions', icon: FileEdit },
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
        title: 'Campagnes',
        items: [
          { name: 'Toutes les campagnes', path: '/marketing/campaigns', icon: Megaphone },
          { name: 'Emails', path: '/marketing/email', icon: FileText },
          { name: 'SMS', path: '/marketing/sms', icon: MessageSquare },
          { name: 'Templates', path: '/marketing/email/templates', icon: FileText },
        ],
      },
      {
        title: 'Audiences',
        items: [
          { name: 'Listes de contacts', path: '/marketing/contacts', icon: Users },
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
        title: 'Temps & Présences',
        items: [
          { name: 'Présences', path: '/hr/attendance', icon: ClipboardList },
        ],
      },
      {
        title: 'Congés & Absences',
        items: [
          { name: 'Demandes', path: '/hr/leaves', icon: Calendar },
          { name: 'Calendrier', path: '/hr/leaves/calendar', icon: Calendar },
          { name: 'Allocations', path: '/hr/leaves/allocations', icon: PieChart },
          { name: 'Types de congés', path: '/hr/leaves/types', icon: Tag },
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
          { name: 'Tableau de bord', path: '/pos', icon: LayoutDashboard },
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
]
