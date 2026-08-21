const { validateRoadmapShape, buildDeterministicFallbackRoadmap } = require('../ai-service/generator');

describe('validateRoadmapShape', () => {
  test('rejects non-object input', () => {
    expect(validateRoadmapShape(null).valid).toBe(false);
    expect(validateRoadmapShape('a string').valid).toBe(false);
  });

  test('rejects wrong week count', () => {
    const result = validateRoadmapShape({ weeks: [{}, {}] });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/exactly 4/);
  });

  test('accepts a fully valid 4-week shape', () => {
    const weeks = [1, 2, 3, 4].map((n) => ({
      weekNumber: n,
      title: `Week ${n}`,
      objectives: ['obj1'],
      topics: ['topic1'],
      estimatedHours: 8,
      resources: [],
      project: { title: 'Project', description: 'desc' },
      deliverables: ['deliverable1'],
      completionCriteria: ['criteria1'],
    }));
    const result = validateRoadmapShape({ weeks });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('flags out-of-order weekNumbers', () => {
    const weeks = [2, 1, 3, 4].map((n) => ({
      weekNumber: n,
      title: `Week ${n}`,
      objectives: ['obj1'],
      topics: ['topic1'],
      estimatedHours: 8,
      resources: [],
      project: { title: 'Project', description: 'desc' },
      deliverables: ['d1'],
      completionCriteria: ['c1'],
    }));
    const result = validateRoadmapShape({ weeks });
    expect(result.valid).toBe(false);
  });
});

describe('buildDeterministicFallbackRoadmap', () => {
  test('always returns exactly 4 weeks even with no missing skills', () => {
    const roadmap = buildDeterministicFallbackRoadmap({ missingSkills: [], targetRole: 'Backend Developer' });
    expect(roadmap.weeks).toHaveLength(4);
    roadmap.weeks.forEach((w, idx) => {
      expect(w.weekNumber).toBe(idx + 1);
      expect(w.topics.length).toBeGreaterThan(0);
    });
  });

  test('distributes many missing skills across 4 weeks', () => {
    const missingSkills = Array.from({ length: 8 }, (_, i) => ({ skill: `Skill${i}`, gap: 8 - i }));
    const roadmap = buildDeterministicFallbackRoadmap({ missingSkills, targetRole: 'AI Engineer' });
    expect(roadmap.weeks).toHaveLength(4);
    const allTopics = roadmap.weeks.flatMap((w) => w.topics);
    expect(allTopics).toEqual(expect.arrayContaining(['Skill0']));
  });

  test('output passes validateRoadmapShape', () => {
    const roadmap = buildDeterministicFallbackRoadmap({ missingSkills: [], targetRole: 'Data Analyst' });
    const result = validateRoadmapShape(roadmap);
    expect(result.valid).toBe(true);
  });
});
