require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const { PrismaClient } = require('@prisma/client');
const { authedLimiter } = require('./src/middleware/rateLimiters');
const { initSentry } = require('./src/sentry');
const { prometheusMiddleware, metricsHandler } = require('./src/middleware/prometheus');

const app = express();
const prisma = require('./prismaClient');
const sentry = initSentry(app);
app.disable('x-powered-by');
app.set('trust proxy', 1);

// ------------ MIDDLEWARES ------------
const allowedOrigins = (process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

// Valider configuration CORS au démarrage
if (allowedOrigins.length === 0 && process.env.NODE_ENV === 'production') {
  console.error('❌ FATAL: CORS_ORIGINS non configuré en production');
  console.error('💡 Définissez CORS_ORIGINS=https://app.quelyos.com,https://finance.quelyos.com');
  process.exit(1);
}

if (allowedOrigins.length === 0) {
  console.warn('⚠️  CORS_ORIGINS vide - toutes origines seront rejetées (sauf server-to-server)');
  console.warn('💡 Pour dev local, définissez: CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002');
}

// SECURITY: Default to true for httpOnly cookie authentication
// Set to false explicitly in env if you don't need cookie-based auth
const allowCredentials = /^true$/i.test(process.env.CORS_ALLOW_CREDENTIALS || 'true');

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // ex: curl/server-to-server
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Logger les origines rejetées pour debug
    console.warn(`⚠️  CORS rejeté pour origine: ${origin}`);
    console.warn(`   Origines autorisées: ${allowedOrigins.join(', ') || '(aucune)'}`);
    return callback(null, false);
  },
  credentials: allowCredentials,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
};

const requestLogger = morgan('combined', {
  skip: () => process.env.NODE_ENV === 'test'
});

app.use(requestLogger);
app.use(cors(corsOptions));
const connectSrc = ["'self'"];
if (process.env.CSP_CONNECT_SRC_EXTRA) {
  process.env.CSP_CONNECT_SRC_EXTRA
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
    .forEach((o) => connectSrc.push(o));
}

// Main Helmet middleware with strict CSP
const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'none'"],
      connectSrc,
      imgSrc: ["'self'", 'data:'],
      scriptSrc: ["'none'"],
      styleSrc: ["'none'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'none'"]
    }
  },
  // HSTS - HTTP Strict Transport Security
  // Forces browsers to use HTTPS for all future requests (1 year)
  hsts: {
    maxAge: parseInt(process.env.HSTS_MAX_AGE || '31536000'), // 1 year default
    includeSubDomains: /^true$/i.test(process.env.HSTS_INCLUDE_SUBDOMAINS || 'true'),
    preload: /^true$/i.test(process.env.HSTS_PRELOAD || 'false')
  },
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'no-referrer' },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false
});

// Relaxed Helmet middleware for Swagger UI
const swaggerHelmetMiddleware = helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https://validator.swagger.io'],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Swagger needs inline scripts
      styleSrc: ["'self'", "'unsafe-inline'"], // Swagger needs inline styles
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"]
    }
  },
  hsts: {
    maxAge: parseInt(process.env.HSTS_MAX_AGE || '31536000'),
    includeSubDomains: /^true$/i.test(process.env.HSTS_INCLUDE_SUBDOMAINS || 'true'),
    preload: /^true$/i.test(process.env.HSTS_PRELOAD || 'false')
  },
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'no-referrer' },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false
});

app.use((req, res, next) => {
  // No CSP for health endpoint (monitoring tools)
  if (req.path === '/health') {
    return next();
  }

  // Relaxed CSP for Swagger UI (still has security headers but allows inline scripts/styles)
  if (req.path.startsWith('/api-docs')) {
    return swaggerHelmetMiddleware(req, res, next);
  }

  // Strict CSP for all other endpoints
  return helmetMiddleware(req, res, next);
});
app.use(compression());

// ------------ STRIPE WEBHOOKS (BEFORE JSON PARSING) ------------
// Webhook endpoint needs raw body for signature verification
const StripeService = require('./src/services/StripeService');
const logger = require('./logger');
app.post(
  "/billing/webhooks",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["stripe-signature"];
    try {
      const event = await StripeService.constructEvent(req.body, signature);
      logger.info(`[Stripe] Webhook received: ${event.type}`);

      switch (event.type) {
        case "customer.subscription.created":
          await StripeService.handleSubscriptionCreated(event.data.object);
          break;
        case "customer.subscription.updated":
          await StripeService.handleSubscriptionUpdated(event.data.object);
          break;
        case "customer.subscription.deleted":
          await StripeService.handleSubscriptionDeleted(event.data.object);
          break;
        case "invoice.payment_succeeded":
          await StripeService.handleInvoicePaymentSucceeded(event.data.object);
          break;
        case "invoice.payment_failed":
          logger.warn(`[Stripe] Payment failed for invoice ${event.data.object.id}`);
          break;
        default:
          logger.info(`[Stripe] Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      logger.error("[Stripe] Webhook error:", error);
      res.status(400).json({ error: error.message });
    }
  }
);

app.use(express.json({ limit: '1mb' }));

// Cookie parser with signing support for secure cookies
const cookieSecret = process.env.COOKIE_SECRET || process.env.JWT_SECRET;
if (!cookieSecret) {
  console.error('❌ FATAL: No COOKIE_SECRET or JWT_SECRET found');
  process.exit(1);
}
app.use(cookieParser(cookieSecret));

// CSRF Protection (conditional - can be disabled for gradual rollout)
const csrfEnabled = /^true$/i.test(process.env.CSRF_ENABLED || 'false');
if (csrfEnabled) {
  const { csrfProtection, setCSRFCookie } = require('./src/middleware/csrf');
  app.use(csrfProtection);
  console.log('✅ CSRF protection enabled');
} else {
  console.warn('⚠️  CSRF protection disabled - set CSRF_ENABLED=true to enable');
}

// Prometheus metrics collection
app.use(prometheusMiddleware);

// Prisma middleware pour les routes
app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

// ------------ API DOCUMENTATION (SWAGGER) ------------
const { specs, swaggerUi } = require('./src/swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Quelyos API Documentation',
}));
console.log('📚 Swagger documentation available at /api-docs');

// ------------ API V1 ROUTES (NEW STRUCTURE) ------------
app.use("/api/v1", authedLimiter);
app.use("/api/v1", require("./src/routes/v1"));

// ------------ LEGACY ROUTES (BACKWARD COMPATIBILITY) ------------
// Routes publiques
app.use("/auth", require("./src/routes/auth"));
app.use("/auth/oauth", require("./src/routes/oauth"));

// Routes protégées (legacy)
app.use([
  "/budgets",
  "/accounts",
  "/transactions",
  "/dashboard",
  "/reporting",
  "/categories",
  "/portfolios",
  "/users",
  "/company",
  "/admin",
  "/settings",
  "/user",
  "/currencies"
], authedLimiter);

app.use("/budgets", require("./src/routes/budgets"));
app.use("/accounts", require("./src/routes/accounts"));
app.use("/company/accounts", require("./src/routes/accounts"));
app.use("/transactions", require("./src/routes/transactions"));
app.use("/dashboard", require("./src/routes/dashboard"));
app.use("/reporting", require("./src/routes/reporting"));
app.use("/kpi-alerts", require("./src/routes/kpi-alerts"));
app.use("/actions", require("./src/routes/actions"));
app.use("/forecast-events", require("./src/routes/forecast-events"));
app.use("/categories", require("./src/routes/categories"));
app.use("/portfolios", require("./src/routes/portfolios"));
app.use("/users", require("./src/routes/users"));
app.use("/company", require("./src/routes/company"));
app.use("/company/team", require("./src/routes/team"));
app.use("/admin", require("./src/routes/admin"));
// System config routes are already mounted via /admin router
app.use("/settings", require("./src/routes/settings"));
app.use("/currencies", require("./src/routes/currencies"));
app.use("/billing", authedLimiter, require("./src/routes/billing"));
app.use("/user", require("./src/routes/paymentFlows"));
app.use("/user/notifications", require("./src/routes/notifications"));
app.use("/user", require("./src/routes/user"));
app.use("/user", require("./src/routes/security"));
app.use("/user/transactions", require("./src/routes/export"));
app.use(require("./src/routes/import"));
app.use("/company/import/smart", require("./src/routes/smartImport"));

// ------------ ERREURS MULTER / UPLOAD ------------
app.use((err, req, res, next) => {
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Fichier trop volumineux (>10 Mo)' });
  }
  if (err && err.message && err.message.includes('Type de fichier non supporté')) {
    return res.status(415).json({ error: err.message });
  }
  return next(err);
});

// ------------ SENTRY ERRORS ------------
if (sentry.enabled) {
  const Sentry = require('@sentry/node');
  app.use(Sentry.Handlers.errorHandler());
}

// ------------ HEALTH CHECK ------------
app.get('/health', async (req, res) => {
  const healthcheck = {
    service: "Quelyos Finance API",
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: "OK",
    database: "unknown"
  };

  try {
    // Tester la connexion database
    await prisma.$queryRaw`SELECT 1`;
    healthcheck.database = "connected";
    healthcheck.status = "OK";
    return res.status(200).json(healthcheck);
  } catch (error) {
    healthcheck.database = "disconnected";
    healthcheck.status = "DEGRADED";
    healthcheck.error = error.message;
    return res.status(503).json(healthcheck);
  }
});

// ------------ PROMETHEUS METRICS ------------
app.get('/metrics', metricsHandler);

// ------------ ROOT ------------
app.get('/', (req, res) => {
  res.send("Quelyos API is running.");
});

// ------------ VALIDATION ENVIRONNEMENT ------------
if (process.env.NODE_ENV !== 'test') {
  // Vérification obligatoire du JWT_SECRET
  if (!process.env.JWT_SECRET) {
    console.error('❌ FATAL ERROR: JWT_SECRET environment variable is not defined');
    console.error('💡 Solution: Set JWT_SECRET in your .env file (minimum 32 characters)');
    console.error('📝 Example: JWT_SECRET=your-super-secret-jwt-key-min-32-characters');
    process.exit(1);
  }

  // Vérification longueur minimale
  if (process.env.JWT_SECRET.length < 32) {
    console.error('❌ FATAL ERROR: JWT_SECRET must be at least 32 characters long');
    console.error(`💡 Current length: ${process.env.JWT_SECRET.length} characters`);
    process.exit(1);
  }

  // Warning si JWT_SECRET par défaut détecté
  if (process.env.JWT_SECRET === 'change-me' || process.env.JWT_SECRET.includes('example')) {
    console.warn('⚠️  WARNING: You are using a default or example JWT_SECRET');
    console.warn('⚠️  This is INSECURE for production. Generate a secure secret immediately.');
  }

  // Vérification DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ FATAL ERROR: DATABASE_URL environment variable is not defined');
    console.error('💡 Solution: Set DATABASE_URL in your .env file');
    process.exit(1);
  }
}

// ------------ START SERVER ------------
const PORT = process.env.PORT || 3000;

// Seed automatique - DÉSACTIVÉ PAR DÉFAUT pour éviter écrasement données
// Nécessite SEED_ON_START=true ET un environnement autorisé
const SEED_ALLOWED_ENVS = ['development', 'test'];

async function autoSeed() {
  const currentEnv = process.env.NODE_ENV || 'production';
  const seedRequested = process.env.SEED_ON_START === 'true';
  
  // Refuser catégoriquement en production/staging
  if (!SEED_ALLOWED_ENVS.includes(currentEnv)) {
    if (seedRequested) {
      console.error('❌ SEED_ON_START=true ignoré : seeding interdit en', currentEnv);
      console.error('💡 Environnements autorisés:', SEED_ALLOWED_ENVS.join(', '));
    }
    return;
  }
  
  // Exiger flag explicite même en dev
  if (!seedRequested) {
    console.log('ℹ️  Auto-seed désactivé. Utilisez SEED_ON_START=true pour l\'activer.');
    return;
  }
  
  try {
    console.log('🌱 Seeding database...');
    const { seedDevUser } = require('./scripts/seed-dev');
    await seedDevUser();
    console.log('✅ Seeding terminé');
  } catch (error) {
    console.warn('⚠️  Auto-seed échoué:', error.message);
  }
}

// Ne pas démarrer le listener en mode test pour permettre Supertest sans ouvrir de port
if (process.env.NODE_ENV !== 'test') {
  autoSeed()
    .then(async () => {
      // Initialize Redis connection (non-blocking - app runs without it if unavailable)
      const redisClient = require('./src/services/redis-client');
      await redisClient.connect().catch((err) => {
        console.warn('⚠️  Redis connection failed - app will run without caching:', err.message);
      });

      // Démarrer le cron job pour les alertes quotidiennes
      const { startDailyAlertsCron } = require('./src/jobs/daily-alerts.cron');
      startDailyAlertsCron();

      // Démarrer le cron job pour l'entraînement ML quotidien
      const { startDailyCategorizerTraining } = require('./src/jobs/daily-categorizer-training.cron');
      startDailyCategorizerTraining();

      // Démarrer le cron job pour l'entraînement ML hebdomadaire des anomalies
      const { startWeeklyAnomalyTraining } = require('./src/jobs/daily-anomaly-training.cron');
      startWeeklyAnomalyTraining();

      // Démarrer le cron job pour le retraining mensuel des modèles Prophet
      const { startMonthlyForecastRetraining } = require('./src/jobs/monthly-forecast-retraining.cron');
      startMonthlyForecastRetraining();

      app.listen(PORT, () => {
        console.log(`🚀 API running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error('❌ Failed to start server:', err);
      process.exit(1);
    });
}

module.exports = app;
