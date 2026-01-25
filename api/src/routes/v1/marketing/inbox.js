const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../middleware/auth');

/**
 * GET /api/v1/marketing/inbox
 * Get inbox messages
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { companyId } = req.user;
    const { isRead } = req.query;
    
    const where = { companyId };
    if (isRead !== undefined) {
      where.isRead = isRead === 'true';
    }
    
    const messages = await req.prisma.inboxMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(messages);
  } catch (error) {
    console.error('Error fetching inbox:', error);
    res.status(500).json({ error: 'Failed to fetch inbox messages' });
  }
});

/**
 * PATCH /api/v1/marketing/inbox/:id/read
 * Mark message as read
 */
router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;
    
    const message = await req.prisma.inboxMessage.updateMany({
      where: { id: parseInt(id), companyId },
      data: { isRead: true }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Failed to update message' });
  }
});

module.exports = router;
