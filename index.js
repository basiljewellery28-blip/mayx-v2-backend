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
require('dotenv').config();

const http = require('http');
const socketService = require('./services/socketService');

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5000;

// Initialize Socket.IO
socketService.init(server);

// CORS configuration
app.use(cors({
    origin: 'http://localhost:3000', // Or 'http://localhost:3001'
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));

app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routers
const briefsRouter = require('./routes/briefs');
const briefVersionsRouter = require('./routes/briefVersions');
const commentsRouter = require('./routes/comments');
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const clientsRouter = require('./routes/clients');
const notificationsRouter = require('./routes/notifications');
const analyticsRouter = require('./routes/analytics');
const productsRouter = require('./routes/products');

app.use('/api/briefs', briefsRouter);
app.use('/api/brief-versions', briefVersionsRouter);
app.use('/api/briefs', commentsRouter); // Note: comments are mounted under /api/briefs/:id/comments
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/products', productsRouter);

app.get('/', (req, res) => {
    res.json({ message: 'Hello from MAYX backend!' });
});

server.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
    console.log('📝 Routes registered successfully');
});