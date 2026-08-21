const express = require('express');
const { param, query } = require('express-validator');

const User = require('../models/User');
const Profile = require('../models/Profile');
const Assessment = require('../models/Assessment');
const Roadmap = require('../models/Roadmap');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, ApiError } = require('../utils/apiResponse');

const router = express.Router();
router.use(requireAuth(), requireRole('mentor', 'admin'));

/**
 * GET /api/mentor/students?assignedOnly=true
 * Mentors see students assigned to them by default; admins (or a
 * mentor passing assignedOnly=false) can see all students.
 */
router.get(
  '/students',
  [query('assignedOnly').optional().isBoolean()],
  validate,
  asyncHandler(async (req, res) => {
    const assignedOnly = req.query.assignedOnly !== 'false';
    const profileFilter = {};
    if (req.user.role === 'mentor' && assignedOnly) {
      profileFilter.mentor = req.user.userId;
    }

    const profiles = await Profile.find(profileFilter).populate('user', 'name email role isActive').lean();
    const studentProfiles = profiles.filter((p) => p.user && p.user.role === 'student');

    return sendSuccess(res, { students: studentProfiles });
  })
);

/**
 * GET /api/mentor/students/:userId/dashboard
 * Skill-gap dashboard for one student: profile, latest assessment,
 * latest roadmap.
 */
router.get(
  '/students/:userId/dashboard',
  [param('userId').isString().notEmpty()],
  validate,
  asyncHandler(async (req, res) => {
    const targetUserId = req.params.userId;

    const profile = await Profile.findOne({ user: targetUserId }).populate('user', 'name email');
    if (!profile) throw new ApiError('Student profile not found.', 404);

    if (req.user.role === 'mentor' && String(profile.mentor) !== req.user.userId) {
      throw new ApiError('You are not assigned to this student.', 403);
    }

    const [latestAssessment, latestRoadmap] = await Promise.all([
      Assessment.findOne({ user: targetUserId }).sort({ createdAt: -1 }),
      Roadmap.findOne({ user: targetUserId, isLatest: true }),
    ]);

    return sendSuccess(res, { profile, latestAssessment, latestRoadmap });
  })
);

module.exports = router;
