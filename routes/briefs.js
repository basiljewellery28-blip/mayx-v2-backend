const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeBriefAccess } = require('../middleware/authorizeMiddleware'); // ← ADD THIS LINE
const router = express.Router();
const db = require('../db/Index.js');

// GET /api/briefs - Get all briefs
router.get('/', async (req, res) => {
  try {
    // SQL query to get all briefs
    const queryText = `
      SELECT * FROM briefs 
      ORDER BY created_at DESC;
    `;

    // Execute the query
    const result = await db.query(queryText);
    const briefs = result.rows;

    // Success response
    res.status(200).json({
      message: 'Briefs retrieved successfully!',
      count: briefs.length,
      briefs: briefs
    });

  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve briefs. Please try again later.' 
    });
  }
});

// GET /api/briefs/:id - Get a single brief by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params; // Get ID from URL
    console.log(`📖 Fetching brief with ID: ${id}`);

    // Database query to get specific brief
    const queryText = 'SELECT * FROM briefs WHERE id = $1';
    const result = await db.query(queryText, [id]);

    // Check if brief exists
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Brief not found' });
    }

    const brief = result.rows[0];
    
    res.json({
      message: 'Brief retrieved successfully!',
      brief: brief
    });

  } catch (error) {
    console.error('❌ Database error:', error);
    res.status(500).json({ error: 'Failed to retrieve brief from database' });
  }
});

// POST /api/briefs - Create a new brief
router.post('/', async (req, res) => {
  const { client_id, consultant_id, title, description, style_code_id } = req.body;

  // Basic validation
  if (!client_id || !consultant_id || !title) {
    return res.status(400).json({ 
      error: 'Missing required fields. Please provide client_id, consultant_id, and title.' 
    });
  }

  try {
    // Generate a unique brief number
    const briefNumber = 'MB-' + Date.now();

    // SQL query to insert the new brief
    const queryText = `
      INSERT INTO briefs (brief_number, client_id, consultant_id, title, description, style_code_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [briefNumber, client_id, consultant_id, title, description, style_code_id || null];

    // Execute the query
    const result = await db.query(queryText, values);
    const newBrief = result.rows[0];

    // Success response
    res.status(201).json({
      message: 'Brief created successfully!',
      brief: newBrief
    });

  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      error: 'Failed to create brief. Please try again later.' 
    });
  }
});

module.exports = router;

// POST /api/briefs/:id/versions - Create a new version
router.post('/:id/versions', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, created_by } = req.body;

    if (!data || !created_by) {
      return res.status(400).json({ error: 'data and created_by are required' });
    }

    // Get current version number
    const versionResult = await db.query(
      'SELECT COALESCE(MAX(version_number), 0) + 1 as next_version FROM brief_versions WHERE brief_id = $1',
      [id]
    );
    const nextVersion = versionResult.rows[0].next_version;

    // Create new version
    const queryText = `
      INSERT INTO brief_versions (brief_id, version_number, data, created_by)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const values = [id, nextVersion, data, created_by];
    const result = await db.query(queryText, values);
    const newVersion = result.rows[0];

    // Update brief's current version
    await db.query(
      'UPDATE briefs SET current_version = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [nextVersion, id]
    );

    res.status(201).json({
      message: 'Brief version created successfully!',
      version: newVersion
    });

  } catch (error) {
    console.error('❌ Database error:', error);
    res.status(500).json({ error: 'Failed to create brief version' });
  }
});

// GET /api/briefs/:id/versions - Get all versions for a brief
router.get('/:id/versions', async (req, res) => {
  try {
    const { id } = req.params;
    
    const queryText = 'SELECT * FROM brief_versions WHERE brief_id = $1 ORDER BY version_number DESC';
    const result = await db.query(queryText, [id]);
    const versions = result.rows;

    res.json({
      message: 'Brief versions retrieved successfully!',
      versions: versions
    });

  } catch (error) {
    console.error('❌ Database error:', error);
    res.status(500).json({ error: 'Failed to retrieve brief versions' });
  }
});
// POST /api/briefs/:id/comments - Add a comment to a brief
router.post('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, message, attachment_url, brief_version_id } = req.body;

    if (!user_id || !message) {
      return res.status(400).json({ error: 'user_id and message are required' });
    }

    const queryText = `
      INSERT INTO comments (brief_id, user_id, message, attachment_url, brief_version_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [id, user_id, message, attachment_url || null, brief_version_id || null];
    const result = await db.query(queryText, values);
    const newComment = result.rows[0];

    res.status(201).json({
      message: 'Comment added successfully!',
      comment: newComment
    });

  } catch (error) {
    console.error('❌ Database error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// GET /api/briefs/:id/comments - Get all comments for a brief
router.get('/:id/comments', authenticateToken, authorizeBriefAccess, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get pagination parameters from query string with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({ 
        error: 'Invalid pagination parameters. Page must be >= 1, limit between 1-100' 
      });
    }

    // Query for comments with pagination
    const commentsQuery = `
      SELECT c.*, u.name as user_name, u.role as user_role 
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.brief_id = $1 
      ORDER BY c.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    // Query for total count (for pagination info)
    const countQuery = `
      SELECT COUNT(*) as total_count 
      FROM comments 
      WHERE brief_id = $1
    `;

    // Execute both queries in parallel
    const [commentsResult, countResult] = await Promise.all([
      db.query(commentsQuery, [id, limit, offset]),
      db.query(countQuery, [id])
    ]);

    const comments = commentsResult.rows;
    const totalCount = parseInt(countResult.rows[0].total_count);
    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      message: 'Comments retrieved successfully!',
      comments: comments,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalComments: totalCount,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
        limit: limit
      }
    });

  } catch (error) {
    console.error('❌ Database error:', error);
    res.status(500).json({ error: 'Failed to retrieve comments' });
  }
});

// Protect with both authentication AND authorization
router.get('/:id/comments', authenticateToken, authorizeBriefAccess, async (req, res) => {
  // ... existing code ...
});

router.post('/:id/comments', authenticateToken, authorizeBriefAccess, async (req, res) => {
  // ... existing code ...
});