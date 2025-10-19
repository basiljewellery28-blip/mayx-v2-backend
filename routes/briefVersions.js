// backend/routes/briefVersions.js
const express = require('express');
const router = express.Router();
const db = require('../db/Index.js');

// POST /api/briefs/:briefId/versions - Create a new version for a brief
router.post('/:briefId/versions', async (req, res) => {
  try {
    const { briefId } = req.params;
    const { version_number, data, created_by } = req.body;

    if (!version_number || !data || !created_by) {
      return res.status(400).json({ error: 'Missing required fields: version_number, data, created_by' });
    }

    const queryText = `
      INSERT INTO brief_versions (brief_id, version_number, data, created_by)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const values = [briefId, version_number, data, created_by];

    const result = await db.query(queryText, values);
    const newVersion = result.rows[0];

    res.status(201).json({
      message: 'Brief version created successfully!',
      version: newVersion
    });

  } catch (error) {
    console.error('❌ Database error:', error);
    res.status(500).json({ error: 'Failed to create brief version' });
  }
});

// GET /api/briefs/:briefId/versions - Get all versions for a brief
router.get('/:briefId/versions', async (req, res) => {
  try {
    const { briefId } = req.params;

    const queryText = 'SELECT * FROM brief_versions WHERE brief_id = $1 ORDER BY version_number DESC';
    const result = await db.query(queryText, [briefId]);

    res.json({
      message: 'Brief versions retrieved successfully!',
      versions: result.rows
    });

  } catch (error) {
    console.error('❌ Database error:', error);
    res.status(500).json({ error: 'Failed to retrieve brief versions' });
  }
});

module.exports = router;