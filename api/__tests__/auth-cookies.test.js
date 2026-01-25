const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');

// Import routes (adjust path as needed)
const authRoutes = require('../src/routes/auth');

describe('Auth API - Cookie Security Tests', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/auth', authRoutes);
  });

  describe('POST /auth/login', () => {
    it('should set httpOnly cookies on successful login', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@quelyos.com',
          password: 'Test123!@#',
        });

      // Check response
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('user');

      // Check cookies are set
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.length).toBeGreaterThanOrEqual(2);

      // Check accessToken cookie
      const accessTokenCookie = cookies.find(c => c.startsWith('accessToken='));
      expect(accessTokenCookie).toBeDefined();
      expect(accessTokenCookie).toContain('HttpOnly');
      expect(accessTokenCookie).toContain('SameSite=Strict');

      // Check refreshToken cookie
      const refreshTokenCookie = cookies.find(c => c.startsWith('refreshToken='));
      expect(refreshTokenCookie).toBeDefined();
      expect(refreshTokenCookie).toContain('HttpOnly');
      expect(refreshTokenCookie).toContain('SameSite=Strict');
    });

    it('should NOT return token in response body', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@quelyos.com',
          password: 'Test123!@#',
        });

      // Tokens should be in cookies, NOT in body
      expect(res.body.accessToken).toBeUndefined();
      expect(res.body.refreshToken).toBeUndefined();
      expect(res.body.token).toBeUndefined();
    });

    it('should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@quelyos.com',
          password: 'WrongPassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');

      // No cookies should be set on failure
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeUndefined();
    });

    it('should reject missing email or password', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@quelyos.com',
          // password missing
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('POST /auth/logout', () => {
    it('should clear cookies on logout', async () => {
      // First login to get cookies
      const loginRes = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@quelyos.com',
          password: 'Test123!@#',
        });

      const cookies = loginRes.headers['set-cookie'];

      // Then logout
      const logoutRes = await request(app)
        .post('/auth/logout')
        .set('Cookie', cookies);

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body).toHaveProperty('success', true);

      // Check cookies are cleared
      const clearedCookies = logoutRes.headers['set-cookie'];
      expect(clearedCookies).toBeDefined();

      const accessTokenCleared = clearedCookies.find(c => c.startsWith('accessToken='));
      expect(accessTokenCleared).toBeDefined();
      expect(accessTokenCleared).toContain('Max-Age=0'); // Expired

      const refreshTokenCleared = clearedCookies.find(c => c.startsWith('refreshToken='));
      expect(refreshTokenCleared).toBeDefined();
      expect(refreshTokenCleared).toContain('Max-Age=0');
    });
  });

  describe('GET /auth/validate - Cookie Support', () => {
    it('should validate user from httpOnly cookie', async () => {
      // First login to get cookies
      const loginRes = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@quelyos.com',
          password: 'Test123!@#',
        });

      const cookies = loginRes.headers['set-cookie'];

      // Validate with cookie (not Authorization header)
      const validateRes = await request(app)
        .get('/auth/validate')
        .set('Cookie', cookies);

      expect(validateRes.status).toBe(200);
      expect(validateRes.body).toHaveProperty('valid', true);
      expect(validateRes.body).toHaveProperty('user');
    });

    it('should support backward compatibility with Bearer token', async () => {
      // Get token from login (for backward compat testing)
      const loginRes = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@quelyos.com',
          password: 'Test123!@#',
        });

      // Extract token from cookie manually
      const cookies = loginRes.headers['set-cookie'];
      const accessTokenCookie = cookies.find(c => c.startsWith('accessToken='));
      const token = accessTokenCookie.split(';')[0].split('=')[1];

      // Use Authorization header instead of cookie
      const validateRes = await request(app)
        .get('/auth/validate')
        .set('Authorization', `Bearer ${token}`);

      expect(validateRes.status).toBe(200);
      expect(validateRes.body).toHaveProperty('valid', true);
    });

    it('should reject requests without cookie or header', async () => {
      const res = await request(app)
        .get('/auth/validate');

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('should reject expired or invalid cookies', async () => {
      const res = await request(app)
        .get('/auth/validate')
        .set('Cookie', 'accessToken=invalid_token_here');

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('Security - XSS Protection', () => {
    it('should NOT expose tokens in any response body', async () => {
      const loginRes = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@quelyos.com',
          password: 'Test123!@#',
        });

      // Check no token in response
      const bodyString = JSON.stringify(loginRes.body);
      expect(bodyString).not.toMatch(/eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/); // JWT pattern

      // Tokens should only be in cookies
      const cookies = loginRes.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some(c => c.includes('eyJ'))).toBe(true); // JWT in cookie
    });

    it('should set Secure flag in production', async () => {
      // Mock production environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@quelyos.com',
          password: 'Test123!@#',
        });

      const cookies = res.headers['set-cookie'];
      cookies.forEach(cookie => {
        if (cookie.startsWith('accessToken=') || cookie.startsWith('refreshToken=')) {
          expect(cookie).toContain('Secure');
        }
      });

      // Restore environment
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Performance - Cookie Size', () => {
    it('should keep cookies under 4KB limit', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@quelyos.com',
          password: 'Test123!@#',
        });

      const cookies = res.headers['set-cookie'];
      cookies.forEach(cookie => {
        const sizeInBytes = Buffer.byteLength(cookie, 'utf8');
        expect(sizeInBytes).toBeLessThan(4096); // 4KB browser limit
      });
    });
  });
});
