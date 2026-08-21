const { sendError } = require('../utils/apiResponse');

/**
 * requireRole
 * Server-side RBAC gate. Must run after requireAuth(). Accepts one or
 * more allowed roles; rejects with 403 if the authenticated user's
 * role is not in the allow-list.
 */
function requireRole(...allowedRoles) {
  return function authorize(req, res, next) {
    if (!req.user) {
      return sendError(res, 'Authentication required before authorization can be checked.', 401);
    }
    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied. This action requires one of the following roles: ${allowedRoles.join(', ')}.`,
        403
      );
    }
    return next();
  };
}

/**
 * requireSelfOrRole
 * Allows access if the authenticated user is acting on their own
 * resource (matched via req.params[paramName] === req.user.userId)
 * OR if their role is in allowedRoles. Used to let students access
 * only their own data while mentors/admins retain broader access.
 */
function requireSelfOrRole(paramName, ...allowedRoles) {
  return function authorize(req, res, next) {
    if (!req.user) {
      return sendError(res, 'Authentication required before authorization can be checked.', 401);
    }
    const targetId = req.params[paramName];
    if (targetId && targetId === req.user.userId) {
      return next();
    }
    if (allowedRoles.includes(req.user.role)) {
      return next();
    }
    return sendError(res, 'Access denied. You may only access your own data.', 403);
  };
}

module.exports = { requireRole, requireSelfOrRole };
