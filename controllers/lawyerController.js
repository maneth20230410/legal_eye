// controllers/lawyerController.js
// Lawyer controller

const db = require('../config/database');

// Get all lawyers
exports.getAllLawyers = async (req, res) => {
  try {
    const [lawyers] = await db.query(`
      SELECT l.*, u.name, u.email, u.phone, u.profile_image
      FROM lawyers l
      JOIN users u ON l.user_id = u.id
      WHERE u.is_active = 1
      ORDER BY l.rating DESC
    `);

    res.json({
      success: true,
      count: lawyers.length,
      data: lawyers
    });
  } catch (error) {
    console.error('Get lawyers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching lawyers'
    });
  }
};

// Search lawyers
exports.searchLawyers = async (req, res) => {
  try {
    const { search, specialization, location, minRating, maxFee, sortBy } = req.query;
    
    let query = `
      SELECT l.*, u.name, u.email, u.phone, u.profile_image
      FROM lawyers l
      JOIN users u ON l.user_id = u.id
      WHERE u.is_active = 1
    `;
    const params = [];

    if (search) {
      query += ` AND (u.name LIKE ? OR l.specialization LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (specialization) {
      query += ` AND l.specialization = ?`;
      params.push(specialization);
    }

    if (location) {
      query += ` AND l.location LIKE ?`;
      params.push(`%${location}%`);
    }

    if (minRating) {
      query += ` AND l.rating >= ?`;
      params.push(minRating);
    }

    if (maxFee) {
      query += ` AND l.consultation_fee <= ?`;
      params.push(maxFee);
    }

    // Sorting
    if (sortBy === 'fee-low') {
      query += ` ORDER BY l.consultation_fee ASC`;
    } else if (sortBy === 'fee-high') {
      query += ` ORDER BY l.consultation_fee DESC`;
    } else if (sortBy === 'experience') {
      query += ` ORDER BY l.experience DESC`;
    } else {
      query += ` ORDER BY l.rating DESC`;
    }

    const [lawyers] = await db.query(query, params);

    res.json({
      success: true,
      count: lawyers.length,
      data: lawyers
    });
  } catch (error) {
    console.error('Search lawyers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching lawyers'
    });
  }
};

// Get lawyer by ID
exports.getLawyerById = async (req, res) => {
  try {
    const [lawyers] = await db.query(`
      SELECT l.*, u.name, u.email, u.phone, u.profile_image
      FROM lawyers l
      JOIN users u ON l.user_id = u.id
      WHERE l.id = ?
    `, [req.params.id]);

    if (lawyers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lawyer not found'
      });
    }

    res.json({
      success: true,
      data: lawyers[0]
    });
  } catch (error) {
    console.error('Get lawyer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching lawyer'
    });
  }
};

// Create lawyer profile
exports.createLawyerProfile = async (req, res) => {
  try {
    const {
      specialization,
      barCouncilNumber,
      experience,
      education,
      about,
      consultationFee,
      languages,
      location,
      practiceAreas
    } = req.body;

    // Check if profile already exists
    const [existing] = await db.query(
      'SELECT id FROM lawyers WHERE user_id = ?',
      [req.user.id]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Lawyer profile already exists'
      });
    }

    const [result] = await db.query(
      `INSERT INTO lawyers (
        user_id, specialization, bar_council_number, experience,
        education, about, consultation_fee, languages, location, practice_areas
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        specialization,
        barCouncilNumber,
        experience,
        education,
        about,
        consultationFee,
        languages,
        location,
        JSON.stringify(practiceAreas)
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Lawyer profile created successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Create lawyer profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating lawyer profile'
    });
  }
};

// Update lawyer profile
exports.updateLawyerProfile = async (req, res) => {
  try {
    const {
      specialization,
      barCouncilNumber,
      experience,
      education,
      about,
      consultationFee,
      languages,
      location,
      practiceAreas
    } = req.body;

    await db.query(
      `UPDATE lawyers SET
        specialization = ?,
        bar_council_number = ?,
        experience = ?,
        education = ?,
        about = ?,
        consultation_fee = ?,
        languages = ?,
        location = ?,
        practice_areas = ?
      WHERE id = ? AND user_id = ?`,
      [
        specialization,
        barCouncilNumber,
        experience,
        education,
        about,
        consultationFee,
        languages,
        location,
        JSON.stringify(practiceAreas),
        req.params.id,
        req.user.id
      ]
    );

    res.json({
      success: true,
      message: 'Lawyer profile updated successfully'
    });
  } catch (error) {
    console.error('Update lawyer profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating lawyer profile'
    });
  }
};

// Set availability
exports.setAvailability = async (req, res) => {
  try {
    const { availability } = req.body;
    const lawyerId = req.params.id;

    // Delete existing availability
    await db.query('DELETE FROM availability WHERE lawyer_id = ?', [lawyerId]);

    // Insert new availability
    for (const [day, slots] of Object.entries(availability)) {
      for (const slot of slots) {
        await db.query(
          'INSERT INTO availability (lawyer_id, day_of_week, time_slot) VALUES (?, ?, ?)',
          [lawyerId, day, slot]
        );
      }
    }

    res.json({
      success: true,
      message: 'Availability updated successfully'
    });
  } catch (error) {
    console.error('Set availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting availability'
    });
  }
};

// Get lawyer availability
exports.getLawyerAvailability = async (req, res) => {
  try {
    const [slots] = await db.query(
      'SELECT day_of_week, time_slot FROM availability WHERE lawyer_id = ? AND is_available = 1',
      [req.params.id]
    );

    const availability = {};
    slots.forEach(slot => {
      if (!availability[slot.day_of_week]) {
        availability[slot.day_of_week] = [];
      }
      availability[slot.day_of_week].push(slot.time_slot);
    });

    res.json({
      success: true,
      data: { availability, slots }
    });
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching availability'
    });
  }
};

// Get lawyer stats
exports.getLawyerStats = async (req, res) => {
  try {
    const [bookings] = await db.query(
      'SELECT COUNT(*) as total, status FROM bookings WHERE lawyer_id = ? GROUP BY status',
      [req.params.id]
    );

    const stats = {
      totalBookings: 0,
      pendingBookings: 0,
      completedBookings: 0,
      totalClients: 0,
      averageRating: 0,
      monthlyEarnings: 0
    };

    bookings.forEach(b => {
      stats.totalBookings += b.total;
      if (b.status === 'pending') stats.pendingBookings = b.total;
      if (b.status === 'completed') stats.completedBookings = b.total;
    });

    const [lawyer] = await db.query(
      'SELECT rating, total_reviews FROM lawyers WHERE id = ?',
      [req.params.id]
    );

    if (lawyer.length > 0) {
      stats.averageRating = lawyer[0].rating;
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stats'
    });
  }
};
