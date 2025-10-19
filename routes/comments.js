// backend/routes/comments.js
const express = require('express');
const router = express.Router();
const db = require('../db/Index.js');

// POST /api/briefs/:briefId/comments - Create a new comment on a brief
router.post('/:briefId/comments', async (req, res) => {
  try {
    const { briefId } = req.params;
    const { user_id, message, attachment_url, brief_version_id } = req.body;

    if (!user_id || !message) {
      return res.status(400).json({ error: 'Missing required fields: user_id, message' });
    }

    const queryText = `
      INSERT INTO comments (brief_id, user_id, message, attachment_url, brief_version_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [briefId, user_id, message, attachment_url || null, brief_version_id || null];

    const result = await db.query(queryText, values);
    const newComment = result.rows[0];

    res.status(201).json({
      message: 'Comment created successfully!',
      comment: newComment
    });

  } catch (error) {
    console.error('❌ Database error:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// GET /api/briefs/:briefId/comments - Get all comments for a brief
router.get('/:briefId/comments', async (req, res) => {
  try {
    const { briefId } = req.params;

    const queryText = `
      SELECT * FROM comments 
      WHERE brief_id = $1 
      ORDER BY created_at DESC
    `;
    const result = await db.query(queryText, [briefId]);

    res.json({
      message: 'Comments retrieved successfully!',
      comments: result.rows
    });

  } catch (error) {
    console.error('❌ Database error:', error);
    res.status(500).json({ error: 'Failed to retrieve comments' });
  }
});

module.exports = router;
