const express = require('express');

const RoleRequirement = require('../models/RoleRequirement');
const { ROLE_CATALOG } = require('../data/roleCatalog');
const { requireAuth } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

const router = express.Router();

/**
 * GET /api/roles
 * Public within the app (still requires auth) — returns the active
 * target-role catalog with benchmark skill requirements. Falls back to
 * the static in-memory catalog if the database has not been seeded yet,
 * so the frontend never renders an empty role picker.
 */
router.get(
  '/',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const dbRoles = await RoleRequirement.find({ isActive: true }).sort({ role: 1 }).lean();
    if (dbRoles.length > 0) {
      return sendSuccess(res, { roles: dbRoles, source: 'database' });
    }
    return sendSuccess(res, { roles: ROLE_CATALOG, source: 'fallback_static_catalog' });
  })
);

module.exports = router;
