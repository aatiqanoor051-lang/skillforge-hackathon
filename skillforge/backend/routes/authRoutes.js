const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');

const User = require('../models/User');
const Profile = require('../models/Profile');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError, ApiError } = require('../utils/apiResponse');

const router = express.Router();

function issueToken(user) {
  return jwt.sign({ userId: user._id.toString(), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

/**
 * POST /api/auth/register
 * Body: { name, email, password, role? }
 * "role" may only be "student" from the public endpoint; mentor/admin
 * accounts must be provisioned by an existing admin via /api/admin/users.
 */
router.post(
  '/register',
  authLimiter,
  [
    body('name').isString().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters.'),
    body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
    body('password')
      .isString()
      .isLength({ min: 8, max: 200 })
      .withMessage('Password must be at least 8 characters.'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new ApiError('An account with this email already exists.', 409);
    }

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'student',
    });

    await Profile.create({ user: user._id });

    const token = issueToken(user);
    return sendSuccess(res, { token, user: user.toJSON() }, 201);
  })
);

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
    body('password').isString().notEmpty().withMessage('Password is required.'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user || !user.isActive) {
      return sendError(res, 'Invalid email or password.', 401);
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return sendError(res, 'Invalid email or password.', 401);
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = issueToken(user);
    return sendSuccess(res, { token, user: user.toJSON() });
  })
);

/**
 * GET /api/auth/me
 * Requires a valid Bearer token. Returns the authenticated user.
 */
router.get(
  '/me',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return sendError(res, 'User not found.', 404);
    }
    return sendSuccess(res, { user: user.toJSON() });
  })
);

module.exports = router;
