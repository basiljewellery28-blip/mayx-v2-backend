const express = require('express');
const router = express.Router();
const db = require('../db/Index.js');
const { authenticateToken } = require('../middleware/authMiddleware');
const bcrypt = require('bcrypt');

// GET current user info
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, name, email, role FROM users WHERE id = $1',
            [req.user.userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user: result.rows[0] });
    } catch (error) {
        console.error('Error fetching current user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// GET /api/users/profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [req.user.userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user: result.rows[0] });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// PUT /api/users/profile
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { name, email, password } = req.body;
        let query = 'UPDATE users SET name = $1, email = $2';
        let params = [name, email];
        let paramIndex = 3;

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            query += `, password = $${paramIndex}`;
            params.push(hashedPassword);
            paramIndex++;
        }

        query += ` WHERE id = $${paramIndex} RETURNING id, name, email, role`;
        params.push(req.user.userId);

        const result = await db.query(query, params);
        res.json({ message: 'Profile updated successfully', user: result.rows[0] });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

module.exports = router;
