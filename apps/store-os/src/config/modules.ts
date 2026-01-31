import {
  LayoutDashboard,
  Store,
  ShoppingCart,
  Package,
  Tag,
  Sliders,
  BookOpen,
  Gift,
  Download,
  Ticket,
  Timer,
  Sparkles,
  Image,
  Zap,
  Video,
  TrendingUp,
  Star,
  Quote,
  Heart,
  HelpCircle,
  FileText,
  FileEdit,
  List,
  MessageSquare,
  Award,
  HeadphonesIcon,
  BarChart3,
  AlertTriangle,
  Palette,
  Paintbrush,
  Upload,
  Settings,
  Megaphone,
  Users,
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

export type ModuleId = 'store' | 'marketing'

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
// STORE MODULE
// ============================================================================

export const STORE_MODULE: Module = {
  id: 'store',
  name: 'Boutique',
  shortName: 'Store',
  icon: Store,
  color: 'text-violet-600',
  bgColor: 'bg-violet-100 dark:bg-violet-900/30',
  description: 'E-commerce & Catalogue',
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
      title: 'Apparence',
      items: [
        { name: 'Thèmes', path: '/store/themes', icon: Palette },
        { name: 'Theme Builder', path: '/store/themes/builder', icon: Paintbrush },
        { name: 'Import Thèmes', path: '/store/themes/import', icon: Upload },
        { name: 'Marketplace', path: '/store/themes/marketplace', icon: Store },
      ],
    },
    {
      title: 'Configuration',
      items: [
        { name: 'Paramètres', path: '/store/settings', icon: Settings },
      ],
    },
  ],
}

// ============================================================================
// MARKETING MODULE
// ============================================================================

export const MARKETING_MODULE: Module = {
  id: 'marketing',
  name: 'Marketing',
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
}

export const MODULES: Module[] = [STORE_MODULE, MARKETING_MODULE]
