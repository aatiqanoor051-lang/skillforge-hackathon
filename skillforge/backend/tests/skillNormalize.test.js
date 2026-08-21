const { normalizeSkillName } = require('../utils/skillNormalize');

describe('normalizeSkillName', () => {
  test('lowercases and trims', () => {
    expect(normalizeSkillName('  React  ')).toBe('react');
  });

  test('treats separators as spaces', () => {
    expect(normalizeSkillName('Node.js')).toBe('node js');
    expect(normalizeSkillName('Node-JS')).toBe('node js');
    expect(normalizeSkillName('Node_JS')).toBe('node js');
  });

  test('collapses internal whitespace', () => {
    expect(normalizeSkillName('Data   Structures')).toBe('data structures');
  });

  test('handles non-string input safely', () => {
    expect(normalizeSkillName(null)).toBe('');
    expect(normalizeSkillName(undefined)).toBe('');
    expect(normalizeSkillName(42)).toBe('');
  });
});
