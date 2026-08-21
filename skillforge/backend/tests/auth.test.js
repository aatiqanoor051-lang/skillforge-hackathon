/**
 * auth.test.js
 * Integration tests for registration, login, and RBAC enforcement.
 * Uses mongodb-memory-server so tests do not require a running MongoDB
 * instance or network access.
 */

process.env.JWT_SECRET = 'test-secret-at-least-32-characters-long';
process.env.NODE_ENV = 'test';
process.env.BCRYPT_SALT_ROUNDS = '4'; // faster hashing for tests

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;
let app;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri();
  await mongoose.connect(process.env.MONGO_URI);
  // Import app after env vars are set so it picks up JWT_SECRET, etc.
  // eslint-disable-next-line global-require
  ({ app } = require('../server'));
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

describe('POST /api/auth/register', () => {
  test('registers a new student and returns a token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'SuperSecret123',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('student');
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  test('rejects duplicate email registration', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Grace Hopper',
      email: 'grace@example.com',
      password: 'SuperSecret123',
    });
    const res = await request(app).post('/api/auth/register').send({
      name: 'Grace Hopper 2',
      email: 'grace@example.com',
      password: 'AnotherPass123',
    });
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test('rejects a weak/short password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Short Pass',
      email: 'short@example.com',
      password: '123',
    });
    expect(res.status).toBe(422);
  });

  test('rejects an invalid email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Bad Email',
      email: 'not-an-email',
      password: 'SuperSecret123',
    });
    expect(res.status).toBe(422);
  });
});

describe('POST /api/auth/login', () => {
  beforeAll(async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Login Test',
      email: 'login@example.com',
      password: 'CorrectPass123',
    });
  });

  test('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'CorrectPass123',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
  });

  test('rejects incorrect password without leaking whether the email exists', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'WrongPassword',
    });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid email or password/i);
  });

  test('rejects login for a nonexistent email with the same generic error', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@example.com',
      password: 'WhateverPass123',
    });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid email or password/i);
  });
});

describe('Authentication and RBAC middleware', () => {
  let studentToken;

  beforeAll(async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'RBAC Student',
      email: 'rbacstudent@example.com',
      password: 'StudentPass123',
    });
    studentToken = res.body.data.token;
  });

  test('rejects protected routes with no token', async () => {
    const res = await request(app).get('/api/profile');
    expect(res.status).toBe(401);
  });

  test('rejects protected routes with a malformed token', async () => {
    const res = await request(app).get('/api/profile').set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });

  test('allows a student to access their own profile', async () => {
    const res = await request(app).get('/api/profile').set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('denies a student access to admin-only routes', async () => {
    const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
  });

  test('denies a student access to mentor-only routes', async () => {
    const res = await request(app).get('/api/mentor/students').set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
  });

  test('GET /health does not require authentication', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ok');
  });
});
