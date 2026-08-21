const express = require('express');
const axios = require('axios');
const { body, query } = require('express-validator');

const QuizQuestion = require('../models/QuizQuestion');
const Assessment = require('../models/Assessment');
const Profile = require('../models/Profile');
const RoleRequirement = require('../models/RoleRequirement');
const { ROLE_CATALOG } = require('../data/roleCatalog');
const { requireAuth } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError, ApiError } = require('../utils/apiResponse');

const router = express.Router();
router.use(requireAuth());

const PYTHON_SERVICE_URL = () => process.env.PYTHON_SERVICE_URL || 'http://localhost:5001';
const QUESTIONS_PER_ASSESSMENT = 10;

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

async function getBenchmarkForRole(targetRole) {
  const dbRole = await RoleRequirement.findOne({ role: targetRole, isActive: true }).lean();
  if (dbRole) return dbRole.requiredSkills;
  const staticRole = ROLE_CATALOG.find((r) => r.role === targetRole);
  return staticRole ? staticRole.requiredSkills : [];
}

/**
 * GET /api/assessment/questions?role=Full-Stack Developer
 * Generates a short assessment (question metadata WITHOUT correctAnswer
 * or explanation) for the selected role and skill categories.
 */
router.get(
  '/questions',
  [query('role').optional().isString().isLength({ max: 100 })],
  validate,
  asyncHandler(async (req, res) => {
    const role = req.query.role;
    const filter = { isActive: true };
    if (role) filter.applicableRoles = role;

    const pool = await QuizQuestion.find(filter).lean();
    const selected = shuffle(pool).slice(0, QUESTIONS_PER_ASSESSMENT);

    const sanitized = selected.map((q) => ({
      id: q._id,
      topic: q.topic,
      difficulty: q.difficulty,
      question: q.question,
      options: q.options,
      applicableRoles: q.applicableRoles,
    }));

    return sendSuccess(res, { questions: sanitized, role: role || null });
  })
);

/**
 * POST /api/assessment/submit
 * Body: { targetRole, answers: [{ questionId, selectedAnswer }] }
 * Grades answers, forwards data to the Python analysis service,
 * stores the result, triggers roadmap generation input (handled by
 * the roadmap route so the client can control when generation runs),
 * and returns the full analysis.
 */
router.post(
  '/submit',
  [
    body('targetRole').isString().trim().isLength({ min: 1, max: 100 }),
    body('answers').isArray({ min: 1, max: 50 }),
    body('answers.*.questionId').isString().notEmpty(),
    body('answers.*.selectedAnswer').isString().notEmpty(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { targetRole, answers } = req.body;

    const questionIds = answers.map((a) => a.questionId);
    const questions = await QuizQuestion.find({ _id: { $in: questionIds } }).lean();
    const questionMap = new Map(questions.map((q) => [String(q._id), q]));

    const gradedAnswers = [];
    for (const answer of answers) {
      const question = questionMap.get(answer.questionId);
      if (!question) continue; // ignore unknown/stale question ids
      const isCorrect = question.correctAnswer === answer.selectedAnswer;
      gradedAnswers.push({
        question: question._id,
        topic: question.topic,
        selectedAnswer: answer.selectedAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
      });
    }

    if (gradedAnswers.length === 0) {
      throw new ApiError('No valid questions were found for the submitted answers.', 422);
    }

    // Aggregate raw quiz scores per topic for the Python service.
    const topicTotals = {};
    for (const a of gradedAnswers) {
      if (!topicTotals[a.topic]) topicTotals[a.topic] = { correct: 0, total: 0 };
      topicTotals[a.topic].total += 1;
      if (a.isCorrect) topicTotals[a.topic].correct += 1;
    }
    const quizScores = Object.entries(topicTotals).map(([topic, v]) => ({
      topic,
      correct: v.correct,
      total: v.total,
    }));

    const profile = await Profile.findOne({ user: req.user.userId }).lean();
    const currentSkills = (profile?.currentSkills || []).map((s) => ({
      name: s.name,
      proficiency: s.proficiency,
    }));

    const benchmarkSkills = await getBenchmarkForRole(targetRole);

    let analysis;
    try {
      const response = await axios.post(
        `${PYTHON_SERVICE_URL()}/api/analyze`,
        {
          current_skills: currentSkills,
          target_role: targetRole,
          quiz_scores: quizScores,
          benchmark_skills: benchmarkSkills,
        },
        { timeout: 8000 }
      );
      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Analysis service returned an error.');
      }
      analysis = response.data.data;
    } catch (err) {
      console.error(`[assessment] Python analysis call failed: ${err.message}`);
      return sendError(
        res,
        'The skill-analysis service is currently unavailable. Please try again shortly.',
        503
      );
    }

    const assessment = await Assessment.create({
      user: req.user.userId,
      targetRole,
      answers: gradedAnswers,
      topicScores: analysis.topicScores,
      overallScore: analysis.overallReadiness,
      matchedSkills: analysis.matchedSkills,
      missingSkills: analysis.missingSkills,
      analysisWarnings: analysis.warnings,
      submittedAt: new Date(),
    });

    return sendSuccess(res, { assessment, analysis }, 201);
  })
);

/**
 * GET /api/assessment/history
 * Returns the authenticated student's past assessments, newest first.
 */
router.get(
  '/history',
  asyncHandler(async (req, res) => {
    const assessments = await Assessment.find({ user: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    return sendSuccess(res, { assessments });
  })
);

module.exports = router;
