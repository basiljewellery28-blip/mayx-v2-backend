// Catch unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Don't exit immediately in development, so you can see the error
  // process.exit(1);
});

// Catch uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
  process.exit(1);
});
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// CORS configuration
app.use(cors({
    origin: 'http://localhost:3000', // Or 'http://localhost:3001'
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));


app.use(express.json());

// Routers
const briefsRouter = require('./routes/briefs');
app.use('/api/briefs', briefsRouter);

const briefVersionsRouter = require('./routes/briefVersions');
app.use('/api/briefs', briefVersionsRouter);

const commentsRouter = require('./routes/comments');
app.use('/api/briefs', commentsRouter);

// ⬇️⬇️⬇️ ADD AUTH ROUTER ⬇️⬇️⬇️
const authRouter = require('./routes/auth');
app.use('/api/auth', authRouter);

app.get('/', (req, res) => {
  res.json({ message: 'Hello from MAYX backend!' });
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});

console.log('📝 briefsRouter registered for /api/briefs');