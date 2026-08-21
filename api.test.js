/**
 * Basic API smoke tests.
 * Requires a reachable MongoDB (set MONGODB_URI, ideally a test database) before running:
 *   npm test
 */
require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Student = require('../models/Student');

const sampleStudent = {
  studentId: 'TEST001',
  fullName: 'Test Student',
  email: 'test.student@example.com',
  department: 'Computer Science',
  year: 2,
  semester: 3
};

beforeAll(async () => {
  // Wait for mongoose connection triggered by server.js's start()
  await new Promise((resolve) => {
    if (mongoose.connection.readyState === 1) return resolve();
    mongoose.connection.once('connected', resolve);
  });
  await Student.deleteMany({ studentId: sampleStudent.studentId });
});

afterAll(async () => {
  await Student.deleteMany({ studentId: sampleStudent.studentId });
  await mongoose.connection.close();
});

describe('Health check', () => {
  it('GET /api/health returns ok status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status');
  });
});

describe('Student CRUD', () => {
  let createdId;

  it('creates a student', async () => {
    const res = await request(app).post('/api/students').send(sampleStudent);
    expect(res.statusCode).toBe(201);
    expect(res.body.student.studentId).toBe(sampleStudent.studentId);
    createdId = res.body.student._id;
  });

  it('rejects duplicate studentId/email', async () => {
    const res = await request(app).post('/api/students').send(sampleStudent);
    expect(res.statusCode).toBe(409);
  });

  it('fetches the student list with pagination', async () => {
    const res = await request(app).get('/api/students?limit=5');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('pagination');
  });

  it('updates the student', async () => {
    const res = await request(app).put(`/api/students/${createdId}`).send({
      ...sampleStudent,
      fullName: 'Updated Name'
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.student.fullName).toBe('Updated Name');
  });

  it('deletes the student', async () => {
    const res = await request(app).delete(`/api/students/${createdId}`);
    expect(res.statusCode).toBe(200);
  });
});
