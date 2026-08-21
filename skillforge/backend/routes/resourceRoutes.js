const express = require('express');
const { body, query, param } = require('express-validator');

const Resource = require('../models/Resource');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, ApiError } = require('../utils/apiResponse');

const router = express.Router();
router.use(requireAuth());

/**
 * GET /api/resources?topic=React&difficulty=beginner
 * Browse verified (and, for the creator, pending) resources.
 */
router.get(
  '/',
  [
    query('topic').optional().isString().isLength({ max: 100 }),
    query('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.topic) filter.topics = req.query.topic;
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;

    // Students see verified resources plus their own submissions;
    // mentors/admins can see everything.
    if (req.user.role === 'student') {
      filter.$or = [{ verificationStatus: 'verified' }, { createdBy: req.user.userId }];
    }

    const resources = await Resource.find(filter).sort({ createdAt: -1 }).limit(200);
    return sendSuccess(res, { resources });
  })
);

/**
 * POST /api/resources
 * Any authenticated user may submit a resource; it starts as "pending"
 * until a mentor/admin verifies it (except mentor/admin submissions,
 * which are auto-verified).
 */
router.post(
  '/',
  [
    body('title').isString().trim().isLength({ min: 1, max: 200 }),
    body('url').isURL({ require_protocol: true }),
    body('type').optional().isIn(['article', 'video', 'course', 'documentation', 'book', 'tool', 'other']),
    body('topics').optional().isArray({ max: 20 }),
    body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']),
    body('description').optional().isString().isLength({ max: 1000 }),
    body('source').optional().isString().isLength({ max: 200 }),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const isPrivileged = ['mentor', 'admin'].includes(req.user.role);
    const resource = await Resource.create({
      ...req.body,
      createdBy: req.user.userId,
      verificationStatus: isPrivileged ? 'verified' : 'pending',
      verifiedBy: isPrivileged ? req.user.userId : null,
    });
    return sendSuccess(res, { resource }, 201);
  })
);

/**
 * PATCH /api/resources/:id/verify (mentor/admin only)
 * Body: { status: 'verified' | 'rejected' }
 */
router.patch(
  '/:id/verify',
  requireRole('mentor', 'admin'),
  [param('id').isString().notEmpty(), body('status').isIn(['verified', 'rejected'])],
  validate,
  asyncHandler(async (req, res) => {
    const resource = await Resource.findById(req.params.id);
    if (!resource) throw new ApiError('Resource not found.', 404);

    resource.verificationStatus = req.body.status;
    resource.verifiedBy = req.user.userId;
    await resource.save();

    return sendSuccess(res, { resource });
  })
);

module.exports = router;
