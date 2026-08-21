const { sendError } = require('../utils/apiResponse');

/**
 * notFoundHandler
 * Catches any request that did not match a defined route.
 */
function notFoundHandler(req, res) {
  return sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
}

/**
 * centralizedErrorHandler
 * Single place that formats all errors into the { success, data, error }
 * envelope. Never leaks stack traces or secrets to the client; logs
 * server-side without sensitive request bodies.
 */
// eslint-disable-next-line no-unused-vars
function centralizedErrorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const message = err.expose === false ? 'Internal server error.' : err.message || 'Internal server error.';

  console.error(
    `[error] ${req.method} ${req.originalUrl} -> ${status} :: ${err.message}` +
      (process.env.NODE_ENV !== 'production' && err.stack ? `\n${err.stack}` : '')
  );

  return sendError(res, message || 'Internal server error.', status, err.details);
}

module.exports = { notFoundHandler, centralizedErrorHandler };
