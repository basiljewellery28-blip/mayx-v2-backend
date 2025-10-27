// routes/briefs.js
const express = require('express');
const router = express.Router();
const db = require('../db/Index.js');
const { authenticateToken } = require('../middleware/authMiddleware'); // Assuming authMiddleware.js exists

console.log('✅ Loading briefs routes...'); // Add this line

// GET /api/briefs - Should be router.get('/')
router.get('/', async (req, res) => { // Removed authenticateToken for now to simplify
  console.log('➡️ HIT: Get ALL briefs route (/)');
  try {
    const queryText = 'SELECT * FROM briefs ORDER BY created_at DESC';
    const result = await db.query(queryText);
    res.json({
      message: 'Briefs retrieved successfully!',
      count: result.rows.length,
      briefs: result.rows
    });
  } catch (error) {
    console.error('❌ Database error in GET /api/briefs:', error);
    res.status(500).json({ error: 'Failed to retrieve briefs from database' });
  }
});

// POST /api/briefs - Should be router.post('/')
router.post('/', authenticateToken, async (req, res) => { // Kept authenticateToken here
  console.log('➡️ POST /api/briefs route hit!'); // Add this line
  // ... your existing POST code ...
});

// GET /api/briefs/:id - Should be router.get('/:id')
router.get('/:id', authenticateToken, async (req, res) => { // Kept authenticateToken here
  console.log(`➡️ HIT: Get SINGLE brief route (/:id) with ID: ${req.params.id}`);
  // ... your existing GET by ID code ...
});

// ... other routes (versions, comments) ...

module.exports = router; // Make sure this line is at the very bottom