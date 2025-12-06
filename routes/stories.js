const express = require('express');
const router = express.Router();
const db = require('../db/Index');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { emitNewStory, emitStoryLike, emitStorySave, emitStoryUpdate } = require('../services/socketService');
const { authenticateToken } = require('../middleware/authMiddleware');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/stories');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for story images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'story-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed'));
    }
});

// Content moderation keywords (basic filter)
const BLOCKED_WORDS = [
    'hate', 'kill', 'drugs', 'weapon', 'violence', 'nude', 'porn',
    'spam', 'fake', 'scam', 'harassment', 'abuse'
];

// Simple content moderation check
const moderateContent = (text) => {
    const lowerText = text.toLowerCase();
    for (const word of BLOCKED_WORDS) {
        if (lowerText.includes(word)) {
            return { safe: false, reason: `Contains prohibited content: ${word}` };
        }
    }
    return { safe: true };
};

// POST /api/stories/upload - Upload story image (PROTECTED)
router.post('/upload', authenticateToken, upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }

        const imageUrl = `/uploads/stories/${req.file.filename}`;
        res.json({ imageUrl, message: 'Image uploaded successfully' });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ message: 'Failed to upload image' });
    }
});

// GET /api/stories - List all approved stories
router.get('/', async (req, res) => {
    try {
        const { category, limit = 20, offset = 0 } = req.query;

        let query = `
            SELECT s.*, u.name as author_name, u.email as author_email
            FROM stories s
            LEFT JOIN users u ON s.user_id = u.id
            WHERE s.status = 'approved'
        `;
        const params = [];

        if (category && category !== 'All') {
            params.push(category.toLowerCase());
            query += ` AND s.category = $${params.length}`;
        }

        query += ` ORDER BY s.created_at DESC`;
        params.push(parseInt(limit));
        query += ` LIMIT $${params.length}`;
        params.push(parseInt(offset));
        query += ` OFFSET $${params.length}`;

        const result = await db.query(query, params);
        res.json({ stories: result.rows });
    } catch (error) {
        console.error('Error fetching stories:', error);
        res.status(500).json({ message: 'Failed to fetch stories' });
    }
});

// GET /api/stories/saved - Get user's saved stories
router.get('/saved', async (req, res) => {
    try {
        const userId = req.user?.id || 1; // TODO: Get from auth middleware

        const result = await db.query(`
            SELECT s.*, u.name as author_name, ss.created_at as saved_at
            FROM story_saves ss
            JOIN stories s ON ss.story_id = s.id
            LEFT JOIN users u ON s.user_id = u.id
            WHERE ss.user_id = $1 AND s.status = 'approved'
            ORDER BY ss.created_at DESC
        `, [userId]);

        res.json({ stories: result.rows });
    } catch (error) {
        console.error('Error fetching saved stories:', error);
        res.status(500).json({ message: 'Failed to fetch saved stories' });
    }
});

// GET /api/stories/category/:category - Filter by category
router.get('/category/:category', async (req, res) => {
    try {
        const { category } = req.params;

        const result = await db.query(`
            SELECT s.*, u.name as author_name
            FROM stories s
            LEFT JOIN users u ON s.user_id = u.id
            WHERE s.status = 'approved' AND s.category = $1
            ORDER BY s.created_at DESC
            LIMIT 50
        `, [category.toLowerCase()]);

        res.json({ stories: result.rows });
    } catch (error) {
        console.error('Error fetching stories by category:', error);
        res.status(500).json({ message: 'Failed to fetch stories' });
    }
});

// GET /api/stories/:id - Get single story
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Get userId from auth if available, otherwise null (for public viewing)
        const userId = req.user?.userId || null;

        const result = await db.query(`
            SELECT s.*, u.name as author_name, u.email as author_email
            FROM stories s
            LEFT JOIN users u ON s.user_id = u.id
            WHERE s.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Story not found' });
        }

        const story = result.rows[0];

        // Check if user has liked/saved this story
        const likeResult = await db.query(
            'SELECT id FROM story_likes WHERE story_id = $1 AND user_id = $2',
            [id, userId]
        );
        const saveResult = await db.query(
            'SELECT id FROM story_saves WHERE story_id = $1 AND user_id = $2',
            [id, userId]
        );

        story.is_liked = likeResult.rows.length > 0;
        story.is_saved = saveResult.rows.length > 0;

        res.json({ story });
    } catch (error) {
        console.error('Error fetching story:', error);
        res.status(500).json({ message: 'Failed to fetch story' });
    }
});

// POST /api/stories - Create new story (PROTECTED)
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { title, content, image_url, category } = req.body;
        const userId = req.user.userId; // Guaranteed from auth middleware

        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        // Validate required fields
        if (!title || !content) {
            return res.status(400).json({ message: 'Title and content are required' });
        }

        // Content moderation
        const titleCheck = moderateContent(title);
        const contentCheck = moderateContent(content);

        if (!titleCheck.safe || !contentCheck.safe) {
            return res.status(400).json({
                message: 'Content violates community guidelines',
                reason: titleCheck.reason || contentCheck.reason
            });
        }

        // Stories go to 'pending' status for review (or 'approved' if auto-approve is enabled)
        const status = 'approved'; // For now, auto-approve. Change to 'pending' for manual moderation

        const result = await db.query(`
            INSERT INTO stories (user_id, title, content, image_url, category, status)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [userId, title, content, image_url, category?.toLowerCase() || 'other', status]);
        // Emit real-time event for new story
        try {
            emitNewStory(result.rows[0]);
        } catch (socketErr) {
            console.log('Socket emit failed (non-critical):', socketErr.message);
        }

        res.status(201).json({ story: result.rows[0], message: 'Story created successfully' });
    } catch (error) {
        console.error('Error creating story:', error);
        res.status(500).json({ message: 'Failed to create story' });
    }
});

// POST /api/stories/:id/like - Like a story (PROTECTED)
router.post('/:id/like', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        // Check if already liked
        const existing = await db.query(
            'SELECT id FROM story_likes WHERE story_id = $1 AND user_id = $2',
            [id, userId]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({ message: 'Already liked' });
        }

        // Add like
        await db.query(
            'INSERT INTO story_likes (story_id, user_id) VALUES ($1, $2)',
            [id, userId]
        );

        // Update likes count
        await db.query(
            'UPDATE stories SET likes_count = likes_count + 1 WHERE id = $1',
            [id]
        );
        // Get updated likes count
        const storyResult = await db.query('SELECT likes_count FROM stories WHERE id = $1', [id]);
        const likesCount = storyResult.rows[0]?.likes_count || 0;

        // Emit real-time event
        try {
            emitStoryLike(parseInt(id), likesCount, userId);
        } catch (socketErr) {
            console.log('Socket emit failed (non-critical):', socketErr.message);
        }

        res.json({ message: 'Story liked', likes_count: likesCount });
    } catch (error) {
        console.error('Error liking story:', error);
        res.status(500).json({ message: 'Failed to like story' });
    }
});

// DELETE /api/stories/:id/like - Unlike a story (PROTECTED)
router.delete('/:id/like', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const result = await db.query(
            'DELETE FROM story_likes WHERE story_id = $1 AND user_id = $2 RETURNING id',
            [id, userId]
        );

        if (result.rows.length > 0) {
            await db.query(
                'UPDATE stories SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = $1',
                [id]
            );
        }

        res.json({ message: 'Story unliked' });
    } catch (error) {
        console.error('Error unliking story:', error);
        res.status(500).json({ message: 'Failed to unlike story' });
    }
});

// POST /api/stories/:id/save - Save a story (PROTECTED)
router.post('/:id/save', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        await db.query(
            'INSERT INTO story_saves (story_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [id, userId]
        );

        res.json({ message: 'Story saved' });
    } catch (error) {
        console.error('Error saving story:', error);
        res.status(500).json({ message: 'Failed to save story' });
    }
});

// DELETE /api/stories/:id/save - Unsave a story (PROTECTED)
router.delete('/:id/save', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        await db.query(
            'DELETE FROM story_saves WHERE story_id = $1 AND user_id = $2',
            [id, userId]
        );

        res.json({ message: 'Story unsaved' });
    } catch (error) {
        console.error('Error unsaving story:', error);
        res.status(500).json({ message: 'Failed to unsave story' });
    }
});

// POST /api/stories/:id/report - Report a story (PROTECTED)
router.post('/:id/report', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { reason, details } = req.body;
        const reporterId = req.user.userId;

        if (!reason) {
            return res.status(400).json({ message: 'Report reason is required' });
        }

        await db.query(`
            INSERT INTO story_reports (story_id, reporter_id, reason, details)
            VALUES ($1, $2, $3, $4)
        `, [id, reporterId, reason, details]);

        res.json({ message: 'Report submitted. Thank you for helping keep our community safe.' });
    } catch (error) {
        console.error('Error reporting story:', error);
        res.status(500).json({ message: 'Failed to submit report' });
    }
});

module.exports = router;
