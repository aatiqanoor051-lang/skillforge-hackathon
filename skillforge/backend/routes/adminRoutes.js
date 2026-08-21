const express = require('express');
const { body, param } = require('express-validator');

const User = require('../models/User');
const Profile = require('../models/Profile');
const QuizQuestion = require('../models/QuizQuestion');
const RoleRequirement = require('../models/RoleRequirement');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, ApiError } = require('../utils/apiResponse');

const router = express.Router();
router.use(requireAuth(), requireRole('admin'));

/* --------------------------- User management --------------------------- */

router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const users = await User.find().sort({ createdAt: -1 }).limit(500);
    return sendSuccess(res, { users });
  })
);

router.patch(
  '/users/:id/role',
  [param('id').isString().notEmpty(), body('role').isIn(['student', 'mentor', 'admin'])],
  validate,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) throw new ApiError('User not found.', 404);
    user.role = req.body.role;
    await user.save();
    return sendSuccess(res, { user: user.toJSON() });
  })
);

router.patch(
  '/users/:id/status',
  [param('id').isString().notEmpty(), body('isActive').isBoolean()],
  validate,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) throw new ApiError('User not found.', 404);
    user.isActive = req.body.isActive;
    await user.save();
    return sendSuccess(res, { user: user.toJSON() });
  })
);

router.patch(
  '/users/:id/mentor-assignment',
  [param('id').isString().notEmpty(), body('mentorId').optional({ nullable: true }).isString()],
  validate,
  asyncHandler(async (req, res) => {
    const profile = await Profile.findOne({ user: req.params.id });
    if (!profile) throw new ApiError('Student profile not found.', 404);

    if (req.body.mentorId) {
      const mentor = await User.findById(req.body.mentorId);
      if (!mentor || mentor.role !== 'mentor') {
        throw new ApiError('mentorId must reference an existing user with role "mentor".', 422);
      }
    }
    profile.mentor = req.body.mentorId || null;
    await profile.save();
    return sendSuccess(res, { profile });
  })
);

/* ------------------------------ Quiz bank ------------------------------- */

router.get(
  '/quiz-questions',
  asyncHandler(async (req, res) => {
    const questions = await QuizQuestion.find().sort({ createdAt: -1 }).limit(500);
    return sendSuccess(res, { questions });
  })
);

router.post(
  '/quiz-questions',
  [
    body('topic').isString().trim().isLength({ min: 1, max: 100 }),
    body('difficulty').isIn(['easy', 'medium', 'hard']),
    body('question').isString().trim().isLength({ min: 1, max: 500 }),
    body('options').isArray({ min: 2, max: 6 }),
    body('correctAnswer').isString().notEmpty(),
    body('explanation').isString().trim().isLength({ min: 1, max: 1000 }),
    body('applicableRoles').isArray({ min: 1 }),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const question = await QuizQuestion.create({ ...req.body, createdBy: req.user.userId });
    return sendSuccess(res, { question }, 201);
  })
);

router.put(
  '/quiz-questions/:id',
  [param('id').isString().notEmpty()],
  validate,
  asyncHandler(async (req, res) => {
    const question = await QuizQuestion.findById(req.params.id);
    if (!question) throw new ApiError('Question not found.', 404);
    const allowed = ['topic', 'difficulty', 'question', 'options', 'correctAnswer', 'explanation', 'applicableRoles', 'isActive'];
    for (const field of allowed) {
      if (field in req.body) question[field] = req.body[field];
    }
    await question.save();
    return sendSuccess(res, { question });
  })
);

router.delete(
  '/quiz-questions/:id',
  [param('id').isString().notEmpty()],
  validate,
  asyncHandler(async (req, res) => {
    const result = await QuizQuestion.findByIdAndDelete(req.params.id);
    if (!result) throw new ApiError('Question not found.', 404);
    return sendSuccess(res, { deleted: true });
  })
);

/* --------------------------- Role requirements --------------------------- */

router.get(
  '/role-requirements',
  asyncHandler(async (req, res) => {
    const roles = await RoleRequirement.find().sort({ role: 1 });
    return sendSuccess(res, { roles });
  })
);

router.post(
  '/role-requirements',
  [
    body('role').isString().trim().isLength({ min: 1, max: 100 }),
    body('slug').isString().trim().isLength({ min: 1, max: 100 }),
    body('description').optional().isString().isLength({ max: 500 }),
    body('requiredSkills').isArray({ min: 1 }),
    body('requiredSkills.*.skill').isString().notEmpty(),
    body('requiredSkills.*.minProficiency').isInt({ min: 0, max: 100 }),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const existing = await RoleRequirement.findOne({ role: req.body.role });
    if (existing) throw new ApiError('A role requirement with this name already exists.', 409);
    const role = await RoleRequirement.create(req.body);
    return sendSuccess(res, { role }, 201);
  })
);

router.put(
  '/role-requirements/:id',
  [param('id').isString().notEmpty()],
  validate,
  asyncHandler(async (req, res) => {
    const role = await RoleRequirement.findById(req.params.id);
    if (!role) throw new ApiError('Role requirement not found.', 404);
    const allowed = ['role', 'slug', 'description', 'requiredSkills', 'isActive'];
    for (const field of allowed) {
      if (field in req.body) role[field] = req.body[field];
    }
    await role.save();
    return sendSuccess(res, { role });
  })
);

router.delete(
  '/role-requirements/:id',
  [param('id').isString().notEmpty()],
  validate,
  asyncHandler(async (req, res) => {
    const result = await RoleRequirement.findByIdAndDelete(req.params.id);
    if (!result) throw new ApiError('Role requirement not found.', 404);
    return sendSuccess(res, { deleted: true });
  })
);

/* -------------------------------- Settings -------------------------------- */

router.get(
  '/settings',
  asyncHandler(async (req, res) => {
    return sendSuccess(res, {
      settings: {
        enableDemoAccounts: process.env.ENABLE_DEMO_ACCOUNTS === 'true',
        aiConfigured: Boolean(process.env.AI_API_KEY && process.env.AI_API_KEY.trim()),
        aiModel: process.env.AI_MODEL || 'gpt-4o-mini',
        rateLimit: {
          windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
          max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
        },
      },
    });
  })
);

module.exports = router;
