/**
 * apiResponse.js
 * Centralized, consistent JSON response helpers: { success, data, error }.
 */

function sendSuccess(res, data = null, status = 200, meta = undefined) {
  const body = { success: true, data, error: null };
  if (meta !== undefined) body.meta = meta;
  return res.status(status).json(body);
}

function sendError(res, message = 'Something went wrong', status = 500, details = undefined) {
  const body = { success: false, data: null, error: message };
  if (details !== undefined) body.details = details;
  return res.status(status).json(body);
}

class ApiError extends Error {
  constructor(message, status = 500, details = undefined) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

module.exports = { sendSuccess, sendError, ApiError };
