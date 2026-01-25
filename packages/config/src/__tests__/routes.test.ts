import { ROUTES, validateRouteParam } from '../routes';

describe('ROUTES Configuration', () => {
  describe('Structure Validation', () => {
    it('should have consistent nested structure for Finance ACCOUNTS', () => {
      expect(ROUTES.FINANCE.DASHBOARD.ACCOUNTS).toHaveProperty('HOME');
      expect(ROUTES.FINANCE.DASHBOARD.ACCOUNTS).toHaveProperty('NEW');
      expect(ROUTES.FINANCE.DASHBOARD.ACCOUNTS).toHaveProperty('DETAIL');
      expect(ROUTES.FINANCE.DASHBOARD.ACCOUNTS.HOME).toBe('/dashboard/accounts');
      expect(ROUTES.FINANCE.DASHBOARD.ACCOUNTS.NEW).toBe('/dashboard/accounts/new');
    });

    it('should have consistent nested structure for Finance BUDGETS', () => {
      expect(ROUTES.FINANCE.DASHBOARD.BUDGETS).toHaveProperty('HOME');
      expect(ROUTES.FINANCE.DASHBOARD.BUDGETS).toHaveProperty('DETAIL');
      expect(ROUTES.FINANCE.DASHBOARD.BUDGETS.HOME).toBe('/dashboard/budgets');
    });

    it('should have nested structure for Marketing ACCOUNTS', () => {
      expect(ROUTES.MARKETING.DASHBOARD.ACCOUNTS).toHaveProperty('HOME');
      expect(ROUTES.MARKETING.DASHBOARD.ACCOUNTS.HOME).toBe('/dashboard/accounts');
    });

    it('should have API routes under API namespace', () => {
      expect(ROUTES.API.AUTH.LOGIN).toBe('/api/auth/login');
      expect(ROUTES.API.AUTH.LOGOUT).toBe('/api/auth/logout');
      expect(ROUTES.API.AUTH.REGISTER).toBe('/api/auth/register');
    });
  });

  describe('Dynamic Routes', () => {
    it('should build dynamic routes correctly', () => {
      expect(ROUTES.FINANCE.DASHBOARD.ACCOUNTS.DETAIL('123')).toBe('/dashboard/accounts/123');
      expect(ROUTES.FINANCE.DASHBOARD.BUDGETS.DETAIL('abc')).toBe('/dashboard/budgets/abc');
    });
  });

  describe('Type Safety', () => {
    it('should validate route parameters', () => {
      expect(() => validateRouteParam('valid-id-123')).not.toThrow();
      expect(() => validateRouteParam('')).toThrow('Invalid id parameter');
      expect(() => validateRouteParam('invalid/id')).toThrow('contains invalid characters');
    });
  });

  describe('No Deprecated Routes', () => {
    it('should not have ACCOUNTS_NEW at root level', () => {
      expect(ROUTES.FINANCE.DASHBOARD).not.toHaveProperty('ACCOUNTS_NEW');
    });

    it('should not have flat legacy routes at root', () => {
      expect(ROUTES).not.toHaveProperty('DASHBOARD_POSTS');
      expect(ROUTES).not.toHaveProperty('DASHBOARD_POSTS_NEW');
      expect(ROUTES).not.toHaveProperty('DASHBOARD_CALENDAR');
    });
  });
});
