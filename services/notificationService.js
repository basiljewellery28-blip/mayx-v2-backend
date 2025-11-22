const db = require('../db/Index.js');
const { emitEvent } = require('./socketService');

const createNotification = async (userId, type, message, relatedId) => {
    try {
        const queryText = `
            INSERT INTO notifications (user_id, type, message, related_id)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const values = [userId, type, message, relatedId];
        const result = await db.query(queryText, values);
        const notification = result.rows[0];

        // Emit real-time event to the specific user
        emitEvent(`user_${userId}`, 'new_notification', notification);

        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        // Don't throw, just log. Notifications shouldn't break the main flow.
        return null;
    }
};

module.exports = { createNotification };
