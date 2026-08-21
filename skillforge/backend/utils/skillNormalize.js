/**
 * skillNormalize.js
 * Node-side mirror of the normalization rules used by the Python
 * SkillAnalyzer, so route-level validation/lookups stay consistent
 * with the analysis service's matching behavior.
 */
function normalizeSkillName(name) {
  if (typeof name !== 'string') return '';
  return name
    .trim()
    .toLowerCase()
    .replace(/[_\-./]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

module.exports = { normalizeSkillName };
