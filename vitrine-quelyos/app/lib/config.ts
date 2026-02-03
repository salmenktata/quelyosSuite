import { getAppUrl, getBackendUrl } from '@quelyos/config';

// Configuration des URLs avec priorité aux variables d'environnement,
// puis fallback dev/prod pour un comportement prévisible.
const isDev = process.env.NODE_ENV === "development";

function join(base: string, path: string): string {
  if (!base) return path;
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

const FINANCE_BASE =
  process.env.NEXT_PUBLIC_FINANCE_APP_URL ||
  getAppUrl('dashboard', isDev ? 'development' : 'production');
const MARKETING_BASE =
  process.env.NEXT_PUBLIC_MARKETING_APP_URL ||
  (isDev ? "http://localhost:3002" : "https://marketing.quelyos.com");
const SUPER_ADMIN_BASE =
  process.env.NEXT_PUBLIC_SUPER_ADMIN_URL ||
  getAppUrl('superadmin', isDev ? 'development' : 'production');

const API_FINANCE_BASE =
  process.env.NEXT_PUBLIC_API_FINANCE_URL ||
  getBackendUrl(isDev ? 'development' : 'production');
const API_MARKETING_BASE =
  process.env.NEXT_PUBLIC_API_MARKETING_URL ||
  getBackendUrl(isDev ? 'development' : 'production');

export const config = {
  // URLs Finance
  finance: {
    app: FINANCE_BASE,
    login: join(FINANCE_BASE, "/login"),
    register: "/register?module=finance",
    dashboard: join(FINANCE_BASE, "/dashboard"),
    accounts: join(FINANCE_BASE, "/dashboard/accounts"),
    forecast: join(FINANCE_BASE, "/dashboard/forecast"),
    budgets: join(FINANCE_BASE, "/dashboard/budgets"),
    tpe: join(FINANCE_BASE, "/tpe"),
    settings: join(FINANCE_BASE, "/dashboard/settings/security"),
  },
  // URLs Marketing
  marketing: {
    app: MARKETING_BASE,
    login: join(MARKETING_BASE, "/login"),
    register: "/register?module=marketing",
    dashboard: join(MARKETING_BASE, "/dashboard"),
  },
  // URLs Super Admin
  superadmin: {
    app: SUPER_ADMIN_BASE,
    login: "/superadmin/login",
  },
  // URLs API
  api: {
    finance: API_FINANCE_BASE,
    marketing: API_MARKETING_BASE,
  },
};

export default config;
