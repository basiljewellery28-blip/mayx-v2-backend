const express = require('express');
const router = express.Router();
const db = require('../db/Index.js');
const { emitEvent } = require('../services/socketService');
const { authenticateToken } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { createNotification } = require('../services/notificationService');

// POST /api/briefs/:briefId/comments - Create a new comment on a brief
router.post('/:briefId/comments', authenticateToken, upload.single('attachment'), async (req, res) => {
    try {
        const { briefId } = req.params;
        const { message, brief_version_id } = req.body;
        const user_id = req.user.userId; // Extract from authenticated token
        const attachment_url = req.file ? `/uploads/${req.file.filename}` : null;

        if (!message) {
            return res.status(400).json({ error: 'Missing required field: message' });
        }

        const queryText = `
      INSERT INTO comments (brief_id, user_id, message, attachment_url, brief_version_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
        const values = [briefId, user_id, message, attachment_url, brief_version_id || null];

        const result = await db.query(queryText, values);
        const newComment = result.rows[0];

        // Fetch user name for the comment to send complete data
        const userResult = await db.query('SELECT name FROM users WHERE id = $1', [user_id]);
        let userName = 'User';
        if (userResult.rows.length > 0) {
            newComment.user_name = userResult.rows[0].name;
            userName = userResult.rows[0].name;
        }

        emitEvent(`brief_${briefId}`, 'new_comment', newComment);

        // NOTIFICATION LOGIC
        // Fetch brief to find consultant_id
        const briefResult = await db.query('SELECT consultant_id, title, brief_number, id FROM briefs WHERE id = $1', [briefId]);
        if (briefResult.rows.length > 0) {
            const brief = briefResult.rows[0];
            // If the commenter is NOT the consultant, notify the consultant
            if (user_id !== brief.consultant_id) {
                await createNotification(
                    brief.consultant_id,
                    'comment',
                    `${userName} commented on brief "${brief.title}"`,
                    briefId
                );

                // EMAIL NOTIFICATION
                // Fetch consultant email
                const consultantResult = await db.query('SELECT email FROM users WHERE id = $1', [brief.consultant_id]);
                if (consultantResult.rows.length > 0) {
                    const { sendNewCommentEmail } = require('../services/emailService');
                    const consultantEmail = consultantResult.rows[0].email;
                    sendNewCommentEmail(consultantEmail, brief, { ...newComment, user_name: userName }).catch(err => console.error('Failed to send email:', err));
                }
            }
        }

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
router.get('/:briefId/comments', authenticateToken, async (req, res) => {
    try {
        const { briefId } = req.params;

        const queryText = `
      SELECT c.*, u.name as user_name 
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.brief_id = $1 
      ORDER BY c.created_at DESC
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