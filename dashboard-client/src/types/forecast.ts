// Types pour les prévisions de trésorerie

export const HORIZONS = [7, 30, 90, 180] as const;
export type Horizon = typeof HORIZONS[number];

export type DailyRow = {
  date: string;
  credit: number;
  debit: number;
  plannedCredit: number;
  plannedDebit: number;
  balance: number;
  predicted?: number;
  confidence80?: { upper: number; lower: number };
  confidence95?: { upper: number; lower: number };
  scenarios?: { optimistic: number; realistic: number; pessimistic: number };
  components?: { trend: number; seasonal: number; planned: number };
};

export type ForecastAccount = {
  accountId: number;
  accountName: string;
  baseBalance: number;
  projectedBalance: number;
  daily: DailyRow[];
};

export type EventAnnotation = {
  id?: number;
  date: string;
  label: string;
  description?: string;
  type: "auto" | "manual" | "imported";
  confidence?: number;
};

export type ForecastModel = {
  type: "prophet" | "simple";
  trainedOn: number;
  horizonDays: number;
  accuracy?: { mape: number };
  seasonality?: string[];
  last_trained?: string;
  backtesting_available?: boolean;
};

export type ForecastTrends = {
  avgDailyIncome: number;
  avgDailyExpense: number;
  avgDailyNet: number;
};

export type ForecastResponse = {
  days: number;
  baseBalance: number;
  currentBalance?: number; // Alias pour baseBalance
  projectedBalance: number;
  futureImpact: number;
  daily: DailyRow[];
  forecast?: DailyRow[]; // Alias pour daily
  perAccount: ForecastAccount[];
  events?: EventAnnotation[];
  model?: ForecastModel;
  trends?: ForecastTrends;
};

export type ConfidenceZone = {
  date: string;
  predicted: number;
  upperBound: number;
  lowerBound: number;
  optimistic: number;
  pessimistic: number;
};

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type RiskIndicator = {
  level: RiskLevel;
  score: number;
  daysToNegative: number | null;
  minimumBalance: number;
  alerts: string[];
};

export type ScenarioImpact = {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  type: "expense" | "revenue" | "delay";
  enabled: boolean;
  value: number;
  unit: "€" | "days";
  min: number;
  max: number;
  step: number;
  defaultValue: number;
};
