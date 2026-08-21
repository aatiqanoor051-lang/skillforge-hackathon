const rateLimit = require('express-rate-limit');

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000;
const generalMax = parseInt(process.env.RATE_LIMIT_MAX, 10) || 100;
const aiMax = parseInt(process.env.AI_RATE_LIMIT_MAX, 10) || 20;

const generalLimiter = rateLimit({
  windowMs,
  max: generalMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, data: null, error: 'Too many requests. Please try again later.' },
});

const authLimiter = rateLimit({
  windowMs,
  max: Math.max(10, Math.floor(generalMax / 4)),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, data: null, error: 'Too many authentication attempts. Please try again later.' },
});

const aiLimiter = rateLimit({
  windowMs,
  max: aiMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, data: null, error: 'Too many AI requests. Please slow down and try again shortly.' },
});

module.exports = { generalLimiter, authLimiter, aiLimiter };
