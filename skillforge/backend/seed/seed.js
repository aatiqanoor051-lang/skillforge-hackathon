/**
 * seed.js
 * Idempotent seed script for demo data: role requirements, quiz question
 * bank, sample resources, and demo accounts (student/mentor/admin).
 *
 * Demo accounts are only created when ENABLE_DEMO_ACCOUNTS=true and are
 * clearly marked with isDemoAccount: true so they can be audited or
 * disabled for production deployments.
 *
 * Usage: node seed/seed.js   (or `npm run seed` from backend/)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Profile = require('../models/Profile');
const QuizQuestion = require('../models/QuizQuestion');
const RoleRequirement = require('../models/RoleRequirement');
const Resource = require('../models/Resource');

const { ROLE_CATALOG } = require('../data/roleCatalog');
const { QUIZ_BANK } = require('../data/quizBank');

const DEMO_PASSWORD = 'DemoPass123!';

async function seedRoleRequirements() {
  let created = 0;
  for (const role of ROLE_CATALOG) {
    const result = await RoleRequirement.findOneAndUpdate(
      { role: role.role },
      { $setOnInsert: role },
      { upsert: true, new: true, rawResult: true }
    );
    if (result.lastErrorObject && result.lastErrorObject.upserted) created += 1;
  }
  console.log(`[seed] Role requirements ensured (${created} newly created, ${ROLE_CATALOG.length} total).`);
}

async function seedQuizQuestions() {
  let created = 0;
  for (const q of QUIZ_BANK) {
    const existing = await QuizQuestion.findOne({ question: q.question });
    if (!existing) {
      // eslint-disable-next-line no-await-in-loop
      await QuizQuestion.create(q);
      created += 1;
    }
  }
  console.log(`[seed] Quiz questions ensured (${created} newly created, ${QUIZ_BANK.length} total in bank).`);
}

async function seedDemoAccounts() {
  if (process.env.ENABLE_DEMO_ACCOUNTS !== 'true') {
    console.log('[seed] ENABLE_DEMO_ACCOUNTS is not "true" — skipping demo account creation.');
    return {};
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10);

  const demoUsers = [
    { name: 'Demo Student', email: 'demo.student@skillforge.local', role: 'student' },
    { name: 'Demo Mentor', email: 'demo.mentor@skillforge.local', role: 'mentor' },
    { name: 'Demo Admin', email: 'demo.admin@skillforge.local', role: 'admin' },
  ];

  const createdUsers = {};
  for (const demo of demoUsers) {
    // eslint-disable-next-line no-await-in-loop
    let user = await User.findOne({ email: demo.email });
    if (!user) {
      // eslint-disable-next-line no-await-in-loop
      user = await User.create({
        name: demo.name,
        email: demo.email,
        passwordHash,
        role: demo.role,
        isDemoAccount: true,
      });
      console.log(`[seed] Created demo account: ${demo.email} (role: ${demo.role})`);
    }
    createdUsers[demo.role] = user;

    // eslint-disable-next-line no-await-in-loop
    const existingProfile = await Profile.findOne({ user: user._id });
    if (!existingProfile) {
      // eslint-disable-next-line no-await-in-loop
      await Profile.create({
        user: user._id,
        education: demo.role === 'student' ? 'B.S. Computer Science (in progress)' : '',
        currentSkills:
          demo.role === 'student'
            ? [
                { name: 'JavaScript', proficiency: 55 },
                { name: 'HTML', proficiency: 70 },
                { name: 'CSS', proficiency: 60 },
                { name: 'Git', proficiency: 50 },
              ]
            : [],
        targetRole: demo.role === 'student' ? 'Full-Stack Developer' : '',
        experienceLevel: 'beginner',
      });
    }
  }

  console.log(`[seed] Demo account password for all demo accounts: "${DEMO_PASSWORD}" (non-production use only).`);
  return createdUsers;
}

async function seedResources(createdUsers) {
  const creator = createdUsers.admin || createdUsers.mentor;
  if (!creator) {
    console.log('[seed] No admin/mentor demo account available — skipping demo resource seeding.');
    return;
  }

  const sampleResources = [
    {
      title: 'MDN Web Docs: JavaScript Guide',
      url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
      type: 'documentation',
      topics: ['JavaScript'],
      difficulty: 'beginner',
      description: 'Comprehensive, official reference and guide for JavaScript fundamentals.',
      source: 'MDN',
    },
    {
      title: 'React Official Documentation',
      url: 'https://react.dev/learn',
      type: 'documentation',
      topics: ['React'],
      difficulty: 'beginner',
      description: 'The official, up-to-date guide for learning React from the ground up.',
      source: 'react.dev',
    },
    {
      title: 'freeCodeCamp: Responsive Web Design',
      url: 'https://www.freecodecamp.org/learn/2022/responsive-web-design/',
      type: 'course',
      topics: ['HTML', 'CSS', 'Responsive Design'],
      difficulty: 'beginner',
      description: 'A free, project-based curriculum covering HTML and CSS fundamentals.',
      source: 'freeCodeCamp',
    },
    {
      title: 'PostgreSQL Tutorial',
      url: 'https://www.postgresqltutorial.com/',
      type: 'tutorial',
      topics: ['SQL'],
      difficulty: 'beginner',
      description: 'A structured, example-driven SQL tutorial using PostgreSQL.',
      source: 'postgresqltutorial.com',
    },
  ].map((r) => ({ ...r, type: r.type === 'tutorial' ? 'course' : r.type }));

  let created = 0;
  for (const r of sampleResources) {
    // eslint-disable-next-line no-await-in-loop
    const existing = await Resource.findOne({ url: r.url });
    if (!existing) {
      // eslint-disable-next-line no-await-in-loop
      await Resource.create({
        ...r,
        createdBy: creator._id,
        verificationStatus: 'verified',
        verifiedBy: creator._id,
      });
      created += 1;
    }
  }
  console.log(`[seed] Demo resources ensured (${created} newly created).`);
}

async function run() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/skillforge';
  await connectDB(mongoUri, { retries: 3, retryDelayMs: 2000 });

  if (mongoose.connection.readyState !== 1) {
    console.error('[seed] Could not connect to MongoDB. Aborting seed.');
    process.exit(1);
  }

  await seedRoleRequirements();
  await seedQuizQuestions();
  const createdUsers = await seedDemoAccounts();
  await seedResources(createdUsers);

  console.log('[seed] Seed complete.');
  await disconnectDB();
  process.exit(0);
}

run().catch(async (err) => {
  console.error('[seed] Seed failed:', err);
  await disconnectDB();
  process.exit(1);
});
