const express = require('express');
const router = express.Router();

// API v1 routes
router.use('/finance', require('./finance'));
router.use('/marketing', require('./marketing'));
router.use('/rh', require('./rh'));

// Email test route
router.use('/test-email', require('./test-email'));

// Shared routes (auth, company, user, settings)
router.use('/auth', require('../auth'));
router.use('/company', require('../company'));
router.use('/settings', require('../settings'));
router.use('/user', require('../user'));
router.use('/users', require('../users'));
router.use('/admin', require('../admin'));

module.exports = router;
