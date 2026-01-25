export type AuthResponse = {
  user?: Record<string, unknown>;
  token?: string;
  role?: string;
  userId?: number;
  companyId?: number;
  requires2FA?: boolean;
  message?: string;
};

export type User = {
  id?: number;
  email?: string;
  role?: string;
  companyId?: number;
  isDemo?: boolean;
};

export type LoginCredentials = {
  email: string;
  password: string;
  twoFACode?: string;
};

export type RegisterForm = Record<string, unknown> & {
  email: string;
};
