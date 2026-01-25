/**
 * Types TypeScript pour les API request bodies
 * Ces types garantissent la cohérence et la sécurité des appels API
 */

// ==========================================
// AUTH
// ==========================================

export type LoginRequest = {
  email: string;
  password: string;
  twoFACode?: string;
};

export type RegisterRequest = {
  companyName: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
};

export type PasswordResetRequest = {
  email: string;
};

export type PasswordResetConfirmRequest = {
  token: string;
  newPassword: string;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

export type TwoFactorVerifyRequest = {
  code: string;
};

// ==========================================
// CURRENCY
// ==========================================

export type CurrencyPreferenceRequest = {
  currency: string;
};

// ==========================================
// PAYMENT FLOWS
// ==========================================

export type CreatePaymentFlowRequest = {
  name: string;
  type: string;
  amount?: number;
  frequency?: string;
  description?: string;
};

export type UpdatePaymentFlowRequest = Partial<CreatePaymentFlowRequest>;

// ==========================================
// TRANSACTIONS
// ==========================================

export type CreateTransactionRequest = {
  description: string;
  amount: number;
  date: string;
  accountId: number;
  categoryId?: number;
  flowId?: number;
  portfolioId?: number;
  type: 'INCOME' | 'EXPENSE';
};

export type UpdateTransactionRequest = Partial<CreateTransactionRequest>;

export type BulkDeleteRequest = {
  ids: number[];
};

// ==========================================
// ACCOUNTS
// ==========================================

export type CreateAccountRequest = {
  name: string;
  type: string;
  initialBalance?: number;
  currency?: string;
  portfolioId?: number;
};

export type UpdateAccountRequest = Partial<CreateAccountRequest> & {
  status?: string;
};

export type ReassignAccountRequest = {
  targetAccountId: number;
};

// ==========================================
// BUDGETS
// ==========================================

export type CreateBudgetRequest = {
  name: string;
  amount: number;
  period: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM';
  categoryId?: number | null;
  portfolioId?: number | null;
  startDate?: string;
  endDate?: string | null;
};

export type UpdateBudgetRequest = Partial<CreateBudgetRequest>;

// ==========================================
// CATEGORIES
// ==========================================

export type CreateCategoryRequest = {
  name: string;
  kind: 'INCOME' | 'EXPENSE';
  color?: string;
  icon?: string;
};

export type UpdateCategoryRequest = Partial<CreateCategoryRequest>;

// ==========================================
// PORTFOLIOS
// ==========================================

export type CreatePortfolioRequest = {
  name: string;
  description?: string;
  color?: string;
};

export type UpdatePortfolioRequest = Partial<CreatePortfolioRequest>;

// ==========================================
// PEOPLE / INVITATIONS
// ==========================================

export type InviteUserRequest = {
  email: string;
  role: 'ADMIN' | 'MEMBER' | 'VIEWER';
};

export type UpdateUserRoleRequest = {
  role: 'ADMIN' | 'MEMBER' | 'VIEWER';
};

// ==========================================
// FORECAST EVENTS
// ==========================================

export type CreateForecastEventRequest = {
  title: string;
  amount: number;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  categoryId?: number;
  accountId?: number;
  recurring?: boolean;
  frequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
};

export type UpdateForecastEventRequest = Partial<CreateForecastEventRequest>;

// ==========================================
// IMPORT
// ==========================================

export type ConfirmImportRequest = {
  sessionId: string;
  mappings: Record<string, string>;
  ignoreWarnings?: boolean;
};

// ==========================================
// SETTINGS
// ==========================================

export type UpdateNotificationSettingsRequest = {
  emailNotifications?: boolean;
  transactionAlerts?: boolean;
  budgetAlerts?: boolean;
  weeklyReport?: boolean;
  monthlyReport?: boolean;
};

export type UpdateCompanySettingsRequest = {
  companyName?: string;
  language?: string;
  timezone?: string;
  fiscalYearStart?: string;
};

// ==========================================
// NPS SURVEY
// ==========================================

export type NPSSubmitRequest = {
  score: number;
  feedback?: string;
  page?: string;
};

// ==========================================
// BILLING
// ==========================================

export type CreateCheckoutSessionRequest = {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
};
