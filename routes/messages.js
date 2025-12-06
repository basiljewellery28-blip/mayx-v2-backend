const express = require('express');
const router = express.Router();
const db = require('../db/Index');
const { authenticateToken } = require('../middleware/authMiddleware');

// ALL ROUTES ARE PROTECTED - require authentication
router.use(authenticateToken);

// GET /api/messages/conversations - List user's conversations
router.get('/conversations', async (req, res) => {
    try {
        const userId = req.user.userId; // Guaranteed from auth middleware

        const result = await db.query(`
            SELECT 
                c.*,
                client.name as client_name,
                client.email as client_email,
                consultant.name as consultant_name,
                consultant.email as consultant_email
            FROM conversations c
            LEFT JOIN users client ON c.client_id = client.id
            LEFT JOIN users consultant ON c.consultant_id = consultant.id
            WHERE c.client_id = $1 OR c.consultant_id = $1
            ORDER BY c.updated_at DESC
        `, [userId]);

        res.json({ conversations: result.rows });
    } catch (error) {
        console.error('Error fetching conversations:', error.message);
        res.status(500).json({ message: 'Failed to fetch conversations' });
    }
});

// GET /api/messages/conversations/:id - Get messages in a conversation
router.get('/conversations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        // Verify user is part of this conversation
        const convResult = await db.query(
            'SELECT * FROM conversations WHERE id = $1 AND (client_id = $2 OR consultant_id = $2)',
            [id, userId]
        );

        if (convResult.rows.length === 0) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        // Get messages
        const result = await db.query(`
            SELECT m.*, u.name as sender_name
            FROM messages m
            LEFT JOIN users u ON m.sender_id = u.id
            WHERE m.conversation_id = $1
            ORDER BY m.created_at ASC
        `, [id]);

        // Mark messages as read
        await db.query(`
            UPDATE messages 
            SET read_at = CURRENT_TIMESTAMP 
            WHERE conversation_id = $1 AND sender_id != $2 AND read_at IS NULL
        `, [id, userId]);

        // Reset unread count
        await db.query(`
            UPDATE conversations 
            SET unread_count = 0 
            WHERE id = $1 AND (client_id = $2 OR consultant_id = $2)
        `, [id, userId]);

        res.json({
            conversation: convResult.rows[0],
            messages: result.rows
        });
    } catch (error) {
        console.error('Error fetching messages:', error.message);
        res.status(500).json({ message: 'Failed to fetch messages' });
    }
});

// POST /api/messages/conversations/:id - Send a message
router.post('/conversations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const senderId = req.user.userId;

        if (!content || !content.trim()) {
            return res.status(400).json({ message: 'Message content is required' });
        }

        // Verify user is part of this conversation
        const convResult = await db.query(
            'SELECT * FROM conversations WHERE id = $1 AND (client_id = $2 OR consultant_id = $2)',
            [id, senderId]
        );

        if (convResult.rows.length === 0) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        // Insert message
        const result = await db.query(`
            INSERT INTO messages (conversation_id, sender_id, content)
            VALUES ($1, $2, $3)
            RETURNING *
        `, [id, senderId, content.trim()]);

        // Update conversation
        await db.query(`
            UPDATE conversations 
            SET last_message = $1, last_message_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP, unread_count = unread_count + 1
            WHERE id = $2
        `, [content.trim().substring(0, 100), id]);

        res.status(201).json({ message: result.rows[0] });
    } catch (error) {
        console.error('Error sending message:', error.message);
        res.status(500).json({ message: 'Failed to send message' });
    }
});

// POST /api/messages/conversations - Start a new conversation (for clients)
router.post('/conversations', async (req, res) => {
    try {
        const clientId = req.user.userId;
        const { consultant_id, initial_message } = req.body;

        // If no consultant specified, assign one (get first available consultant)
        let consultantId = consultant_id;
        if (!consultantId) {
            const consultantResult = await db.query(
                "SELECT id FROM users WHERE role = 'consultant' LIMIT 1"
            );
            if (consultantResult.rows.length > 0) {
                consultantId = consultantResult.rows[0].id;
            } else {
                // Fallback to admin
                const adminResult = await db.query(
                    "SELECT id FROM users WHERE role = 'admin' LIMIT 1"
                );
                if (adminResult.rows.length > 0) {
                    consultantId = adminResult.rows[0].id;
                }
            }
        }

        if (!consultantId) {
            return res.status(400).json({ message: 'No consultant available' });
        }

        // Check if conversation already exists
        let convResult = await db.query(
            'SELECT * FROM conversations WHERE client_id = $1 AND consultant_id = $2',
            [clientId, consultantId]
        );

        let conversation;
        if (convResult.rows.length > 0) {
            conversation = convResult.rows[0];
        } else {
            // Create new conversation
            const newConv = await db.query(`
                INSERT INTO conversations (client_id, consultant_id)
                VALUES ($1, $2)
                RETURNING *
            `, [clientId, consultantId]);
            conversation = newConv.rows[0];
        }

        // Send initial message if provided
        if (initial_message) {
            await db.query(`
                INSERT INTO messages (conversation_id, sender_id, content)
                VALUES ($1, $2, $3)
            `, [conversation.id, clientId, initial_message]);

            await db.query(`
                UPDATE conversations 
                SET last_message = $1, last_message_at = CURRENT_TIMESTAMP, unread_count = 1
                WHERE id = $2
            `, [initial_message.substring(0, 100), conversation.id]);
        }

        res.status(201).json({ conversation });
    } catch (error) {
        console.error('Error creating conversation:', error.message);
        res.status(500).json({ message: 'Failed to start conversation' });
    }
});

// PUT /api/messages/:id/read - Mark message as read
router.put('/:id/read', async (req, res) => {
    try {
        const { id } = req.params;

        await db.query(
            'UPDATE messages SET read_at = CURRENT_TIMESTAMP WHERE id = $1',
            [id]
        );

        res.json({ message: 'Message marked as read' });
    } catch (error) {
        console.error('Error marking message as read:', error.message);
        res.status(500).json({ message: 'Failed to update message' });
    }
});

// GET /api/messages/clients - List all clients for a consultant
router.get('/clients', async (req, res) => {
    try {
        const consultantId = req.user.userId;

        // Get all clients this consultant has conversations with
        const result = await db.query(`
            SELECT DISTINCT 
                u.id,
                u.name,
                u.email,
                c.profile_number,
                conv.id as conversation_id,
                conv.last_message,
                conv.last_message_at,
                conv.unread_count
            FROM conversations conv
            JOIN users u ON conv.client_id = u.id
            LEFT JOIN clients c ON u.email = c.email
            WHERE conv.consultant_id = $1
            ORDER BY conv.last_message_at DESC NULLS LAST
        `, [consultantId]);

        res.json({ clients: result.rows });
    } catch (error) {
        console.error('Error fetching clients:', error.message);
        res.status(500).json({ message: 'Failed to fetch clients' });
    }
});

// POST /api/messages/lookup-client - Lookup client by Profile Number (format: AA092275)
router.post('/lookup-client', async (req, res) => {
    try {
        const { profile_number } = req.body;

        if (!profile_number) {
            return res.status(400).json({ message: 'Profile number is required' });
        }

        // Find client by profile number
        const result = await db.query(`
            SELECT 
                c.id as client_id,
                c.name,
                c.email,
                c.contact_number,
                c.profile_number,
                c.created_at,
                u.id as user_id
            FROM clients c
            LEFT JOIN users u ON c.email = u.email
            WHERE c.profile_number = $1
        `, [profile_number.toUpperCase()]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Client not found',
                profile_number: profile_number.toUpperCase()
            });
        }

        // Get client's briefs
        const briefsResult = await db.query(`
            SELECT id, brief_number, title, status, created_at
            FROM briefs 
            WHERE client_id = $1
            ORDER BY created_at DESC
        `, [result.rows[0].client_id]);

        // Get existing conversation if any
        const convResult = await db.query(`
            SELECT id as conversation_id
            FROM conversations
            WHERE client_id = $1 AND consultant_id = $2
        `, [result.rows[0].user_id, req.user.userId]);

        res.json({
            client: result.rows[0],
            briefs: briefsResult.rows,
            conversation_id: convResult.rows[0]?.conversation_id || null
        });
    } catch (error) {
        console.error('Error looking up client:', error.message);
        res.status(500).json({ message: 'Failed to lookup client' });
    }
});

module.exports = router;

