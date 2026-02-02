/**
 * Helper pour récupérer les plans tarifaires depuis l'API backend.
 * Utilisé en SSR (server components) avec revalidation ISR.
 * Fallback statique si l'API est indisponible.
 *
 * Supporte le nouveau système modulaire (base + modules + solutions + user_packs)
 * ET l'ancien format (suite/finance/ecommerce) pour backward compat.
 */

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8069'

// ═══════════════════════════════════════════════════════════════════════════
// INTERFACES — Nouveau système modulaire
// ═══════════════════════════════════════════════════════════════════════════

export interface ModulePlan {
  key: string
  name: string
  price: number
  annualPrice: number
  description: string
  icon: string
  color: string
  features: string[]
  limits?: {
    name: string
    included: number
    surplusPrice: number
    surplusUnit: number
  }
}

export interface SolutionPlan {
  id: string
  name: string
  slug: string
  price: number
  annualPrice: number
  description: string
  icon: string
  color: string
  features: string[]
  modules: string[]
  modulesValue: number
  savings: number
}

export interface PricingGrid {
  base: {
    price: number
    annualPrice: number
    usersIncluded: number
    freeModuleChoice: boolean
    trialDays: number
    yearlyDiscountPct: number
  }
  modules: ModulePlan[]
  solutions: SolutionPlan[]
  userPacks: {
    size: number
    price: number
    annualPrice: number
  }
  enterprise: {
    features: string[]
    cta: string
    href: string
  }
  allInDiscount?: {
    regularTotal: number
    discountedPrice: number
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// INTERFACE — Ancien format (backward compat)
// ═══════════════════════════════════════════════════════════════════════════

export interface PricingPlan {
  id: string
  name: string
  description: string
  price: number
  originalPrice: number | null
  period: string
  annualPrice: number | null
  yearlyDiscountPct: number
  highlight: boolean
  badge: string | null
  cta: string
  href: string
  icon: string
  color: 'emerald' | 'indigo' | 'amber' | 'violet'
  features: string[]
  limits: {
    users: number
    products: number
    ordersPerYear: number
  }
  trialDays: number
  planType: string
}

// ═══════════════════════════════════════════════════════════════════════════
// FETCH — Nouvelle grille tarifaire modulaire
// ═══════════════════════════════════════════════════════════════════════════

export async function fetchPricingGrid(): Promise<PricingGrid | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/public/pricing`, {
      next: { revalidate: 300 },
      headers: { 'Accept': 'application/json' },
    })

    if (!res.ok) throw new Error(`API returned ${res.status}`)

    const data = await res.json()
    if (data.success && data.data) {
      return data.data as PricingGrid
    }
    throw new Error('Invalid response format')
  } catch (_err) {
    return null
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FETCH — Ancien format (backward compat)
// ═══════════════════════════════════════════════════════════════════════════

export async function fetchPlans(planType?: string): Promise<PricingPlan[]> {
  try {
    const params = planType ? `?plan_type=${planType}` : ''
    const res = await fetch(`${BACKEND_URL}/api/public/plans${params}`, {
      next: { revalidate: 300 },
      headers: { 'Accept': 'application/json' },
    })

    if (!res.ok) {
      throw new Error(`API returned ${res.status}`)
    }

    const data = await res.json()
    if (data.success && Array.isArray(data.data)) {
      return data.data
    }
    throw new Error('Invalid response format')
  } catch (_err) {
    return []
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FALLBACK STATIQUE — Grille modulaire si API indisponible
// ═══════════════════════════════════════════════════════════════════════════

export const FALLBACK_PRICING_GRID: PricingGrid = {
  base: {
    price: 9,
    annualPrice: 7,
    usersIncluded: 5,
    freeModuleChoice: true,
    trialDays: 30,
    yearlyDiscountPct: 22,
  },
  modules: [
    { key: 'finance', name: 'Finance', price: 9, annualPrice: 7, description: 'Trésorerie, budgets, prévisions, export FEC', icon: 'Wallet', color: 'emerald', features: ['Trésorerie temps réel', 'Budgets et prévisions IA', 'Export FEC comptable', 'Multi-devises'], limits: { name: 'transactions', included: 500, surplusPrice: 3, surplusUnit: 500 } },
    { key: 'store', name: 'Boutique', price: 19, annualPrice: 15, description: 'Catalogue, commandes, promotions, thèmes', icon: 'Store', color: 'indigo', features: ['Catalogue produits', 'Gestion commandes', 'Promotions & coupons', 'Thèmes personnalisables'], limits: { name: 'products', included: 500, surplusPrice: 5, surplusUnit: 500 } },
    { key: 'stock', name: 'Stock', price: 9, annualPrice: 7, description: 'Inventaire, mouvements, valorisation', icon: 'Package', color: 'amber', features: ['Inventaire temps réel', 'Mouvements de stock', 'Valorisation FIFO/LIFO', 'Alertes rupture'] },
    { key: 'crm', name: 'CRM', price: 12, annualPrice: 9, description: 'Pipeline, opportunités, facturation', icon: 'Users', color: 'violet', features: ['Pipeline commercial', 'Gestion opportunités', 'Facturation intégrée', 'Rapports ventes'], limits: { name: 'contacts', included: 1000, surplusPrice: 3, surplusUnit: 1000 } },
    { key: 'marketing', name: 'Marketing', price: 9, annualPrice: 7, description: 'Campagnes email/SMS, listes diffusion', icon: 'Megaphone', color: 'pink', features: ['Campagnes email', 'SMS marketing', 'Listes de diffusion', 'Analytics campagnes'] },
    { key: 'hr', name: 'RH', price: 12, annualPrice: 9, description: 'Employés, congés, contrats, compétences', icon: 'UserCog', color: 'teal', features: ['Fiches employés', 'Gestion congés', 'Contrats de travail', 'Compétences & formations'], limits: { name: 'employees', included: 25, surplusPrice: 5, surplusUnit: 25 } },
    { key: 'support', name: 'Support', price: 5, annualPrice: 4, description: 'Tickets, FAQ, base de connaissances', icon: 'LifeBuoy', color: 'sky', features: ['Système tickets', 'FAQ publique', 'Base de connaissances', 'SLA configurable'], limits: { name: 'tickets_month', included: 50, surplusPrice: 2, surplusUnit: 50 } },
    { key: 'pos', name: 'Point de Vente', price: 15, annualPrice: 12, description: 'Terminal, kiosk, cuisine, analytics', icon: 'Monitor', color: 'orange', features: ['Terminal de vente', 'Mode kiosk', 'Écran cuisine', 'Analytics POS'] },
    { key: 'maintenance', name: 'GMAO', price: 9, annualPrice: 7, description: 'Maintenance équipements, planning', icon: 'Wrench', color: 'slate', features: ['Gestion équipements', 'Planning maintenance', 'Ordres de travail', 'Historique interventions'], limits: { name: 'equipments', included: 50, surplusPrice: 3, surplusUnit: 50 } },
  ],
  solutions: [
    { id: 'sol_restaurant', name: 'Quelyos Resto', slug: 'restaurant', price: 45, annualPrice: 35, description: 'Solution complète restauration', icon: 'UtensilsCrossed', color: 'orange', features: ['Point de Vente', 'Stock temps réel', 'Finance intégrée', 'CRM', 'Marketing'], modules: ['pos', 'stock', 'finance', 'crm', 'marketing'], modulesValue: 54, savings: 17 },
    { id: 'sol_commerce', name: 'Quelyos Commerce', slug: 'commerce', price: 45, annualPrice: 35, description: 'Commerce physique + digital', icon: 'ShoppingBag', color: 'indigo', features: ['Boutique en ligne', 'Point de Vente', 'Stock', 'CRM'], modules: ['store', 'pos', 'stock', 'crm'], modulesValue: 55, savings: 18 },
    { id: 'sol_ecommerce', name: 'Quelyos Store', slug: 'ecommerce', price: 45, annualPrice: 35, description: 'E-commerce complet', icon: 'Globe', color: 'emerald', features: ['Boutique en ligne', 'Stock', 'Marketing', 'Finance', 'CRM'], modules: ['store', 'stock', 'marketing', 'finance', 'crm'], modulesValue: 58, savings: 22 },
    { id: 'sol_services', name: 'Quelyos Pro', slug: 'services', price: 35, annualPrice: 27, description: 'Entreprises de services', icon: 'Briefcase', color: 'violet', features: ['CRM', 'Finance', 'RH', 'Marketing'], modules: ['crm', 'finance', 'hr', 'marketing'], modulesValue: 42, savings: 17 },
    { id: 'sol_sante', name: 'Quelyos Care', slug: 'sante', price: 29, annualPrice: 23, description: 'Cabinets & cliniques', icon: 'Heart', color: 'rose', features: ['CRM', 'Finance', 'Marketing', 'Support'], modules: ['crm', 'finance', 'marketing', 'support'], modulesValue: 35, savings: 17 },
    { id: 'sol_btp', name: 'Quelyos Build', slug: 'btp', price: 35, annualPrice: 27, description: 'BTP & construction', icon: 'HardHat', color: 'amber', features: ['GMAO', 'Stock', 'Finance', 'CRM'], modules: ['maintenance', 'stock', 'finance', 'crm'], modulesValue: 39, savings: 10 },
    { id: 'sol_hotel', name: 'Quelyos Hotel', slug: 'hotellerie', price: 39, annualPrice: 30, description: 'Hôtellerie & hébergement', icon: 'Hotel', color: 'teal', features: ['Support', 'GMAO', 'Finance', 'CRM', 'Marketing'], modules: ['support', 'maintenance', 'finance', 'crm', 'marketing'], modulesValue: 44, savings: 11 },
    { id: 'sol_asso', name: 'Quelyos Club', slug: 'associations', price: 19, annualPrice: 15, description: 'Associations & ONG', icon: 'HandHeart', color: 'sky', features: ['CRM (adhérents)', 'Finance', 'Marketing'], modules: ['crm', 'finance', 'marketing'], modulesValue: 30, savings: 37 },
    { id: 'sol_industrie', name: 'Quelyos Industrie', slug: 'industrie', price: 35, annualPrice: 27, description: 'PME industrielles & ateliers', icon: 'Factory', color: 'slate', features: ['GMAO', 'Stock', 'Finance', 'RH'], modules: ['maintenance', 'stock', 'finance', 'hr'], modulesValue: 39, savings: 10 },
    { id: 'sol_immobilier', name: 'Quelyos Immo', slug: 'immobilier', price: 29, annualPrice: 23, description: 'Agences & gestion immobilière', icon: 'Home', color: 'violet', features: ['CRM', 'Finance', 'Marketing', 'Support'], modules: ['crm', 'finance', 'marketing', 'support'], modulesValue: 35, savings: 17 },
    { id: 'sol_education', name: 'Quelyos Edu', slug: 'education', price: 35, annualPrice: 27, description: 'Formation & enseignement', icon: 'GraduationCap', color: 'blue', features: ['CRM', 'Finance', 'Marketing', 'RH'], modules: ['crm', 'finance', 'marketing', 'hr'], modulesValue: 42, savings: 17 },
    { id: 'sol_logistique', name: 'Quelyos Logistique', slug: 'logistique', price: 35, annualPrice: 27, description: 'Transport & entreposage', icon: 'Truck', color: 'teal', features: ['Stock', 'GMAO', 'Finance', 'CRM'], modules: ['stock', 'maintenance', 'finance', 'crm'], modulesValue: 39, savings: 10 },
  ],
  userPacks: {
    size: 5,
    price: 15,
    annualPrice: 12,
  },
  enterprise: {
    features: [
      'Utilisateurs illimités',
      'Tous les modules inclus',
      'SLA garanti 99.9%',
      'Account manager dédié',
      'Support téléphonique 24/7',
      'Intégrations sur mesure',
    ],
    cta: 'Contacter commercial',
    href: '/contact',
  },
  allInDiscount: {
    regularTotal: 99,
    discountedPrice: 89,
  },
}

// ═══════════════════════════════════════════════════════════════════════════
// FALLBACK STATIQUE — Ancien format (backward compat)
// ═══════════════════════════════════════════════════════════════════════════

export const FALLBACK_SUITE_PLANS: PricingPlan[] = [
  {
    id: 'suite_enterprise',
    name: 'Enterprise',
    description: 'Solution sur mesure, support dédié',
    price: 0,
    originalPrice: null,
    period: '',
    annualPrice: null,
    yearlyDiscountPct: 0,
    highlight: false,
    badge: null,
    cta: 'Contacter commercial',
    href: '/contact',
    icon: 'Crown',
    color: 'amber',
    features: [
      'Utilisateurs illimités',
      'Toutes les solutions',
      'SLA garanti 99.9%',
      'Account manager dédié',
      'Personnalisation complète',
      'Intégrations sur mesure',
      'Formation sur site',
      'Support téléphonique 24/7',
    ],
    limits: { users: 0, products: 0, ordersPerYear: 0 },
    trialDays: 0,
    planType: 'suite',
  },
  {
    id: 'suite_business',
    name: 'Business',
    description: "L'ERP complet pour les PME ambitieuses",
    price: 49,
    originalPrice: 99,
    period: '/mois',
    annualPrice: 37,
    yearlyDiscountPct: 25,
    highlight: true,
    badge: 'Meilleure offre',
    cta: 'Essai gratuit 30 jours',
    href: '/register?plan=business',
    icon: 'Rocket',
    color: 'indigo',
    features: [
      '10 utilisateurs inclus',
      'Toutes les solutions incluses',
      'Prévisions IA avancées 24 mois',
      'API REST complète',
      'Intégrations 50+ apps',
      'Support prioritaire 4h',
      'Formations illimitées',
      'Export FEC + rapports PDF',
    ],
    limits: { users: 10, products: 0, ordersPerYear: 0 },
    trialDays: 30,
    planType: 'suite',
  },
  {
    id: 'suite_starter',
    name: 'Starter',
    description: 'Tout pour bien démarrer',
    price: 19,
    originalPrice: 49,
    period: '/mois',
    annualPrice: 14,
    yearlyDiscountPct: 25,
    highlight: false,
    badge: null,
    cta: 'Essai gratuit 30 jours',
    href: '/register?plan=starter',
    icon: 'Layers',
    color: 'emerald',
    features: [
      '3 utilisateurs inclus',
      'Finance + 2 solutions au choix',
      'Prévisions IA 12 mois',
      'API basique incluse',
      'Support prioritaire 24h',
      'Export FEC comptable',
    ],
    limits: { users: 3, products: 0, ordersPerYear: 0 },
    trialDays: 30,
    planType: 'suite',
  },
]

export const FALLBACK_FINANCE_PLANS: PricingPlan[] = [
  {
    id: 'fin_free',
    name: 'Freemium',
    description: 'Pour découvrir et tester',
    price: 0,
    originalPrice: null,
    period: 'Pour toujours',
    annualPrice: null,
    yearlyDiscountPct: 0,
    highlight: false,
    badge: null,
    cta: 'Commencer gratuitement',
    href: '/register',
    icon: 'PiggyBank',
    color: 'emerald',
    features: [
      '1 utilisateur',
      '2 comptes bancaires',
      '100 transactions/mois',
      'Tableau de bord basique',
      'Export CSV',
      'Support email (48h)',
    ],
    limits: { users: 1, products: 0, ordersPerYear: 0 },
    trialDays: 0,
    planType: 'finance',
  },
  {
    id: 'fin_pro',
    name: 'Pro',
    description: 'Pour les indépendants & TPE',
    price: 19,
    originalPrice: 29,
    period: 'par mois',
    annualPrice: 15,
    yearlyDiscountPct: 20,
    highlight: true,
    badge: 'Le + populaire',
    cta: 'Essai gratuit 14 jours',
    href: '/register?plan=pro',
    icon: 'Target',
    color: 'indigo',
    features: [
      '1 utilisateur',
      'Comptes illimités',
      'Transactions illimitées',
      'Budgets intelligents',
      'Prévisions IA 12 mois',
      'Rapports avancés',
      'Export comptable (FEC)',
      'Support prioritaire (24h)',
    ],
    limits: { users: 1, products: 0, ordersPerYear: 0 },
    trialDays: 14,
    planType: 'finance',
  },
  {
    id: 'fin_expert',
    name: 'Expert',
    description: 'Pour les équipes & multi-sociétés',
    price: 49,
    originalPrice: null,
    period: 'par mois',
    annualPrice: 39,
    yearlyDiscountPct: 20,
    highlight: false,
    badge: null,
    cta: 'Essai gratuit 14 jours',
    href: '/register?plan=expert',
    icon: 'BarChart3',
    color: 'violet',
    features: [
      '10 utilisateurs',
      'Multi-sociétés',
      'Consolidation financière',
      'Scénarios et simulations',
      'Intégrations bancaires auto',
      'API et webhooks',
      'Support téléphone + email',
      'Onboarding personnalisé',
    ],
    limits: { users: 10, products: 0, ordersPerYear: 0 },
    trialDays: 14,
    planType: 'finance',
  },
]

export const FALLBACK_ECOMMERCE_PLANS: PricingPlan[] = [
  {
    id: 'ecom_starter',
    name: 'Starter',
    description: 'Pour lancer votre boutique',
    price: 29,
    originalPrice: null,
    period: 'par mois',
    annualPrice: 23,
    yearlyDiscountPct: 20,
    highlight: false,
    badge: null,
    cta: "Commencer l'essai gratuit",
    href: '/ecommerce/signup?plan=starter',
    icon: 'Store',
    color: 'emerald',
    features: [
      '2 utilisateurs',
      '500 produits',
      '100 commandes/mois',
      '5 GB stockage',
      'Domaine *.quelyos.shop',
      'Thème personnalisable',
      'Support email (72h)',
      'Paiement Stripe/PayPal',
    ],
    limits: { users: 2, products: 500, ordersPerYear: 1200 },
    trialDays: 14,
    planType: 'ecommerce',
  },
  {
    id: 'ecom_pro',
    name: 'Pro',
    description: 'Pour les boutiques actives',
    price: 79,
    originalPrice: null,
    period: 'par mois',
    annualPrice: 63,
    yearlyDiscountPct: 20,
    highlight: true,
    badge: 'Le + populaire',
    cta: 'Essai gratuit 14 jours',
    href: '/ecommerce/signup?plan=pro',
    icon: 'Rocket',
    color: 'indigo',
    features: [
      '5 utilisateurs',
      '2 000 produits',
      '500 commandes/mois',
      '20 GB stockage',
      'Domaine personnalisé',
      'Thème + CSS custom',
      'Support email (24h)',
      'Multi-devises (EUR, USD...)',
      'Analytics avancés',
      'API complète',
    ],
    limits: { users: 5, products: 2000, ordersPerYear: 6000 },
    trialDays: 14,
    planType: 'ecommerce',
  },
  {
    id: 'ecom_business',
    name: 'Business',
    description: 'Multi-boutique pour PME',
    price: 199,
    originalPrice: null,
    period: 'par mois',
    annualPrice: 159,
    yearlyDiscountPct: 20,
    highlight: false,
    badge: 'Multi-boutique',
    cta: 'Essai gratuit 14 jours',
    href: '/ecommerce/signup?plan=business',
    icon: 'Crown',
    color: 'violet',
    features: [
      '15 utilisateurs',
      '10 000 produits',
      'Commandes illimitées',
      '100 GB stockage',
      'Multi-boutiques',
      'Support prioritaire (4h)',
      'Intégrations ERP',
      'SEO avancé',
    ],
    limits: { users: 15, products: 10000, ordersPerYear: 0 },
    trialDays: 14,
    planType: 'ecommerce',
  },
  {
    id: 'ecom_enterprise',
    name: 'Enterprise',
    description: 'Instance dédiée sur mesure',
    price: 0,
    originalPrice: null,
    period: '',
    annualPrice: null,
    yearlyDiscountPct: 0,
    highlight: false,
    badge: 'Instance dédiée',
    cta: 'Contacter commercial',
    href: '/contact',
    icon: 'Building2',
    color: 'amber',
    features: [
      'Utilisateurs illimités',
      'Produits illimités',
      'Commandes illimitées',
      'Stockage illimité',
      'Infrastructure dédiée',
      'SLA 99.9%',
      'Account manager',
      'Intégrations sur mesure',
    ],
    limits: { users: 0, products: 0, ordersPerYear: 0 },
    trialDays: 0,
    planType: 'ecommerce',
  },
]
