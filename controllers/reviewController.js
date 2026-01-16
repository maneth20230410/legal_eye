// controllers/reviewController.js
// Review controller

const db = require('../config/database');

// Create review
exports.createReview = async (req, res) => {
  try {
    const { bookingId, lawyerId, rating, title, comment } = req.body;

    // Check if booking exists and is completed
    const [booking] = await db.query(
      'SELECT * FROM bookings WHERE id = ? AND client_id = ? AND status = ?',
      [bookingId, req.user.id, 'completed']
    );

    if (booking.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Can only review completed bookings'
      });
    }

    // Check if review already exists
    const [existing] = await db.query(
      'SELECT id FROM reviews WHERE booking_id = ?',
      [bookingId]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Review already exists for this booking'
      });
    }

    await db.query(
      `INSERT INTO reviews (booking_id, client_id, lawyer_id, rating, title, comment)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [bookingId, req.user.id, lawyerId, rating, title, comment]
    );

    // Update lawyer rating
    const [reviews] = await db.query(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as total FROM reviews WHERE lawyer_id = ?',
      [lawyerId]
    );

    await db.query(
      'UPDATE lawyers SET rating = ?, total_reviews = ? WHERE id = ?',
      [reviews[0].avg_rating, reviews[0].total, lawyerId]
    );

    res.status(201).json({
      success: true,
      message: 'Review created successfully'
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating review'
    });
  }
};

// Get lawyer reviews
exports.getLawyerReviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [reviews] = await db.query(
      `SELECT r.*, u.name as clientName
       FROM reviews r
       JOIN users u ON r.client_id = u.id
       WHERE r.lawyer_id = ?
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [req.params.lawyerId, limit, offset]
    );

    const [total] = await db.query(
      'SELECT COUNT(*) as count FROM reviews WHERE lawyer_id = ?',
      [req.params.lawyerId]
    );

    res.json({
      success: true,
      data: {
        reviews,
        hasMore: total[0].count > offset + limit
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews'
    });
  }
};

// Get user reviews
exports.getMyReviews = async (req, res) => {
  try {
    const [reviews] = await db.query(
      `SELECT r.*, l.specialization, u.name as lawyerName
       FROM reviews r
       JOIN lawyers l ON r.lawyer_id = l.id
       JOIN users u ON l.user_id = u.id
       WHERE r.client_id = ?
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    console.error('Get my reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews'
    });
  }
};

// Update review
exports.updateReview = async (req, res) => {
  try {
    const { rating, title, comment } = req.body;

    await db.query(
      'UPDATE reviews SET rating = ?, title = ?, comment = ? WHERE id = ? AND client_id = ?',
      [rating, title, comment, req.params.id, req.user.id]
    );

    res.json({
      success: true,
      message: 'Review updated successfully'
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating review'
    });
  }
};

// Delete review
exports.deleteReview = async (req, res) => {
  try {
    await db.query(
      'DELETE FROM reviews WHERE id = ? AND client_id = ?',
      [req.params.id, req.user.id]
    );

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting review'
    });
  }
};

// Get lawyer rating
exports.getLawyerRating = async (req, res) => {
  try {
    const [rating] = await db.query(
      'SELECT rating, total_reviews FROM lawyers WHERE id = ?',
      [req.params.lawyerId]
    );

    res.json({
      success: true,
      data: rating[0]
    });
  } catch (error) {
    console.error('Get rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching rating'
    });
  }
};
