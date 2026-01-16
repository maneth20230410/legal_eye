// middleware/validators.js
// Request validation middleware

const { body, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Register validation
exports.validateRegister = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('role').optional().isIn(['client', 'lawyer']).withMessage('Invalid role'),
  handleValidationErrors
];

// Login validation
exports.validateLogin = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

// Booking validation
exports.validateBooking = [
  body('lawyerId').isInt().withMessage('Valid lawyer ID is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('timeSlot').notEmpty().withMessage('Time slot is required'),
  body('caseType').notEmpty().withMessage('Case type is required'),
  body('description')
    .isLength({ min: 20 })
    .withMessage('Description must be at least 20 characters'),
  handleValidationErrors
];

// Review validation
exports.validateReview = [
  body('bookingId').isInt().withMessage('Valid booking ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('comment')
    .isLength({ min: 20 })
    .withMessage('Comment must be at least 20 characters'),
  handleValidationErrors
];
