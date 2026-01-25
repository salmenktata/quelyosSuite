const express = require('express');
const router = express.Router();

/**
 * RH Module Routes
 *
 * API endpoints for human resources management:
 * - Auth (mobile authentication)
 * - Stores (magasins/sites)
 * - Teams (équipes)
 * - Employees (employés)
 * - Pointage (check-in/check-out)
 * - Demandes (congés, absences, avances)
 * - Planning (shifts)
 * - Contracts (contrats)
 * - Documents (documents RH)
 */

// Authentication (mobile app)
router.use('/auth', require('./auth'));

// Core RH
router.use('/stores', require('./stores'));
router.use('/teams', require('./teams'));
router.use('/employees', require('./employees'));
router.use('/contracts', require('./contracts'));
router.use('/documents', require('./documents'));

// Attendance & Time tracking
router.use('/pointage', require('./pointage'));

// Leave & Requests management
router.use('/demandes', require('./demandes'));

// Shift planning
router.use('/planning', require('./planning'));

module.exports = router;
