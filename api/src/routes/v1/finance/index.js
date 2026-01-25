const express = require('express');
const router = express.Router();

// Finance module routes
router.use('/accounts', require('./accounts'));
router.use('/transactions', require('./transactions'));
router.use('/budgets', require('./budgets'));
router.use('/categories', require('./categories'));
router.use('/portfolios', require('./portfolios'));
router.use('/dashboard', require('./dashboard'));
router.use('/reporting', require('./reporting'));
router.use('/import', require('./import'));
router.use('/export', require('./export'));
router.use('/payment-flows', require('./paymentFlows'));
router.use('/alerts', require('./alerts'));
router.use('/suggestions', require('./ml-suggestions'));
router.use('/duplicates', require('./ml-duplicates'));
router.use('/anomalies', require('./ml-anomalies'));
router.use('/budget-recommendations', require('./budget-recommendations'));
router.use('/customers', require('./customers'));
router.use('/customer-invoices', require('./customer-invoices'));
router.use('/credit-scoring', require('./credit-scoring'));

// F92 - Supplier Management
router.use('/suppliers', require('./suppliers'));
router.use('/supplier-invoices', require('./suppliers')); // Même fichier
router.use('/payment-planning', require('./payment-planning'));

module.exports = router;
