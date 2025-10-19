// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // Must match the secret in auth.js

const authenticateToken = (req, res, next) => {
  // Get the token from the 'Authorization' header (format: "Bearer <token>")
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  // Verify the token
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }
    
    // Attach the user data (decoded from the token) to the request object
    req.user = user; 
    next(); // Pass control to the next middleware/route handler
  });
};

module.exports = { authenticateToken };

// Check if user is associated with the brief (client, consultant, or admin)
const authorizeBriefAccess = async (req, res, next) => {
  try {
    const briefId = req.params.id;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Admins can access everything
    if (userRole === 'admin') {
      return next();
    }

    // Check if user is associated with the brief
    const briefResult = await db.query(
      `SELECT * FROM briefs 
       WHERE id = $1 AND (client_id = $2 OR consultant_id = $2)`,
      [briefId, userId]
    );

    if (briefResult.rows.length === 0) {
      return res.status(403).json({ 
        error: 'Access denied. You are not associated with this brief.' 
      });
    }

    next();
  } catch (error) {
    console.error('Authorization error:', error);
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

module.exports = { authenticateToken, authorizeBriefAccess, JWT_SECRET };