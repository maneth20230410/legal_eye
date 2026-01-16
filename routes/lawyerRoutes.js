const express = require('express');
const router = express.Router();
const lawyerController = require('../controllers/lawyerController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public routes
router.get('/', lawyerController.getAllLawyers);
router.get('/search', lawyerController.searchLawyers);
router.get('/:id', lawyerController.getLawyerById);
router.get('/:id/availability', lawyerController.getLawyerAvailability);
router.get('/:id/stats', lawyerController.getLawyerStats);

// Protected routes - Lawyer only
router.post('/', protect, authorize('lawyer'), lawyerController.createLawyerProfile);
router.put('/:id', protect, authorize('lawyer'), lawyerController.updateLawyerProfile);
router.post('/:id/availability', protect, authorize('lawyer'), lawyerController.setAvailability);

module.exports = router;