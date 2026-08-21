const { validationResult } = require('express-validator');
const { sendError } = require('../utils/apiResponse');

/**
 * validate
 * Runs after an array of express-validator checks; returns a 422 with
 * field-level details on the first set of validation failures.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(
      res,
      'Validation failed.',
      422,
      errors.array().map((e) => ({ field: e.path, message: e.msg }))
    );
  }
  return next();
}

module.exports = validate;
