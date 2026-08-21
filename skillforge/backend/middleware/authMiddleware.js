const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendError } = require('../utils/apiResponse');

/**
 * requireAuth
 * Verifies the Bearer JWT, loads the corresponding active user, and
 * attaches it to req.user. This is the single source of truth for
 * authentication — the frontend route guards are UX only.
 */
function requireAuth() {
  return async function authenticate(req, res, next) {
    try {
      const header = req.headers.authorization || '';
      const [scheme, token] = header.split(' ');

      if (scheme !== 'Bearer' || !token) {
        return sendError(res, 'Authentication required. Provide a valid Bearer token.', 401);
      }

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        return sendError(res, 'Invalid or expired token.', 401);
      }

      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        return sendError(res, 'Account not found or deactivated.', 401);
      }

      req.user = {
        userId: user._id.toString(),
        role: user.role,
        email: user.email,
        name: user.name,
      };
      req.authTokenPayload = decoded;
      return next();
    } catch (err) {
      return sendError(res, 'Authentication failed.', 401);
    }
  };
}

module.exports = { requireAuth };
