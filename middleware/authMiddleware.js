// backend/middleware/authMiddleware.js - SIMPLE WORKING VERSION
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('🔐 Checking authentication...');

  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log('❌ Invalid token:', err.message);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    console.log('✅ Token valid for user:', user.email);
    req.user = user;
    next();
  });
};

// Simple authorization - allow all authenticated users for now
const authorizeBriefAccess = async (req, res, next) => {
  console.log('✅ Authorization: Allowing access for authenticated user');
  next(); // Allow all authenticated users temporarily
};

module.exports = { authenticateToken, authorizeBriefAccess, JWT_SECRET };