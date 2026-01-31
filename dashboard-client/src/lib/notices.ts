/**
 * Notices contextuelles pour les pages
 */

export interface Notice {
  type: 'info' | 'warning' | 'success' | 'error'
  title?: string
  message: string
}

// Notices Finance
export const financeNotices = {
  invoices: [
    {
      type: 'info' as const,
      title: 'Factures Clients',
      message: 'Gérez vos factures de vente et suivez les paiements en temps réel.',
    },
  ],
  bills: [
    {
      type: 'info' as const,
      title: 'Factures Fournisseurs',
      message: 'Enregistrez et suivez vos factures d\'achat.',
    },
  ],
  chartOfAccounts: [
    {
      type: 'info' as const,
      title: 'Plan Comptable',
      message: 'Consultez et gérez votre plan comptable.',
    },
  ],
  payments: [
    {
      type: 'info' as const,
      title: 'Paiements',
      message: 'Suivez tous vos paiements clients et fournisseurs.',
    },
  ],
  fiscalYears: [
    {
      type: 'info' as const,
      title: 'Exercices Fiscaux',
      message: 'Gérez vos périodes comptables et exercices fiscaux.',
    },
  ],
  journals: [
    {
      type: 'info' as const,
      title: 'Journaux Comptables',
      message: 'Consultez vos journaux de ventes, achats, banque, etc.',
    },
  ],
  taxDeclarations: [
    {
      type: 'warning' as const,
      title: 'Déclarations TVA',
      message: 'Générez vos déclarations TVA mensuelles conformes DGFiP (France) et SPF Finances (Belgique).',
    },
  ],
}

// Notices Store
export const storeNotices = {
  products: [
    {
      type: 'info' as const,
      message: 'Gérez votre catalogue de produits.',
    },
  ],
}

// Notices CRM
export const crmNotices = {
  contacts: [
    {
      type: 'info' as const,
      message: 'Gérez vos contacts clients et prospects.',
    },
  ],
}

// Notices Marketing
export const marketingNotices = {
  campaigns: [
    {
      type: 'info' as const,
      message: 'Créez et suivez vos campagnes marketing.',
    },
  ],
}
