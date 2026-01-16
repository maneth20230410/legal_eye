const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const { validateReview } = require('../middleware/validators');

// Public routes
router.get('/lawyer/:lawyerId', reviewController.getLawyerReviews);
router.get('/lawyer/:lawyerId/rating', reviewController.getLawyerRating);

// Protected routes
router.use(protect);
router.post('/', validateReview, reviewController.createReview);
router.get('/my-reviews', reviewController.getMyReviews);
router.put('/:id', reviewController.updateReview);
router.delete('/:id', reviewController.deleteReview);

module.exports = router;