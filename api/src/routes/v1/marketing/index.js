const express = require('express');
const router = express.Router();

// Marketing module routes (placeholder - to be implemented)
router.use('/posts', require('./posts'));
router.use('/social', require('./social'));
router.use('/content', require('./content'));
router.use('/analytics', require('./analytics'));
router.use('/inbox', require('./inbox'));

module.exports = router;
