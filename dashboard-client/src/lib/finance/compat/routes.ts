/**
 * Adaptateur de compatibilité @quelyos/config/routes
 * Routes finance pour le backoffice
 * Supporte la structure imbriquée legacy (ROUTES.FINANCE.DASHBOARD.ACCOUNTS.HOME)
 */

// Structure imbriquée pour compatibilité avec le code migré de quelyos-finance
const FINANCE_DASHBOARD = {
  HOME: '/finance',
  ACCOUNTS: {
    HOME: '/finance/accounts',
    NEW: '/finance/accounts/new',
    DETAIL: (id: number | string) => `/finance/accounts/${id}`,
  },
  TRANSACTIONS: {
    HOME: '/finance/transactions',
    NEW: '/finance/transactions/new',
  },
  EXPENSES: {
    HOME: '/finance/expenses',
    NEW: '/finance/expenses/new',
  },
  INCOMES: {
    HOME: '/finance/incomes',
    NEW: '/finance/incomes/new',
  },
  BUDGETS: {
    HOME: '/finance/budgets',
    NEW: '/finance/budgets/new',
    DETAIL: (id: number | string) => `/finance/budgets/${id}`,
  },
  CATEGORIES: '/finance/categories',
  PAYMENT_PLANNING: '/finance/payment-planning',
  FORECAST: '/finance/forecast',
  SCENARIOS: '/finance/scenarios',
  PORTFOLIOS: {
    HOME: '/finance/portfolios',
    DETAIL: (id: number | string) => `/finance/portfolios/${id}`,
  },
  REPORTING: '/finance/reporting',
  SUPPLIERS: {
    HOME: '/finance/suppliers',
    NEW: '/finance/suppliers/new',
    DETAIL: (id: number | string) => `/finance/suppliers/${id}`,
  },
  ALERTS: '/finance/alerts',
  CHARTS: '/finance/charts',
  IMPORT: '/finance/import',
  ARCHIVES: '/finance/archives',
  SETTINGS: '/finance/settings',
}

// Routes Finance plates (pour accès direct)
const FINANCE_ROUTES = {
  DASHBOARD: FINANCE_DASHBOARD,
  ACCOUNTS: '/finance/accounts',
  ACCOUNT_DETAIL: (id: number | string) => `/finance/accounts/${id}`,
  ACCOUNT_NEW: '/finance/accounts/new',
  TRANSACTIONS: '/finance/transactions',
  TRANSACTION_NEW: '/finance/transactions/new',
  EXPENSES: '/finance/expenses',
  EXPENSE_NEW: '/finance/expenses/new',
  INCOMES: '/finance/incomes',
  INCOME_NEW: '/finance/incomes/new',
  BUDGETS: '/finance/budgets',
  BUDGET_DETAIL: (id: number | string) => `/finance/budgets/${id}`,
  BUDGET_NEW: '/finance/budgets/new',
  CATEGORIES: '/finance/categories',
  PAYMENT_PLANNING: '/finance/payment-planning',
  FORECAST: '/finance/forecast',
  SCENARIOS: '/finance/scenarios',
  PORTFOLIOS: '/finance/portfolios',
  PORTFOLIO_DETAIL: (id: number | string) => `/finance/portfolios/${id}`,
  REPORTING: '/finance/reporting',
  REPORTING_OVERVIEW: '/finance/reporting/overview',
  REPORTING_CASHFLOW: '/finance/reporting/cashflow',
  REPORTING_BY_CATEGORY: '/finance/reporting/by-category',
  REPORTING_BY_ACCOUNT: '/finance/reporting/by-account',
  REPORTING_BY_FLOW: '/finance/reporting/by-flow',
  REPORTING_BY_PORTFOLIO: '/finance/reporting/by-portfolio',
  REPORTING_FORECAST: '/finance/reporting/forecast',
  REPORTING_FORECASTS: '/finance/reporting/forecasts',
  REPORTING_BFR: '/finance/reporting/bfr',
  REPORTING_DSO: '/finance/reporting/dso',
  REPORTING_EBITDA: '/finance/reporting/ebitda',
  REPORTING_BREAKEVEN: '/finance/reporting/breakeven',
  REPORTING_PROFITABILITY: '/finance/reporting/profitability',
  REPORTING_DATA_QUALITY: '/finance/reporting/data-quality',
  SUPPLIERS: '/finance/suppliers',
  SUPPLIER_DETAIL: (id: number | string) => `/finance/suppliers/${id}`,
  SUPPLIER_NEW: '/finance/suppliers/new',
  ALERTS: '/finance/alerts',
  CHARTS: '/finance/charts',
  IMPORT: '/finance/import',
  ARCHIVES: '/finance/archives',
  SETTINGS: '/finance/settings',
  SETTINGS_SECURITY: '/settings/security',
  SETTINGS_FLUX: '/finance/settings/flux',
}

export const ROUTES = {
  // Sous-objet FINANCE pour compatibilité
  FINANCE: FINANCE_ROUTES,

  // Routes au niveau racine (alias)
  ...FINANCE_ROUTES,

  // Legacy (backoffice existant)
  INVOICES: '/invoices',
  PAYMENTS: '/payments',
}

export type RouteKey = keyof typeof ROUTES
