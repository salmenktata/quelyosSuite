// Routes configuration for Quelyos
export const ROUTES = {
  // Public routes
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/auth/password/forgot",
  RESET_PASSWORD: "/auth/password/reset",

  // Marketing app routes (nested structure)
  MARKETING: {
    AUTH: {
      LOGIN: "/login",
      REGISTER: "/register",
    },
    DASHBOARD: {
      HOME: "/dashboard",
      POSTS: {
        HOME: "/dashboard/posts",
        NEW: "/dashboard/posts/new",
      },
      CALENDAR: "/dashboard/calendar",
      AI_STUDIO: "/dashboard/ai-studio",
      ACCOUNTS: {
        HOME: "/dashboard/accounts",
      },
      INBOX: "/dashboard/inbox",
    },
  },

  // Finance app routes (nested structure)
  FINANCE: {
    AUTH: {
      LOGIN: "/login",
      REGISTER: "/register",
      FORGOT: "/auth/password/forgot",
      RESET: "/auth/password/reset",
      VERIFY: "/verify-email",
      RESEND: "/resend-verification",
    },
    DASHBOARD: {
      HOME: "/dashboard",
      TRANSACTIONS: "/dashboard/transactions",
      INCOMES: {
        HOME: "/dashboard/incomes",
        NEW: "/dashboard/incomes/new",
      },
      EXPENSES: {
        HOME: "/dashboard/expenses",
        NEW: "/dashboard/expenses/new",
      },
      ACCOUNTS: {
        HOME: "/dashboard/accounts",
        NEW: "/dashboard/accounts/new",
        DETAIL: (id: string) => `/dashboard/accounts/${id}`,
      },
      BUDGETS: {
        HOME: "/dashboard/budgets",
        NEW: "/dashboard/budgets/new",
        DETAIL: (id: string) => `/dashboard/budgets/${id}`,
      },
      CATEGORIES: "/dashboard/categories",
      SETTINGS: "/dashboard/settings",
      REPORTING: "/dashboard/reporting",
      FORECAST: "/dashboard/forecast",
      SCENARIOS: "/dashboard/scenarios",
      IMPORT: "/dashboard/import",
    },
  },

  // API routes
  API: {
    AUTH: {
      LOGIN: "/api/auth/login",
      LOGOUT: "/api/auth/logout",
      REGISTER: "/api/auth/register",
    },
  },
} as const;

// Type pour extraire toutes les routes string
type ExtractRouteStrings<T> = T extends string
  ? T
  : T extends (...args: any[]) => string
  ? ReturnType<T>
  : T extends object
  ? { [K in keyof T]: ExtractRouteStrings<T[K]> }[keyof T]
  : never;

export type RoutePath = ExtractRouteStrings<typeof ROUTES>;

// Validation des paramètres de route
export function validateRouteParam(param: string, paramName = 'id'): void {
  if (!param || typeof param !== 'string') {
    throw new Error(`Invalid ${paramName} parameter: ${param}`);
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(param)) {
    throw new Error(`${paramName} contains invalid characters: ${param}`);
  }
}

// Type-safe route builders
export function buildAccountRoute(id: string): string {
  validateRouteParam(id, 'accountId');
  return ROUTES.FINANCE.DASHBOARD.ACCOUNTS.DETAIL(id);
}

export function buildBudgetRoute(id: string): string {
  validateRouteParam(id, 'budgetId');
  return ROUTES.FINANCE.DASHBOARD.BUDGETS.DETAIL(id);
}
