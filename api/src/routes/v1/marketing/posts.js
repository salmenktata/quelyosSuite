const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../middleware/auth');

/**
 * GET /api/v1/marketing/posts
 * List all posts for the company
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { companyId } = req.user;
    const posts = await req.prisma.post.findMany({
      where: { companyId },
      include: {
        analytics: true,
        publications: {
          include: {
            socialAccount: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

/**
 * POST /api/v1/marketing/posts
 * Create a new post
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { companyId } = req.user;
    const { content, hashtags, mediaUrl, mediaType, scheduledAt } = req.body;
    
    const post = await req.prisma.post.create({
      data: {
        content,
        hashtags: hashtags || [],
        mediaUrl,
        mediaType,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: scheduledAt ? 'SCHEDULED' : 'DRAFT',
        companyId
      }
    });
    
    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

module.exports = router;
