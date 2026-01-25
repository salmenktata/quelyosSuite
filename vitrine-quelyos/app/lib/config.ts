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
  (isDev ? "http://localhost:5175" : "https://finance.quelyos.com");
const MARKETING_BASE =
  process.env.NEXT_PUBLIC_MARKETING_APP_URL ||
  (isDev ? "http://localhost:3002" : "https://marketing.quelyos.com");
const SUPER_ADMIN_BASE =
  process.env.NEXT_PUBLIC_SUPER_ADMIN_URL ||
  (isDev ? "http://localhost:3010" : "https://superadmin.quelyos.com");

const API_FINANCE_BASE =
  process.env.NEXT_PUBLIC_API_FINANCE_URL ||
  (isDev ? "http://localhost:3005" : "https://api.quelyos.com");
const API_MARKETING_BASE =
  process.env.NEXT_PUBLIC_API_MARKETING_URL ||
  (isDev ? "http://localhost:3003" : "https://api-marketing.quelyos.com");

export const config = {
  // URLs Finance
  finance: {
    app: FINANCE_BASE,
    login: "/finance/login",
    register: "/finance/register",
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
    login: "/marketing/login",
    register: "/marketing/register",
    dashboard: join(MARKETING_BASE, "/dashboard"),
  },
  // URLs Super Admin
  superadmin: {
    app: SUPER_ADMIN_BASE,
    login: join(SUPER_ADMIN_BASE, "/login"),
  },
  // URLs API
  api: {
    finance: API_FINANCE_BASE,
    marketing: API_MARKETING_BASE,
  },
};

export default config;
