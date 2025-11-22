const express = require('express');
const router = express.Router();
const db = require('../db/Index.js');
const { authenticateToken } = require('../middleware/authMiddleware');

// GET /api/notifications - Get unread notifications for the user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const result = await db.query(
            'SELECT * FROM notifications WHERE user_id = $1 AND is_read = FALSE ORDER BY created_at DESC',
            [userId]
        );
        res.json({ notifications: result.rows });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// PUT /api/notifications/:id/read - Mark a notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const notificationId = req.params.id;

        const result = await db.query(
            'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *',
            [notificationId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Notification not found or not authorized' });
        }

        res.json({ message: 'Notification marked as read', notification: result.rows[0] });
    } catch (error) {
        console.error('Error updating notification:', error);
        res.status(500).json({ error: 'Failed to update notification' });
    }
});

// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/read-all', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        await db.query(
            'UPDATE notifications SET is_read = TRUE WHERE user_id = $1',
            [userId]
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all read:', error);
        res.status(500).json({ error: 'Failed to mark all read' });
    }
});

module.exports = router;
