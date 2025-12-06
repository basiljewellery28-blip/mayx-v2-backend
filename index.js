// Catch unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
});

// Catch uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception thrown:', err);
    process.exit(1);
});

const express = require('express');
const cors = require('cors');
const helmet = require('helmet'); // Security headers
const rateLimit = require('express-rate-limit'); // Rate limiting
require('dotenv').config();

const http = require('http');
const socketService = require('./services/socketService');

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5000;

// Initialize Socket.IO
socketService.init(server);

// ============ SECURITY MIDDLEWARE ============

// 1. Helmet - Security headers (XSS, Clickjacking, etc.)
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow images to load
}));

// 2. Rate Limiting - Prevent brute force and DoS
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Limit each IP to 500 requests per window
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(globalLimiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Only 10 auth attempts per 15 min
    message: { error: 'Too many login attempts, please try again in 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});

// 3. Request size limit - Prevent large payload attacks
app.use(express.json({ limit: '10kb' }));

// 4. CORS - Whitelist allowed origins
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:8081', // Metro bundler
    'http://10.0.2.2:5000',  // Android emulator
    'http://127.0.0.1:8081',
    process.env.FRONTEND_URL, // Production URL from env
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked origin: ${origin}`);
            callback(null, true); // For now, allow but log (change to false in production)
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));

// Serve static files (uploads)
app.use('/uploads', express.static('uploads'));

// ============ REQUEST LOGGING ============
app.use((req, res, next) => {
    // Don't log sensitive data
    const safeUrl = req.url.replace(/password=[^&]*/gi, 'password=***');
    console.log(`[${new Date().toISOString()}] ${req.method} ${safeUrl}`);
    next();
});

// ============ ROUTES ============
const briefsRouter = require('./routes/briefs');
const briefVersionsRouter = require('./routes/briefVersions');
const commentsRouter = require('./routes/comments');
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const clientsRouter = require('./routes/clients');
const notificationsRouter = require('./routes/notifications');
const analyticsRouter = require('./routes/analytics');
const productsRouter = require('./routes/products');
const storiesRouter = require('./routes/stories');
const messagesRouter = require('./routes/messages');

// Apply auth rate limiter to auth routes
app.use('/api/auth', authLimiter, authRouter);

// Other routes
app.use('/api/briefs', briefsRouter);
app.use('/api/brief-versions', briefVersionsRouter);
app.use('/api/briefs', commentsRouter);
app.use('/api/users', usersRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/products', productsRouter);
app.use('/api/stories', storiesRouter);
app.use('/api/messages', messagesRouter);

// Health check
app.get('/', (req, res) => {
    res.json({ message: 'MAYX API - Secured', version: '2.0' });
});

// ============ ERROR HANDLING ============
app.use((err, req, res, next) => {
    console.error('Server Error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
});

server.listen(port, () => {
    console.log(`🔒 Secured server running on port: ${port}`);
    console.log('📝 Routes registered successfully');
    console.log('🛡️ Security: Helmet, Rate Limiting, CORS enabled');
});