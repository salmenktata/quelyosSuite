const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../middleware/auth');

/**
 * GET /api/v1/marketing/analytics
 * Get marketing analytics
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { companyId } = req.user;
    
    // Get post analytics summary
    const posts = await req.prisma.post.findMany({
      where: { companyId, status: 'PUBLISHED' },
      include: { analytics: true }
    });
    
    const summary = posts.reduce((acc, post) => {
      if (post.analytics) {
        acc.totalImpressions += post.analytics.impressions;
        acc.totalReach += post.analytics.reach;
        acc.totalLikes += post.analytics.likes;
        acc.totalComments += post.analytics.comments;
        acc.totalShares += post.analytics.shares;
      }
      return acc;
    }, {
      totalImpressions: 0,
      totalReach: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      totalPosts: posts.length
    });
    
    res.json(summary);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;
