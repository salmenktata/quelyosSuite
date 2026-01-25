import { api } from "./api";

export type Range = { from: string; to: string };
export type DailyPoint = {
  date: string;
  credit: number;
  debit: number;
  plannedCredit?: number;
  plannedDebit?: number;
  balance?: number;
  projectedBalance?: number;
  plannedNet?: number;
};

export type CategoryTotal = { categoryId?: number | null; name: string; total: number; count?: number };

export type PerAccountActual = {
  accountId: number;
  accountName: string;
  baseBalance: number;
  endBalance: number;
  totalCredit: number;
  totalDebit: number;
  daily: DailyPoint[];
};

export type PerAccountForecast = {
  accountId: number;
  accountName: string;
  baseBalance: number;
  projectedBalance: number;
  daily: DailyPoint[];
};

export type ActualsResponse = {
  range: Range;
  baseBalance: number;
  endBalance: number;
  totalCredit: number;
  totalDebit: number;
  net: number;
  daily: DailyPoint[];
  perAccount: PerAccountActual[];
  categoryTotals?: {
    income: CategoryTotal[];
    expense: CategoryTotal[];
  };
};

export type ForecastResponse = {
  range: Range;
  days: number;
  baseBalance: number;
  projectedBalance: number;
  futureImpact: number;
  daily: DailyPoint[];
  perAccount: PerAccountForecast[];
};

export type CombinedResponse = {
  range: Range;
  currentBalance: number;
  futureImpact: number;
  landingBalance: number;
  runwayDays?: number;
  daily: DailyPoint[];
  perAccount: PerAccountForecast[];
};

export type TopCategoriesResponse = {
  income: CategoryTotal[];
  expense: CategoryTotal[];
};

export type BudgetCategory = {
  categoryId?: number;
  name: string;
  budgeted: number;
  actual: number;
  variance: number;
};

export type BudgetsResponse = {
  period: "month" | "quarter" | "year";
  budgeted: number;
  actual: number;
  variance: number;
  variancePct: number | null;
  byCategory: BudgetCategory[];
};

export type FlowBreakdownTransaction = {
  id: number;
  description: string | null;
  amount: number;
  type: "credit" | "debit";
  date: string;
  category: string | null;
};

export type FlowBreakdownEntry = {
  flowId: number;
  flowName: string;
  flowType: string;
  totalCredit: number;
  totalDebit: number;
  count: number;
  net: number;
  volume: number;
  transactions: FlowBreakdownTransaction[];
};

export type ByFlowResponse = {
  range: Range;
  totalCredit: number;
  totalDebit: number;
  totalCount: number;
  net: number;
  flows: FlowBreakdownEntry[];
  noFlow: {
    totalCredit: number;
    totalDebit: number;
    count: number;
    net: number;
  };
};

export type ReportingFilters = {
  from?: string;
  to?: string;
  days?: number;
  horizonDays?: number;
  groupBy?: "day" | "week" | "month";
  portfolioId?: number;
  accountId?: number;
  categoryId?: number;
  paymentFlowId?: number;
  currency?: "company" | "account";
};

// Dashboard Overview Types
export type DashboardKPI = {
  value: number;
  trend: "up" | "down" | "stable";
  reliability: "high" | "medium" | "low";
  data?: any;
};

export type DashboardKPIWithMargin = DashboardKPI & {
  margin: number;
};

export type DashboardKPIWithPercent = DashboardKPI & {
  reachedPercent: number;
};

export type DashboardInsight = {
  type: "success" | "warning" | "info" | "error";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  action: string;
  actionUrl: string;
};

export type DashboardAction = {
  id: string;
  type: string;
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  dueDate: string;
  customers?: Array<{
    name: string;
    outstandingBalance: number;
    email?: string;
  }>;
};

export type DashboardTransaction = {
  id: number;
  amount: number;
  type: "credit" | "debit";
  description: string;
  date: string;
  category: {
    id: number;
    name: string;
  } | null;
  account: {
    id: number;
    name: string;
  };
};

export type DashboardForecast = {
  historical: Array<{
    date: string;
    income: number;
    expenses: number;
    net: number;
  }>;
  forecast: Array<{
    date: string;
    income: number;
    expenses: number;
    net: number;
    isForecast: true;
  }>;
};

export type DashboardOverviewResponse = {
  balances: {
    total: number;
    accounts: Array<{
      id: number;
      name: string;
      balance: number;
      currency: string;
    }>;
  };
  kpis: {
    dso: DashboardKPI;
    ebitda: DashboardKPIWithMargin;
    bfr: DashboardKPI;
    breakEven: DashboardKPIWithPercent;
  };
  recentTransactions: DashboardTransaction[];
  insights: DashboardInsight[];
  actions: DashboardAction[];
  forecast: DashboardForecast;
  metadata: {
    days: number;
    accountCount: number;
    timestamp: string;
  };
};

const buildQuery = (filters?: ReportingFilters) => {
  const params = new URLSearchParams();
  if (!filters) return "";
  Object.entries(filters).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    params.append(k, String(v));
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
};

export type AccountDetail = {
  accountId: number;
  accountName: string;
  portfolioId?: number | null;
  portfolioName?: string | null;
  balance: number;
  totalCredit: number;
  totalDebit: number;
  movements: number;
  evolution: number;
  avgIncome: number;
  avgExpense: number;
};

export type ByAccountResponse = {
  range: Range;
  accounts: AccountDetail[];
};

export type PortfolioDetail = {
  portfolioId: number;
  portfolioName: string;
  accountsCount: number;
  balance: number;
  totalCredit: number;
  totalDebit: number;
  movements: number;
  evolution: number;
};

export type ByPortfolioResponse = {
  range: Range;
  portfolios: PortfolioDetail[];
};

export type ProfitabilityResponse = {
  range: Range;
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMargin: number;
  operatingExpenses: number;
  operatingProfit: number;
  operatingMargin: number;
  otherIncome: number;
  otherExpenses: number;
  netProfit: number;
  netMargin: number;
  breakdown: {
    totalIncome: number;
    totalExpenses: number;
    transactionCount: number;
  };
};

export type DSOResponse = {
  range: Range;
  dso: number; // Days Sales Outstanding
  avgPaymentDelay: number; // Average payment delay in days
  totalReceivables: number; // Outstanding receivables
  totalRevenue: number; // Revenue for period
  invoices: {
    paid: number;
    overdue: number;
    pending: number;
  };
  trend: "improving" | "worsening" | "stable";
  byCustomer: {
    customerId: number;
    customerName: string;
    receivables: number;
    invoiceCount: number;
  }[];
  reliability?: ReliabilityScore;
};

export type EBITDAResponse = ProfitabilityResponse & {
  depreciationAndAmortization: number;
  ebitda: number;
  ebitdaMargin: number;
  reliability?: ReliabilityScore;
};

export type BFRResponse = {
  range: Range;
  bfr: number; // Working Capital Requirement
  bfrDays: number; // BFR in days of revenue
  components: {
    receivables: number;
    inventory: number;
    payables: number;
  };
  ratio: number; // BFR/Revenue percentage
  trend: "increasing" | "decreasing" | "stable";
  recommendation: string;
  reliability?: ReliabilityScore;
};

export type BreakEvenResponse = {
  range: Range;
  breakEvenRevenue: number;
  currentRevenue: number;
  revenueGap: number;
  breakEvenReached: boolean;
  fixedCosts: number;
  variableCosts: number;
  contributionMargin: number;
  safetyMargin: number;
  categoriesBreakdown: {
    fixed: CategoryTotal[];
    variable: CategoryTotal[];
    unclassified: CategoryTotal[];
  };
  warning?: string | null;
  reliability?: ReliabilityScore;
};

// Reliability Score types
export type ReliabilityScore = {
  score: number; // 0-100
  level: "excellent" | "good" | "moderate" | "poor";
  prerequisites: {
    met: string[];
    missing: string[];
    warnings: string[];
  };
  recommendations: string[];
  dataQuality: {
    completeness: number;
    consistency: number;
    accuracy: number;
  };
};

export type KPIWithReliability<T> = T & {
  reliability: ReliabilityScore;
};

// Historical trend data types
export type DSOHistoryPoint = {
  month: string; // YYYY-MM
  dso: number;
  revenue: number;
  receivables: number;
};

export type EBITDAHistoryPoint = {
  month: string;
  ebitda: number;
  ebitdaMargin: number;
  revenue: number;
  operatingProfit: number;
};

export type BFRHistoryPoint = {
  month: string;
  bfr: number;
  receivables: number;
  payables: number;
  ratio: number;
};

export type BreakEvenHistoryPoint = {
  month: string;
  revenue: number;
  breakEvenRevenue: number;
  reached: boolean;
  safetyMargin: number;
  fixedCosts: number;
  variableCosts: number;
};

export type HistoryResponse<T> = {
  months: number;
  data: T[];
};

// ML Forecasting types
export type ForecastPoint = {
  date: string;
  dso?: number;
  ebitdaMargin?: number;
  bfr?: number;
  confidence80: {
    upper: number;
    lower: number;
  };
  confidence95: {
    upper: number;
    lower: number;
  };
};

export type KPIForecastResponse = {
  horizonDays: number;
  historical: Array<{
    date: string;
    value: number;
  }>;
  forecast: ForecastPoint[];
  model: {
    type: "prophet" | "simple_trend";
    trainedOn: number;
    kpiType: string;
  };
};

export type EventAnnotation = {
  id?: number;
  date: string;
  label: string;
  confidence?: number;
  type: "auto" | "manual" | "imported";
  description?: string;
};

export type ForecastDailyPoint = {
  date: string;
  predicted?: number; // Prophet prediction
  projectedBalance: number; // Backwards compatible
  forecastIncome: number;
  forecastExpense: number;
  plannedCredit: number;
  plannedDebit: number;
  netChange: number;
  trendBased: {
    income: number;
    expense: number;
  };
  // New Prophet fields
  confidence80?: {
    upper: number;
    lower: number;
  };
  confidence95?: {
    upper: number;
    lower: number;
  };
  components?: {
    trend: number;
    seasonal: number;
    planned: number;
  };
  scenarios?: {
    optimistic: number; // +15%
    realistic: number;
    pessimistic: number; // -15%
  };
};

export type ModelInfo = {
  type: "prophet" | "simple_trend";
  trainedOn: number; // Days of historical data used
  horizonDays: number;
  accuracy?: {
    mape: number; // Mean Absolute Percentage Error
  };
};

export type ForecastEnhancedResponse = {
  range: Range;
  currentBalance: number;
  projectedBalance: number;
  futureImpact: number;
  minBalance: number;
  maxBalance: number;
  runwayDays: number | null;
  trends: {
    avgDailyIncome: number;
    avgDailyExpense: number;
    avgDailyNet: number;
    historicalDays: number;
  };
  forecast: ForecastDailyPoint[];
  model: ModelInfo; // NEW: Model metadata
  events: EventAnnotation[]; // NEW: Event annotations
  alerts: {
    lowCash: boolean;
    negativeBalance: boolean;
    runwayDays: number | null;
  };
};

export const reportingClient = {
  async actuals(filters?: ReportingFilters) {
    return api(`/reporting/actuals${buildQuery(filters)}`) as Promise<ActualsResponse>;
  },
  async forecast(filters?: ReportingFilters) {
    return api(`/reporting/forecast${buildQuery(filters)}`) as Promise<ForecastResponse>;
  },
  async combined(filters?: ReportingFilters) {
    return api(`/reporting/combined${buildQuery(filters)}`) as Promise<CombinedResponse>;
  },
  async topCategories(filters?: ReportingFilters & { mode?: "reel" | "previsionnel"; limit?: number }) {
    return api(`/reporting/top-categories${buildQuery(filters)}`) as Promise<TopCategoriesResponse>;
  },
  async budgets(filters?: { period?: "month" | "quarter" | "year"; year?: number; month?: number; categoryId?: number }) {
    return api(`/reporting/budgets${buildQuery(filters)}`) as Promise<BudgetsResponse>;
  },
  async byFlow(filters?: ReportingFilters) {
    return api(`/reporting/by-flow${buildQuery(filters)}`) as Promise<ByFlowResponse>;
  },
  async byAccount(filters?: ReportingFilters) {
    return api(`/reporting/by-account${buildQuery(filters)}`) as Promise<ByAccountResponse>;
  },
  async byPortfolio(filters?: ReportingFilters) {
    return api(`/reporting/by-portfolio${buildQuery(filters)}`) as Promise<ByPortfolioResponse>;
  },
  async profitability(filters?: ReportingFilters) {
    return api(`/reporting/profitability${buildQuery(filters)}`) as Promise<ProfitabilityResponse>;
  },
  async forecastEnhanced(filters?: ReportingFilters & { historicalDays?: number }) {
    return api(`/reporting/forecast-enhanced${buildQuery(filters)}`) as Promise<ForecastEnhancedResponse>;
  },
  async dso(filters?: ReportingFilters) {
    return api(`/reporting/dso${buildQuery(filters)}`) as Promise<DSOResponse>;
  },
  async ebitda(filters?: ReportingFilters) {
    return api(`/reporting/ebitda${buildQuery(filters)}`) as Promise<EBITDAResponse>;
  },
  async bfr(filters?: ReportingFilters & { includeInventory?: boolean }) {
    return api(`/reporting/bfr${buildQuery(filters)}`) as Promise<BFRResponse>;
  },
  async breakeven(filters?: ReportingFilters) {
    return api(`/reporting/breakeven${buildQuery(filters)}`) as Promise<BreakEvenResponse>;
  },

  // Historical trend endpoints
  async dsoHistory(filters?: { months?: number }) {
    return api(`/reporting/dso/history${buildQuery(filters)}`) as Promise<HistoryResponse<DSOHistoryPoint>>;
  },
  async ebitdaHistory(filters?: { months?: number }) {
    return api(`/reporting/ebitda/history${buildQuery(filters)}`) as Promise<HistoryResponse<EBITDAHistoryPoint>>;
  },
  async bfrHistory(filters?: { months?: number }) {
    return api(`/reporting/bfr/history${buildQuery(filters)}`) as Promise<HistoryResponse<BFRHistoryPoint>>;
  },
  async breakevenHistory(filters?: { months?: number }) {
    return api(`/reporting/breakeven/history${buildQuery(filters)}`) as Promise<HistoryResponse<BreakEvenHistoryPoint>>;
  },

  // ML Forecasting endpoints
  async dsoForecast(filters?: { horizonDays?: number }) {
    return api(`/reporting/dso/forecast${buildQuery(filters)}`) as Promise<KPIForecastResponse>;
  },
  async ebitdaForecast(filters?: { horizonDays?: number }) {
    return api(`/reporting/ebitda/forecast${buildQuery(filters)}`) as Promise<KPIForecastResponse>;
  },
  async bfrForecast(filters?: { horizonDays?: number }) {
    return api(`/reporting/bfr/forecast${buildQuery(filters)}`) as Promise<KPIForecastResponse>;
  },

  // Dashboard Overview - batched endpoint for all dashboard data
  async dashboardOverview(filters?: ReportingFilters & { days?: number }) {
    return api(`/dashboard/overview${buildQuery(filters)}`) as Promise<DashboardOverviewResponse>;
  },
};
