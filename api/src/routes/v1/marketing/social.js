const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../middleware/auth');

/**
 * GET /api/v1/marketing/social
 * List connected social accounts
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { companyId } = req.user;
    const socialAccounts = await req.prisma.socialAccount.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(socialAccounts);
  } catch (error) {
    console.error('Error fetching social accounts:', error);
    res.status(500).json({ error: 'Failed to fetch social accounts' });
  }
});

/**
 * POST /api/v1/marketing/social/connect
 * Connect a new social account (placeholder)
 */
router.post('/connect', authMiddleware, async (req, res) => {
  res.status(501).json({ 
    error: 'Not implemented yet',
    message: 'Social account connection will be implemented in next phase'
  });
});

module.exports = router;
