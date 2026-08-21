const express = require('express');
const { body, param } = require('express-validator');

const Roadmap = require('../models/Roadmap');
const Assessment = require('../models/Assessment');
const Profile = require('../models/Profile');
const { generateRoadmap } = require('../ai-service/generator');
const { requireAuth } = require('../middleware/authMiddleware');
const { aiLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, ApiError } = require('../utils/apiResponse');

const router = express.Router();
router.use(requireAuth());

function summarizeProfile(profile) {
  if (!profile) return 'No profile data available.';
  const skills = (profile.currentSkills || [])
    .map((s) => `${s.name} (${s.proficiency}/100)`)
    .join(', ');
  const projects = (profile.projects || []).map((p) => p.title).join(', ');
  return `Experience level: ${profile.experienceLevel || 'unknown'}. Current skills: ${
    skills || 'none listed'
  }. Projects: ${projects || 'none listed'}. Education: ${profile.education || 'not provided'}.`;
}

function summarizeAssessment(assessment) {
  if (!assessment) return 'No assessment on file.';
  const topicSummary = (assessment.topicScores || [])
    .map((t) => `${t.topic}: ${t.percentage}%`)
    .join(', ');
  return `Overall readiness: ${assessment.overallScore}%. Topic scores: ${topicSummary || 'none'}.`;
}

/**
 * POST /api/roadmap/generate
 * Body: { assessmentId? } — defaults to the student's latest assessment.
 * Invokes the AI roadmap generator (with structured validation + retry
 * + deterministic fallback) using the missing-skill array, current
 * profile, target role, and assessment summary.
 */
router.post(
  '/generate',
  aiLimiter,
  [body('assessmentId').optional().isString()],
  validate,
  asyncHandler(async (req, res) => {
    let assessment;
    if (req.body.assessmentId) {
      assessment = await Assessment.findOne({ _id: req.body.assessmentId, user: req.user.userId });
      if (!assessment) throw new ApiError('Assessment not found.', 404);
    } else {
      assessment = await Assessment.findOne({ user: req.user.userId }).sort({ createdAt: -1 });
      if (!assessment) {
        throw new ApiError('Complete an assessment before generating a roadmap.', 422);
      }
    }

    const profile = await Profile.findOne({ user: req.user.userId }).lean();
    const targetRole = assessment.targetRole || profile?.targetRole || 'Unspecified Role';

    const generationResult = await generateRoadmap({
      missingSkills: assessment.missingSkills || [],
      profileSummary: summarizeProfile(profile),
      targetRole,
      assessmentSummary: summarizeAssessment(assessment),
    });

    // Only one roadmap is "latest" at a time.
    await Roadmap.updateMany({ user: req.user.userId, isLatest: true }, { $set: { isLatest: false } });

    const roadmap = await Roadmap.create({
      user: req.user.userId,
      sourceAssessment: assessment._id,
      targetRole,
      generationMethod: generationResult.method,
      generationMeta: {
        model: generationResult.model || '',
        generatedAt: new Date(),
        basedOnMissingSkills: (assessment.missingSkills || []).map((m) => m.skill),
      },
      weeks: generationResult.weeks,
      isLatest: true,
    });

    return sendSuccess(res, { roadmap }, 201);
  })
);

/**
 * GET /api/roadmap/latest
 * Returns the authenticated student's most recent roadmap.
 */
router.get(
  '/latest',
  asyncHandler(async (req, res) => {
    const roadmap = await Roadmap.findOne({ user: req.user.userId, isLatest: true }).sort({
      createdAt: -1,
    });
    return sendSuccess(res, { roadmap: roadmap || null });
  })
);

/**
 * PATCH /api/roadmap/:id/progress
 * Body: { weekNumber, status }
 * Updates a single week's status and recalculates completionPercentage.
 */
router.patch(
  '/:id/progress',
  [
    param('id').isString().notEmpty(),
    body('weekNumber').isInt({ min: 1, max: 4 }),
    body('status').isIn(['not_started', 'in_progress', 'completed']),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const roadmap = await Roadmap.findOne({ _id: req.params.id, user: req.user.userId });
    if (!roadmap) throw new ApiError('Roadmap not found.', 404);

    const week = roadmap.weeks.find((w) => w.weekNumber === Number(req.body.weekNumber));
    if (!week) throw new ApiError('Week not found on this roadmap.', 404);

    week.status = req.body.status;

    const completedCount = roadmap.weeks.filter((w) => w.status === 'completed').length;
    roadmap.completionPercentage = Math.round((completedCount / roadmap.weeks.length) * 100);
    roadmap.overallStatus =
      completedCount === roadmap.weeks.length
        ? 'completed'
        : roadmap.weeks.some((w) => w.status !== 'not_started')
        ? 'in_progress'
        : 'not_started';

    await roadmap.save();
    return sendSuccess(res, { roadmap });
  })
);

module.exports = router;
