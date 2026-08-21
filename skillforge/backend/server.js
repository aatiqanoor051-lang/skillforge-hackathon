require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');

const { connectDB, disconnectDB, isDbConnected } = require('./config/db');
const { notFoundHandler, centralizedErrorHandler } = require('./middleware/errorMiddleware');
const { generalLimiter, authLimiter, aiLimiter } = require('./middleware/rateLimiter');
const { sendSuccess } = require('./utils/apiResponse');

const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const roleRoutes = require('./routes/roleRoutes');
const assessmentRoutes = require('./routes/assessmentRoutes');
const roadmapRoutes = require('./routes/roadmapRoutes');
const aiRoutes = require('./routes/aiRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const mentorRoutes = require('./routes/mentorRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 5000;

/* --------------------------- Security & parsing --------------------------- */

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Basic request logging without sensitive data (no headers/body dumped).
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`[http] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

app.use(generalLimiter);

/* --------------------------------- Health --------------------------------- */

app.get('/health', (req, res) => {
  return sendSuccess(res, {
    status: 'ok',
    service: 'skillforge-backend',
    dbConnected: isDbConnected(),
    timestamp: new Date().toISOString(),
  });
});

/* --------------------------------- Routes --------------------------------- */

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/assessment', assessmentRoutes);
app.use('/api/roadmap', roadmapRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/mentor', mentorRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFoundHandler);
app.use(centralizedErrorHandler);

/* ------------------------------- Startup ------------------------------- */

let server;

async function start() {
  if (!process.env.JWT_SECRET) {
    console.error('[startup] FATAL: JWT_SECRET is not set. Refusing to start.');
    process.exit(1);
  }

  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/skillforge';
  await connectDB(mongoUri);

  server = app.listen(PORT, () => {
    console.log(`[startup] SkillForge backend listening on port ${PORT} (env: ${process.env.NODE_ENV || 'development'})`);
    if (!process.env.AI_API_KEY) {
      console.warn('[startup] AI_API_KEY not set. AI features will run in deterministic fallback mode.');
    }
  });
}

/* ------------------------------ Shutdown -------------------------------- */

async function shutdown(signal) {
  console.log(`[shutdown] Received ${signal}. Closing gracefully...`);
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await disconnectDB();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  console.error('[fatal] Unhandled promise rejection:', reason);
});

if (require.main === module) {
  start();
}

module.exports = { app, start };
