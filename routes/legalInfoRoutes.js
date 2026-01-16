const express = require('express');
const router = express.Router();
const legalInfoController = require('../controllers/legalInfoController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public routes
router.get('/', legalInfoController.getAllArticles);
router.get('/search', legalInfoController.searchArticles);
router.get('/category', legalInfoController.getArticlesByCategory);
router.get('/popular', legalInfoController.getPopularArticles);
router.get('/:id', legalInfoController.getArticleById);
router.get('/:id/related', legalInfoController.getRelatedArticles);

// Protected routes - Admin only
router.post('/', protect, authorize('admin'), legalInfoController.createArticle);
router.put('/:id', protect, authorize('admin'), legalInfoController.updateArticle);
router.delete('/:id', protect, authorize('admin'), legalInfoController.deleteArticle);

module.exports = router;