const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');
const { validateBooking } = require('../middleware/validators');

// All routes are protected
router.use(protect);

router.post('/', validateBooking, bookingController.createBooking);
router.get('/my-bookings', bookingController.getMyBookings);
router.get('/lawyer/:lawyerId', bookingController.getLawyerBookings);
router.get('/:id', bookingController.getBookingById);
router.patch('/:id/status', bookingController.updateBookingStatus);
router.patch('/:id/cancel', bookingController.cancelBooking);
router.patch('/:id/complete', bookingController.completeBooking);

module.exports = router;