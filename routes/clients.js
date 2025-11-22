const express = require('express');
const router = express.Router();
const db = require('../db/Index.js');
const { authenticateToken } = require('../middleware/authMiddleware');

// GET /api/clients
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM clients ORDER BY created_at DESC');
        res.json({ clients: result.rows });
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({ error: 'Failed to fetch clients' });
    }
});

module.exports = router;
