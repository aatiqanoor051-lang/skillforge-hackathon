const path = require('path');
const { RagEngine } = require('../ai-service/ragEngine');

describe('RagEngine', () => {
  const engine = new RagEngine(path.join(__dirname, '..', 'ai-service', 'knowledge-base'));

  test('loads markdown documents from the knowledge base directory', () => {
    const docs = engine.loadDocuments();
    expect(docs.length).toBeGreaterThanOrEqual(2);
    const files = docs.map((d) => d.file);
    expect(files).toEqual(expect.arrayContaining(['web_dev_roadmap.md', 'ai_engineer_guide.md']));
  });

  test('returns relevant passages for a matching query', () => {
    const results = engine.search('neural network activation function');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].source).toBe('ai_engineer_guide.md');
  });

  test('returns empty array for an empty query', () => {
    expect(engine.search('')).toEqual([]);
  });

  test('does not throw for nonsense queries with no matches', () => {
    const results = engine.search('zzzzzz qqqqqq nonexistent term');
    expect(Array.isArray(results)).toBe(true);
  });
});
