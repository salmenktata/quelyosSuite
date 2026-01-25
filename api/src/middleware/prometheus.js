const promClient = require("prom-client");

// Registre Prometheus
const register = new promClient.Registry();

// Métriques système par défaut (CPU, mémoire, etc.)
promClient.collectDefaultMetrics({ 
  register,
  prefix: "quelyos_finance_"
});

// === Métriques personnalisées ===

// Compteur de requêtes HTTP
const httpRequestsTotal = new promClient.Counter({
  name: "quelyos_finance_http_requests_total",
  help: "Total des requêtes HTTP",
  labelNames: ["method", "route", "status_code"],
  registers: [register]
});

// Histogramme de durée des requêtes
const httpRequestDuration = new promClient.Histogram({
  name: "quelyos_finance_http_request_duration_seconds",
  help: "Durée des requêtes HTTP en secondes",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register]
});

// Gauge de requêtes actives
const httpRequestsActive = new promClient.Gauge({
  name: "quelyos_finance_http_requests_active",
  help: "Nombre de requêtes HTTP actives",
  registers: [register]
});

// Compteur d'authentifications
const authAttemptsTotal = new promClient.Counter({
  name: "quelyos_finance_auth_attempts_total",
  help: "Tentatives d'authentification",
  labelNames: ["status"],
  registers: [register]
});

// Compteur d'erreurs de base de données
const dbErrorsTotal = new promClient.Counter({
  name: "quelyos_finance_db_errors_total",
  help: "Erreurs de base de données",
  labelNames: ["operation"],
  registers: [register]
});

// Histogramme de durée des requêtes DB
const dbQueryDuration = new promClient.Histogram({
  name: "quelyos_finance_db_query_duration_seconds",
  help: "Durée des requêtes de base de données",
  labelNames: ["operation"],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2],
  registers: [register]
});

// Compteur de transactions financières
const transactionsTotal = new promClient.Counter({
  name: "quelyos_finance_transactions_total",
  help: "Transactions financières créées",
  labelNames: ["type", "category"],
  registers: [register]
});

// Gauge de comptes actifs
const accountsActive = new promClient.Gauge({
  name: "quelyos_finance_accounts_active",
  help: "Nombre de comptes actifs",
  registers: [register]
});

// Gauge d'utilisateurs connectés (dernières 24h)
const usersActive = new promClient.Gauge({
  name: "quelyos_finance_users_active_24h",
  help: "Utilisateurs actifs dans les dernières 24h",
  registers: [register]
});

/**
 * Middleware Prometheus pour tracer les requêtes HTTP
 */
function prometheusMiddleware(req, res, next) {
  // Ignorer /metrics et /health
  if (req.path === "/metrics" || req.path === "/health") {
    return next();
  }

  const start = Date.now();
  httpRequestsActive.inc();

  // Normaliser la route pour éviter explosion de cardinalité
  const route = normalizeRoute(req.path);

  // Capturer la fin de la requête
  const originalSend = res.send;
  res.send = function (data) {
    const duration = (Date.now() - start) / 1000;
    
    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode
    });

    httpRequestDuration.observe(
      {
        method: req.method,
        route,
        status_code: res.statusCode
      },
      duration
    );

    httpRequestsActive.dec();

    return originalSend.call(this, data);
  };

  next();
}

/**
 * Normalise les routes pour grouper les métriques
 * Ex: /accounts/123 -> /accounts/:id
 */
function normalizeRoute(path) {
  return path
    .replace(/\/\d+/g, "/:id")
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "/:uuid")
    .replace(/\?.*$/, ""); // Remove query params
}

/**
 * Route pour exposer les métriques Prometheus
 */
async function metricsHandler(req, res) {
  try {
    res.setHeader("Content-Type", register.contentType);
    const metrics = await register.metrics();
    res.send(metrics);
  } catch (err) {
    res.status(500).send(err.message);
  }
}

module.exports = {
  prometheusMiddleware,
  metricsHandler,
  register,
  metrics: {
    httpRequestsTotal,
    httpRequestDuration,
    httpRequestsActive,
    authAttemptsTotal,
    dbErrorsTotal,
    dbQueryDuration,
    transactionsTotal,
    accountsActive,
    usersActive
  }
};
