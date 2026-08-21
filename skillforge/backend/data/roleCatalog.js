/**
 * roleCatalog.js
 * Maintainable data source for target-role benchmark requirements.
 * Consumed by the seed script (RoleRequirement collection) and by
 * routes that need a fallback in-memory copy of the catalog.
 *
 * proficiency scale used throughout SkillForge: 0-100
 *   0-24   none / unaware
 *   25-49  beginner
 *   50-74  intermediate
 *   75-100 proficient
 */

const ROLE_CATALOG = [
  {
    role: 'Full-Stack Developer',
    slug: 'full-stack-developer',
    description:
      'Builds and ships complete web applications end to end, from database schema to UI, with a working knowledge of DevOps.',
    requiredSkills: [
      { skill: 'JavaScript', minProficiency: 70 },
      { skill: 'React', minProficiency: 65 },
      { skill: 'Node.js', minProficiency: 65 },
      { skill: 'REST APIs', minProficiency: 60 },
      { skill: 'SQL', minProficiency: 55 },
      { skill: 'MongoDB', minProficiency: 50 },
      { skill: 'Git', minProficiency: 60 },
      { skill: 'Docker', minProficiency: 40 },
      { skill: 'System Design', minProficiency: 40 },
    ],
  },
  {
    role: 'Frontend Developer',
    slug: 'frontend-developer',
    description:
      'Specializes in building accessible, performant, and visually polished user interfaces.',
    requiredSkills: [
      { skill: 'HTML', minProficiency: 75 },
      { skill: 'CSS', minProficiency: 70 },
      { skill: 'JavaScript', minProficiency: 75 },
      { skill: 'React', minProficiency: 70 },
      { skill: 'Responsive Design', minProficiency: 65 },
      { skill: 'Accessibility', minProficiency: 50 },
      { skill: 'State Management', minProficiency: 55 },
      { skill: 'Testing', minProficiency: 40 },
    ],
  },
  {
    role: 'Backend Developer',
    slug: 'backend-developer',
    description:
      'Designs and maintains server-side logic, databases, and APIs that power applications.',
    requiredSkills: [
      { skill: 'Node.js', minProficiency: 70 },
      { skill: 'REST APIs', minProficiency: 70 },
      { skill: 'SQL', minProficiency: 65 },
      { skill: 'MongoDB', minProficiency: 60 },
      { skill: 'Authentication', minProficiency: 60 },
      { skill: 'System Design', minProficiency: 55 },
      { skill: 'Docker', minProficiency: 50 },
      { skill: 'Testing', minProficiency: 45 },
    ],
  },
  {
    role: 'Python Developer',
    slug: 'python-developer',
    description:
      'Builds backend services, automation, and tooling using Python and its ecosystem.',
    requiredSkills: [
      { skill: 'Python', minProficiency: 75 },
      { skill: 'REST APIs', minProficiency: 60 },
      { skill: 'SQL', minProficiency: 55 },
      { skill: 'Object-Oriented Design', minProficiency: 60 },
      { skill: 'Testing', minProficiency: 50 },
      { skill: 'Git', minProficiency: 55 },
      { skill: 'Docker', minProficiency: 40 },
    ],
  },
  {
    role: 'Data Analyst',
    slug: 'data-analyst',
    description:
      'Extracts, cleans, and interprets data to produce actionable business insight.',
    requiredSkills: [
      { skill: 'SQL', minProficiency: 75 },
      { skill: 'Python', minProficiency: 55 },
      { skill: 'Excel', minProficiency: 60 },
      { skill: 'Data Visualization', minProficiency: 65 },
      { skill: 'Statistics', minProficiency: 60 },
      { skill: 'Data Cleaning', minProficiency: 60 },
      { skill: 'Storytelling', minProficiency: 45 },
    ],
  },
  {
    role: 'AI Engineer',
    slug: 'ai-engineer',
    description:
      'Builds and deploys machine learning and applied-AI systems, including LLM-powered products.',
    requiredSkills: [
      { skill: 'Python', minProficiency: 75 },
      { skill: 'Machine Learning', minProficiency: 65 },
      { skill: 'Deep Learning', minProficiency: 55 },
      { skill: 'LLMs & Prompting', minProficiency: 60 },
      { skill: 'Data Structures & Algorithms', minProficiency: 55 },
      { skill: 'SQL', minProficiency: 45 },
      { skill: 'MLOps', minProficiency: 35 },
      { skill: 'Statistics', minProficiency: 55 },
    ],
  },
];

module.exports = { ROLE_CATALOG };
