const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../../../../logger');
const { loginLimiter } = require('../../../middleware/rateLimiters');
const auth = require('../../../middleware/auth');

/**
 * RH Mobile Login
 * Login avec numéro d'employé ou email
 */
router.post('/mobile-login', loginLimiter, async (req, res) => {
  const { dummyBcryptHash, constantTimeDelay } = require('../../../utils/timingProtection');
  const startTime = Date.now();

  try {
    const { email, employeeNumber, password } = req.body;

    if (!password || (!email && !employeeNumber)) {
      return res.status(400).json({
        error: 'Email ou numéro d\'employé et mot de passe requis'
      });
    }

    logger.info('[RH] Mobile login attempt', { email, employeeNumber });

    // Chercher l'employé par email ou numéro
    let employee;
    if (employeeNumber) {
      employee = await prisma.employee.findFirst({
        where: { employeeNumber },
        include: {
          user: true,
          store: true,
          team: true
        }
      });
    } else if (email) {
      employee = await prisma.employee.findFirst({
        where: {
          user: {
            email: email.toLowerCase()
          }
        },
        include: {
          user: true,
          store: true,
          team: true
        }
      });
    }

    // SECURITY: Toujours faire une comparaison bcrypt pour éviter les attaques par timing
    let valid = false;
    if (!employee || !employee.user) {
      await dummyBcryptHash();
      logger.warn('[RH] Mobile login failed - employee not found', { email, employeeNumber });
      await constantTimeDelay(100, 200, startTime);
      return res.status(400).json({ error: 'Identifiants invalides' });
    } else {
      valid = await bcrypt.compare(password, employee.user.password);
    }

    if (!valid) {
      logger.warn('[RH] Mobile login failed - invalid password', {
        email,
        employeeNumber,
        userId: employee.user.id
      });
      await constantTimeDelay(100, 200, startTime);
      return res.status(400).json({ error: 'Identifiants invalides' });
    }

    // Vérifier que l'employé est actif
    if (employee.status !== 'ACTIVE') {
      logger.warn('[RH] Mobile login failed - employee not active', {
        email,
        employeeNumber,
        status: employee.status
      });
      return res.status(403).json({ error: 'Compte employé inactif' });
    }

    const user = employee.user;
    const role = user.role || 'USER';

    logger.info('[RH] Mobile login successful', {
      email: user.email,
      userId: user.id,
      employeeId: employee.id,
      employeeNumber: employee.employeeNumber
    });

    // Générer JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        companyId: user.companyId,
        role,
        employeeId: employee.id,
        employeeNumber: employee.employeeNumber
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Retourner les informations de l'utilisateur et de l'employé
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: role
      },
      employee: {
        id: employee.id,
        employeeNumber: employee.employeeNumber,
        firstName: employee.firstName,
        lastName: employee.lastName,
        position: employee.position,
        storeId: employee.storeId,
        teamId: employee.teamId,
        store: employee.store ? {
          id: employee.store.id,
          name: employee.store.name
        } : null,
        team: employee.team ? {
          id: employee.team.id,
          name: employee.team.name
        } : null
      }
    });

  } catch (err) {
    logger.error('[RH] Mobile login error', err);
    res.status(500).json({ error: 'Échec de la connexion' });
  }
});

/**
 * RH Logout
 */
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      logger.info('[RH] Mobile logout', { token: token.substring(0, 10) + '...' });
    }

    res.json({ message: 'Déconnexion réussie' });
  } catch (err) {
    logger.error('[RH] Logout error', err);
    res.status(500).json({ error: 'Échec de la déconnexion' });
  }
});

/**
 * RH Refresh Token
 */
router.post('/refresh', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const oldToken = authHeader?.replace('Bearer ', '');

    if (!oldToken) {
      return res.status(400).json({ error: 'Token requis' });
    }

    // Vérifier le token existant
    const decoded = jwt.verify(oldToken, process.env.JWT_SECRET);

    // Vérifier que l'utilisateur existe toujours
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    // Générer un nouveau token
    const newToken = jwt.sign(
      {
        userId: user.id,
        companyId: user.companyId,
        role: user.role,
        employeeId: decoded.employeeId,
        employeeNumber: decoded.employeeNumber
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    logger.info('[RH] Token refreshed', { userId: user.id });

    res.json({ token: newToken });

  } catch (err) {
    logger.warn('[RH] Refresh token failed', { error: err.message });
    res.status(401).json({ error: 'Token invalide ou expiré' });
  }
});

/**
 * RH Validate Token
 */
router.get('/validate', auth, async (req, res) => {
  try {
    // Vérifier que l'utilisateur existe toujours
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        employee: {
          include: {
            store: true,
            team: true
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    const employee = user.employee?.[0]; // Prendre le premier employé

    if (!employee) {
      return res.status(401).json({ error: 'Employé non trouvé' });
    }

    res.json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      employee: {
        id: employee.id,
        employeeNumber: employee.employeeNumber,
        firstName: employee.firstName,
        lastName: employee.lastName,
        position: employee.position,
        storeId: employee.storeId,
        teamId: employee.teamId,
        store: employee.store ? {
          id: employee.store.id,
          name: employee.store.name
        } : null,
        team: employee.team ? {
          id: employee.team.id,
          name: employee.team.name
        } : null
      }
    });

  } catch (err) {
    logger.error('[RH] Token validation error', err);
    res.status(500).json({ error: 'Échec de la validation' });
  }
});

module.exports = router;
