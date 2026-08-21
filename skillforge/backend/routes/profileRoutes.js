const express = require('express');
const { body } = require('express-validator');

const Profile = require('../models/Profile');
const { requireAuth } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, ApiError } = require('../utils/apiResponse');

const router = express.Router();

router.use(requireAuth());

/**
 * GET /api/profile
 * Returns the authenticated student's own profile.
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    let profile = await Profile.findOne({ user: req.user.userId });
    if (!profile) {
      // Defensive: profile should exist from registration, but self-heal if missing.
      profile = await Profile.create({ user: req.user.userId });
    }
    return sendSuccess(res, { profile });
  })
);

/**
 * PUT /api/profile
 * Updates the authenticated user's own profile fields.
 */
router.put(
  '/',
  [
    body('education').optional().isString().isLength({ max: 300 }),
    body('bio').optional().isString().isLength({ max: 1000 }),
    body('currentSkills').optional().isArray({ max: 60 }),
    body('currentSkills.*.name').optional().isString().isLength({ min: 1, max: 100 }),
    body('currentSkills.*.proficiency').optional().isInt({ min: 0, max: 100 }),
    body('projects').optional().isArray({ max: 30 }),
    body('projects.*.title').optional().isString().isLength({ min: 1, max: 150 }),
    body('targetRole').optional().isString().isLength({ max: 100 }),
    body('experienceLevel').optional().isIn(['beginner', 'intermediate', 'advanced']),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const allowedFields = [
      'education',
      'bio',
      'currentSkills',
      'projects',
      'targetRole',
      'experienceLevel',
    ];
    const updates = {};
    for (const field of allowedFields) {
      if (field in req.body) updates[field] = req.body[field];
    }

    let profile = await Profile.findOne({ user: req.user.userId });
    if (!profile) {
      profile = new Profile({ user: req.user.userId });
    }
    Object.assign(profile, updates);

    // Mark onboarding complete once the core fields are present.
    if (profile.targetRole && profile.currentSkills && profile.currentSkills.length > 0) {
      profile.onboardingComplete = true;
    }

    await profile.save();
    return sendSuccess(res, { profile });
  })
);

module.exports = router;
