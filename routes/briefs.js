const express = require('express');
const router = express.Router();
const db = require('../db/Index.js');
const { authenticateToken } = require('../middleware/authMiddleware'); // <-- 1. IMPORT

// GET all briefs
// 2. ADD 'authenticateToken' right before (req, res)
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('📖 GET /api/briefs called by user:', req.user.userId);
    // You can now filter by consultant ID if you want:
    // const result = await db.query('SELECT * FROM briefs WHERE consultant_id = $1 ORDER BY ...', [req.user.userId]);

    const result = await db.query('SELECT * FROM briefs ORDER BY created_at DESC');
    res.json({
      message: 'Briefs retrieved successfully!',
      count: result.rows.length,
      briefs: result.rows
    });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: 'Failed to retrieve briefs' });
  }
});

// GET single brief
// 3. PROTECT THIS ROUTE
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM briefs WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Brief not found' });
    }
    res.json({ brief: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve brief' });
  }
});

// POST create brief
// 4. PROTECT THIS ROUTE
// POST create brief
router.post('/', authenticateToken, async (req, res) => {
  try {
    const consultant_id = req.user.userId;

    // Extract client details and brief details from request body
    const {
      clientName, clientEmail, clientContact, clientProfile, // Client fields
      title, description, style_code_id, category, ringType, ringDesign, // Brief fields
      // ... capture other fields to store in brief_versions later if needed
      ...otherData
    } = req.body;

    // 1. Create or Find Client
    // For now, we'll just create a new client entry for every brief to keep it simple,
    // or you could check if one exists by email/profile_number first.
    let client_id;

    if (clientName) {
      const clientResult = await db.query(
        'INSERT INTO clients (name, email, contact_number, profile_number) VALUES ($1, $2, $3, $4) RETURNING id',
        [clientName, clientEmail, clientContact, clientProfile]
      );
      client_id = clientResult.rows[0].id;
    } else {
      // Handle case where no client info is provided (maybe optional?)
      // For now, let's require it or set a placeholder if your schema allows nulls (it doesn't: client_id INTEGER NOT NULL)
      return res.status(400).json({ error: 'Client name is required' });
    }

    const briefNumber = 'MB-' + Date.now();

    // 2. Create Brief
    const result = await db.query(
      'INSERT INTO briefs (brief_number, client_id, consultant_id, title, description, style_code_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [briefNumber, client_id, consultant_id, title || `Brief for ${clientName}`, description, style_code_id || null]
    );

    const newBrief = result.rows[0];

    // 3. Create Initial Brief Version (Optional but recommended to store all the wizard data)
    // We'll store the entire formData in the 'data' JSONB column
    await db.query(
      'INSERT INTO brief_versions (brief_id, version_number, data, created_by) VALUES ($1, $2, $3, $4)',
      [newBrief.id, 1, JSON.stringify(req.body), consultant_id]
    );

    res.status(201).json({ message: 'Brief created!', brief: newBrief });
  } catch (error) {
    console.error('Error creating brief:', error);
    res.status(500).json({ error: 'Failed to create brief' });
  }
});

// Comments routes
// 5. PROTECT THESE ROUTES
router.get('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT c.*, u.name as user_name, u.role as user_role FROM comments c JOIN users u ON c.user_id = u.id WHERE c.brief_id = $1 ORDER BY c.created_at DESC',
      [req.params.id]
    );
    res.json({ comments: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve comments' });
  }
});

router.post('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    const result = await db.query(
      'INSERT INTO comments (brief_id, user_id, message) VALUES ($1, $2, $3) RETURNING *',
      [req.params.id, req.user.userId, message]
    );
    res.status(201).json({ comment: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

module.exports = router;

