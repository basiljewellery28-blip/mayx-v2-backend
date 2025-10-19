// backend/middleware/authorizeMiddleware.js
const db = require('../db/Index.js');

const authorizeBriefAccess = async (req, res, next) => {
  try {
    const briefId = req.params.id;
    const userId = req.user.userId;

    // Check if user has access to this brief
    const queryText = `
      SELECT * FROM briefs 
      WHERE id = $1 AND (user_id = $2 OR id IN (
        SELECT brief_id FROM brief_collaborators WHERE user_id = $2
      ))
    `;
    const result = await db.query(queryText, [briefId, userId]);
    
    if (result.rows.length === 0) {
      return res.status(403).json({ 
        error: 'Access denied. You do not have permission to access this brief.' 
      });
    }

    // User has access, continue to the route handler
    next();
  } catch (error) {
    console.error('❌ Authorization error:', error);
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

module.exports = { authorizeBriefAccess };