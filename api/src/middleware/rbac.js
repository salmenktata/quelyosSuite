const logger = require("../../logger");

/**
 * Permissions système RBAC granulaire
 * Format: { resource: [actions] }
 */
const PERMISSIONS = {
  ADMIN: {
    users: ["create", "read", "update", "delete"],
    companies: ["create", "read", "update", "delete"],
    accounts: ["create", "read", "update", "delete"],
    transactions: ["create", "read", "update", "delete"],
    budgets: ["create", "read", "update", "delete"],
    categories: ["create", "read", "update", "delete"],
    portfolios: ["create", "read", "update", "delete"],
    reports: ["read", "export"],
    settings: ["read", "update"],
    admin: ["all"]
  },
  MANAGER: {
    users: ["read"],
    accounts: ["create", "read", "update"],
    transactions: ["create", "read", "update", "delete"],
    budgets: ["create", "read", "update", "delete"],
    categories: ["create", "read", "update"],
    portfolios: ["create", "read", "update", "delete"],
    reports: ["read", "export"],
    settings: ["read"]
  },
  USER: {
    accounts: ["read"],
    transactions: ["read"],
    budgets: ["read"],
    categories: ["read"],
    portfolios: ["read"],
    reports: ["read"]
  },
  VIEWER: {
    accounts: ["read"],
    transactions: ["read"],
    budgets: ["read"],
    categories: ["read"],
    reports: ["read"]
  },
  // ═══════════════════════════════════════════════════════════════════
  // RH MODULE ROLES
  // ═══════════════════════════════════════════════════════════════════
  RH_ADMIN: {
    // Full access to all RH resources
    rh_stores: ["create", "read", "update", "delete"],
    rh_teams: ["create", "read", "update", "delete"],
    rh_employees: ["create", "read", "update", "delete"],
    rh_contracts: ["create", "read", "update", "delete"],
    rh_documents: ["create", "read", "update", "delete", "download"],
    rh_pointage: ["create", "read", "update", "delete", "validate"],
    rh_demandes: ["create", "read", "approve", "reject"],
    rh_planning: ["create", "read", "update", "delete"],
    rh_reports: ["read", "export"],
    rh_admin: ["all"]
  },
  RH_MANAGER: {
    // Team manager: can manage their team and approve team-level requests
    rh_stores: ["read"],
    rh_teams: ["read", "update"], // Can update own team
    rh_employees: ["read", "update"], // Can update team members
    rh_contracts: ["read"],
    rh_documents: ["read", "download"],
    rh_pointage: ["read", "validate"], // Can validate team pointages
    rh_demandes: ["read", "approve"], // Can approve team-level requests
    rh_planning: ["create", "read", "update"], // Can manage team planning
    rh_reports: ["read"]
  },
  RH_AGENT: {
    // Employee: limited to own data
    rh_stores: ["read"],
    rh_teams: ["read"],
    rh_employees: ["read"], // Can read own profile
    rh_contracts: ["read"], // Can read own contracts
    rh_documents: ["read", "download"], // Can read/download own documents
    rh_pointage: ["create", "read"], // Can create own pointages and view history
    rh_demandes: ["create", "read"], // Can create and view own requests
    rh_planning: ["read"] // Can view own shifts
  }
};

/**
 * Vérifie si un rôle a la permission sur une ressource/action
 * @param {string} role - Rôle de l'utilisateur (ADMIN, MANAGER, USER, VIEWER)
 * @param {string} resource - Ressource (users, accounts, transactions, etc.)
 * @param {string} action - Action (create, read, update, delete, export, all)
 * @returns {boolean}
 */
function hasPermission(role, resource, action) {
  const rolePermissions = PERMISSIONS[role];
  
  if (!rolePermissions) {
    return false;
  }

  // ADMIN et RH_ADMIN ont toujours accès via admin.all
  if (role === "ADMIN" && rolePermissions.admin?.includes("all")) {
    return true;
  }

  if (role === "RH_ADMIN" && rolePermissions.rh_admin?.includes("all")) {
    return true;
  }

  const resourcePermissions = rolePermissions[resource];
  
  if (!resourcePermissions) {
    return false;
  }

  return resourcePermissions.includes(action);
}

/**
 * Middleware RBAC - vérifie les permissions avant d'exécuter une route
 * Usage: router.post('/accounts', rbac('accounts', 'create'), ...)
 * 
 * @param {string} resource - Ressource protégée
 * @param {string} action - Action requise
 * @returns {Function} Middleware Express
 */
function rbac(resource, action) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      logger.error("RBAC: User or role missing in request", { 
        path: req.path, 
        method: req.method 
      });
      return res.status(401).json({ error: "Authentication required" });
    }

    const { role, userId } = req.user;

    if (!hasPermission(role, resource, action)) {
      logger.warn("RBAC: Permission denied", {
        userId,
        role,
        resource,
        action,
        path: req.path,
        method: req.method
      });
      
      return res.status(403).json({ 
        error: "Insufficient permissions",
        required: { resource, action }
      });
    }

    // Permission accordée
    logger.info("RBAC: Permission granted", {
      userId,
      role,
      resource,
      action,
      path: req.path
    });

    next();
  };
}

/**
 * Middleware pour routes admin uniquement
 */
function adminOnly(req, res, next) {
  return rbac("admin", "all")(req, res, next);
}

/**
 * Middleware pour routes manager et admin
 */
function managerOrAdmin(req, res, next) {
  if (!req.user || !req.user.role) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (["ADMIN", "MANAGER"].includes(req.user.role)) {
    return next();
  }

  return res.status(403).json({
    error: "Insufficient permissions",
    required: "MANAGER or ADMIN role"
  });
}

/**
 * Middleware pour routes RH admin uniquement
 */
function rhAdminOnly(req, res, next) {
  return rbac("rh_admin", "all")(req, res, next);
}

/**
 * Middleware pour routes RH manager et admin
 */
function rhManagerOrAdmin(req, res, next) {
  if (!req.user || !req.user.role) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (["RH_ADMIN", "RH_MANAGER", "ADMIN"].includes(req.user.role)) {
    return next();
  }

  return res.status(403).json({
    error: "Insufficient permissions",
    required: "RH_MANAGER or RH_ADMIN role"
  });
}

/**
 * Middleware pour toute personne avec un rôle RH (agent, manager, admin)
 */
function rhOnly(req, res, next) {
  if (!req.user || !req.user.role) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (["RH_ADMIN", "RH_MANAGER", "RH_AGENT", "ADMIN"].includes(req.user.role)) {
    return next();
  }

  return res.status(403).json({
    error: "Insufficient permissions",
    required: "RH role required"
  });
}

module.exports = {
  rbac,
  adminOnly,
  managerOrAdmin,
  rhAdminOnly,
  rhManagerOrAdmin,
  rhOnly,
  hasPermission,
  PERMISSIONS
};
