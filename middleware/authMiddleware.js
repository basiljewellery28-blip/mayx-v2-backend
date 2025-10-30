require('dotenv').config(); // <-- ADD THIS LINE AT THE VERY TOP
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  // Get token from the Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format is "Bearer TOKEN"

  if (token == null) {
    console.warn('Auth Middleware: No token provided.');
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  // Verify the token
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Auth Middleware: Token is invalid.', err.message);
      return res.status(403).json({ error: 'Invalid token.' }); // 403 Forbidden
    }

    // Token is valid. Add the user payload to the request object.
    req.user = user;
    
    // Move to the next function
    next();
  });
}

module.exports = { authenticateToken };
