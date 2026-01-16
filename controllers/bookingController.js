// controllers/bookingController.js
// Booking controller

const db = require('../config/database');

// Create booking
exports.createBooking = async (req, res) => {
  try {
    const {
      lawyerId,
      date,
      timeSlot,
      dateTime,
      caseType,
      description,
      urgency
    } = req.body;

    // Get lawyer's consultation fee
    const [lawyer] = await db.query(
      'SELECT consultation_fee FROM lawyers WHERE id = ?',
      [lawyerId]
    );

    if (lawyer.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lawyer not found'
      });
    }

    // Check if time slot is already booked
    const [existingBooking] = await db.query(
      'SELECT id FROM bookings WHERE lawyer_id = ? AND booking_date = ? AND time_slot = ? AND status != ?',
      [lawyerId, date, timeSlot, 'cancelled']
    );

    if (existingBooking.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is already booked'
      });
    }

    const [result] = await db.query(
      `INSERT INTO bookings (
        client_id, lawyer_id, booking_date, time_slot, date_time,
        case_type, description, urgency, consultation_fee
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        lawyerId,
        date,
        timeSlot,
        dateTime,
        caseType,
        description,
        urgency || 'normal',
        lawyer[0].consultation_fee
      ]
    );

    // Update lawyer's total bookings
    await db.query(
      'UPDATE lawyers SET total_bookings = total_bookings + 1 WHERE id = ?',
      [lawyerId]
    );

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating booking',
      error: error.message
    });
  }
};

// Get user bookings
exports.getMyBookings = async (req, res) => {
  try {
    const [bookings] = await db.query(
      `SELECT b.*, l.specialization, u.name as lawyerName, u.phone as lawyerPhone, u.email as lawyerEmail
       FROM bookings b
       JOIN lawyers l ON b.lawyer_id = l.id
       JOIN users u ON l.user_id = u.id
       WHERE b.client_id = ?
       ORDER BY b.date_time DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings'
    });
  }
};

// Get lawyer bookings
exports.getLawyerBookings = async (req, res) => {
  try {
    const [bookings] = await db.query(
      `SELECT b.*, u.name as clientName, u.phone as clientPhone, u.email as clientEmail
       FROM bookings b
       JOIN users u ON b.client_id = u.id
       WHERE b.lawyer_id = ?
       ORDER BY b.date_time DESC`,
      [req.params.lawyerId]
    );

    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('Get lawyer bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings'
    });
  }
};

// Get booking by ID
exports.getBookingById = async (req, res) => {
  try {
    const [bookings] = await db.query(
      `SELECT b.*, 
        u1.name as clientName, u1.phone as clientPhone, u1.email as clientEmail,
        u2.name as lawyerName, u2.phone as lawyerPhone, u2.email as lawyerEmail,
        l.specialization
       FROM bookings b
       JOIN users u1 ON b.client_id = u1.id
       JOIN lawyers l ON b.lawyer_id = l.id
       JOIN users u2 ON l.user_id = u2.id
       WHERE b.id = ?`,
      [req.params.id]
    );

    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      data: bookings[0]
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching booking'
    });
  }
};

// Update booking status
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    await db.query(
      'UPDATE bookings SET status = ? WHERE id = ?',
      [status, req.params.id]
    );

    res.json({
      success: true,
      message: 'Booking status updated successfully'
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating status'
    });
  }
};

// Cancel booking
exports.cancelBooking = async (req, res) => {
  try {
    const { reason } = req.body;

    await db.query(
      'UPDATE bookings SET status = ?, cancellation_reason = ? WHERE id = ?',
      ['cancelled', reason, req.params.id]
    );

    res.json({
      success: true,
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling booking'
    });
  }
};

// Complete booking
exports.completeBooking = async (req, res) => {
  try {
    await db.query(
      'UPDATE bookings SET status = ? WHERE id = ?',
      ['completed', req.params.id]
    );

    res.json({
      success: true,
      message: 'Booking marked as completed'
    });
  } catch (error) {
    console.error('Complete booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing booking'
    });
  }
};

// Reschedule booking (bonus feature)
exports.rescheduleBooking = async (req, res) => {
  try {
    const { newDate, newTimeSlot, newDateTime } = req.body;

    // Check if new time slot is available
    const [existing] = await db.query(
      'SELECT id FROM bookings WHERE lawyer_id = (SELECT lawyer_id FROM bookings WHERE id = ?) AND booking_date = ? AND time_slot = ? AND status != ? AND id != ?',
      [req.params.id, newDate, newTimeSlot, 'cancelled', req.params.id]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'New time slot is already booked'
      });
    }

    await db.query(
      'UPDATE bookings SET booking_date = ?, time_slot = ?, date_time = ? WHERE id = ?',
      [newDate, newTimeSlot, newDateTime, req.params.id]
    );

    res.json({
      success: true,
      message: 'Booking rescheduled successfully'
    });
  } catch (error) {
    console.error('Reschedule booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rescheduling booking'
    });
  }
};
