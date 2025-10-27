// backend/middleware/authorizeMiddleware.js
const db = require('../db/Index.js');

const authorizeBriefAccess = async (req, res, next) => {
    // ... other checks for briefId ...

    try {
        const briefId = req.params.id || req.body.brief_id; // Get brief ID
        const userId = req.user.userId; // Get user ID from the token

        // **FIX:** Change 'user_id' to 'consultant_id'
        const queryText = `
            SELECT id 
            FROM briefs 
            WHERE id = 1 AND consultant_id = 2; 
        `;
        
        // Use userId from the token to check if they own the brief
        const result = await db.query(queryText, [briefId, userId]); 

        if (result.rows.length === 0) {
            // If the brief ID exists but the consultant_id doesn't match the userId
            return res.status(403).json({ 
                error: 'Authorization failed: You do not have access to this brief.' 
            });
        }
        
        // User is the consultant on the brief, allow access
        next();

    } catch (error) {
        // Log the specific error for debugging, but return a generic 500 error
        console.error('❌ Authorization error:', error);
        res.status(500).json({ error: 'Server authorization failed.' });
    }
};

module.exports = { authorizeBriefAccess };