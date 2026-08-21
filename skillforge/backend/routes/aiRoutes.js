const express = require('express');
const { body } = require('express-validator');

const { runCoachQuery, ToolValidationError, ToolAuthorizationError } = require('../ai-service/agent');
const { requireAuth } = require('../middleware/authMiddleware');
const { aiLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const router = express.Router();
router.use(requireAuth());

/**
 * POST /api/ai/chat
 * Body: { message }
 * Floating AI Coach endpoint. Retrieves grounded context from the local
 * knowledge base, pulls the student's own skill-gap data via authorized
 * agent tools, and returns a response that distinguishes grounded
 * information from general advice.
 */
router.post(
  '/chat',
  aiLimiter,
  [body('message').isString().trim().isLength({ min: 1, max: 2000 })],
  validate,
  asyncHandler(async (req, res) => {
    try {
      const result = await runCoachQuery(req.user, req.body.message);
      return sendSuccess(res, result);
    } catch (err) {
      if (err instanceof ToolValidationError) {
        return sendError(res, err.message, 422);
      }
      if (err instanceof ToolAuthorizationError) {
        return sendError(res, err.message, 403);
      }
      throw err;
    }
  })
);

module.exports = router;
