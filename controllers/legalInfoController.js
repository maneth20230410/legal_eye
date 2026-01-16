// controllers/legalInfoController.js
// Legal information controller

const db = require('../config/database');

// Get all articles
exports.getAllArticles = async (req, res) => {
  try {
    const [articles] = await db.query(
      'SELECT * FROM legal_info WHERE is_published = 1 ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      data: { articles }
    });
  } catch (error) {
    console.error('Get articles error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching articles'
    });
  }
};

// Search articles
exports.searchArticles = async (req, res) => {
  try {
    const { q } = req.query;

    const [articles] = await db.query(
      `SELECT * FROM legal_info 
       WHERE is_published = 1 
       AND (title LIKE ? OR summary LIKE ? OR content LIKE ?)
       ORDER BY created_at DESC`,
      [`%${q}%`, `%${q}%`, `%${q}%`]
    );

    res.json({
      success: true,
      data: { articles }
    });
  } catch (error) {
    console.error('Search articles error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching articles'
    });
  }
};

// Get articles by category
exports.getArticlesByCategory = async (req, res) => {
  try {
    const { category } = req.query;

    const [articles] = await db.query(
      'SELECT * FROM legal_info WHERE category = ? AND is_published = 1 ORDER BY created_at DESC',
      [category]
    );

    res.json({
      success: true,
      data: { articles }
    });
  } catch (error) {
    console.error('Get by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching articles'
    });
  }
};

// Get article by ID
exports.getArticleById = async (req, res) => {
  try {
    const [articles] = await db.query(
      'SELECT * FROM legal_info WHERE id = ?',
      [req.params.id]
    );

    if (articles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    // Increment views
    await db.query(
      'UPDATE legal_info SET views = views + 1 WHERE id = ?',
      [req.params.id]
    );

    res.json({
      success: true,
      data: articles[0]
    });
  } catch (error) {
    console.error('Get article error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching article'
    });
  }
};

// Get related articles
exports.getRelatedArticles = async (req, res) => {
  try {
    const [article] = await db.query(
      'SELECT category FROM legal_info WHERE id = ?',
      [req.params.id]
    );

    if (article.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    const [related] = await db.query(
      'SELECT * FROM legal_info WHERE category = ? AND id != ? AND is_published = 1 LIMIT 3',
      [article[0].category, req.params.id]
    );

    res.json({
      success: true,
      data: related
    });
  } catch (error) {
    console.error('Get related error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching related articles'
    });
  }
};

// Get popular articles
exports.getPopularArticles = async (req, res) => {
  try {
    const [articles] = await db.query(
      'SELECT * FROM legal_info WHERE is_published = 1 ORDER BY views DESC LIMIT 10'
    );

    res.json({
      success: true,
      data: articles
    });
  } catch (error) {
    console.error('Get popular error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching popular articles'
    });
  }
};

// Create article (Admin only)
exports.createArticle = async (req, res) => {
  try {
    const { title, category, summary, content, tags, readTime } = req.body;

    const [result] = await db.query(
      `INSERT INTO legal_info (title, category, summary, content, tags, read_time, author_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, category, summary, content, JSON.stringify(tags), readTime, req.user.id]
    );

    res.status(201).json({
      success: true,
      message: 'Article created successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Create article error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating article'
    });
  }
};

// Update article (Admin only)
exports.updateArticle = async (req, res) => {
  try {
    const { title, category, summary, content, tags, readTime } = req.body;

    await db.query(
      `UPDATE legal_info SET 
       title = ?, category = ?, summary = ?, content = ?, tags = ?, read_time = ?
       WHERE id = ?`,
      [title, category, summary, content, JSON.stringify(tags), readTime, req.params.id]
    );

    res.json({
      success: true,
      message: 'Article updated successfully'
    });
  } catch (error) {
    console.error('Update article error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating article'
    });
  }
};

// Delete article (Admin only)
exports.deleteArticle = async (req, res) => {
  try {
    await db.query('DELETE FROM legal_info WHERE id = ?', [req.params.id]);

    res.json({
      success: true,
      message: 'Article deleted successfully'
    });
  } catch (error) {
    console.error('Delete article error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting article'
    });
  }
};