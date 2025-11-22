const express = require('express');
const router = express.Router();
const db = require('../db/Index.js');
const { authenticateToken } = require('../middleware/authMiddleware');

// GET /api/analytics/summary
router.get('/summary', authenticateToken, async (req, res) => {
    try {
        // 1. Total Briefs
        const totalResult = await db.query('SELECT COUNT(*) FROM briefs');
        const totalBriefs = parseInt(totalResult.rows[0].count, 10);

        // 2. Active Briefs (Assuming 'Completed' and 'Cancelled' are not active)
        // You might need to adjust the status strings based on your actual status values
        const activeResult = await db.query("SELECT COUNT(*) FROM briefs WHERE status NOT IN ('Completed', 'Cancelled')");
        const activeBriefs = parseInt(activeResult.rows[0].count, 10);

        // 3. Completed Briefs
        const completedResult = await db.query("SELECT COUNT(*) FROM briefs WHERE status = 'Completed'");
        const completedBriefs = parseInt(completedResult.rows[0].count, 10);

        // 4. Recent Briefs (Last 5)
        const recentResult = await db.query('SELECT * FROM briefs ORDER BY created_at DESC LIMIT 5');
        const recentBriefs = recentResult.rows;

        res.json({
            totalBriefs,
            activeBriefs,
            completedBriefs,
            recentBriefs
        });
    } catch (error) {
        console.error('Error fetching analytics summary:', error);
        res.status(500).json({ error: 'Failed to fetch analytics summary' });
    }
});

// GET /api/analytics/status-distribution
router.get('/status-distribution', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('SELECT status, COUNT(*) as count FROM briefs GROUP BY status');
        // Format for frontend (e.g., Recharts expects array of objects)
        const distribution = result.rows.map(row => ({
            name: row.status || 'Unknown',
            value: parseInt(row.count, 10)
        }));

        res.json(distribution);
    } catch (error) {
        console.error('Error fetching status distribution:', error);
        res.status(500).json({ error: 'Failed to fetch status distribution' });
    }
});

module.exports = router;
