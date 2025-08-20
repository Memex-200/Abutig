const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Mock server setup
const app = require('../server/index');

describe('Security & Authorization Tests', () => {
  let adminToken, employeeToken, citizenToken, otherCitizenToken;
  let adminUser, employeeUser, citizenUser, otherCitizenUser;
  let testComplaint, otherComplaint;

  beforeAll(async () => {
    // Create test users
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('test123', 12);

    // Create admin user
    adminUser = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        phone: '01000000001',
        nationalId: '12345678901234',
        fullName: 'Admin Test',
        role: 'ADMIN',
        password: hashedPassword,
        isActive: true,
      }
    });

    // Create employee user
    employeeUser = await prisma.user.create({
      data: {
        email: 'employee@test.com',
        phone: '01000000002',
        nationalId: '12345678901235',
        fullName: 'Employee Test',
        role: 'EMPLOYEE',
        password: hashedPassword,
        isActive: true,
      }
    });

    // Create citizen user
    citizenUser = await prisma.complainant.create({
      data: {
        fullName: 'Citizen Test',
        phone: '01000000003',
        nationalId: '12345678901236',
        email: 'citizen@test.com',
      }
    });

    // Create another citizen user
    otherCitizenUser = await prisma.complainant.create({
      data: {
        fullName: 'Other Citizen Test',
        phone: '01000000004',
        nationalId: '12345678901237',
        email: 'other@test.com',
      }
    });

    // Create test complaint types
    const complaintType = await prisma.complaintType.create({
      data: {
        name: 'Test Type',
        description: 'Test Description',
        icon: '🧪',
        isActive: true,
      }
    });

    // Create test complaints
    testComplaint = await prisma.complaint.create({
      data: {
        complainantId: citizenUser.id,
        typeId: complaintType.id,
        title: 'Test Complaint',
        description: 'Test Description',
        status: 'UNRESOLVED',
        location: 'Test Location',
      }
    });

    otherComplaint = await prisma.complaint.create({
      data: {
        complainantId: otherCitizenUser.id,
        typeId: complaintType.id,
        title: 'Other Complaint',
        description: 'Other Description',
        status: 'UNRESOLVED',
        location: 'Other Location',
      }
    });

    // Generate tokens
    adminToken = jwt.sign({ userId: adminUser.id }, JWT_SECRET);
    employeeToken = jwt.sign({ userId: employeeUser.id }, JWT_SECRET);
    citizenToken = jwt.sign({ complainantId: citizenUser.id }, JWT_SECRET);
    otherCitizenToken = jwt.sign({ complainantId: otherCitizenUser.id }, JWT_SECRET);
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.complaint.deleteMany({
      where: {
        id: { in: [testComplaint.id, otherComplaint.id] }
      }
    });
    await prisma.complaintType.deleteMany({
      where: { name: 'Test Type' }
    });
    await prisma.complainant.deleteMany({
      where: {
        id: { in: [citizenUser.id, otherCitizenUser.id] }
      }
    });
    await prisma.user.deleteMany({
      where: {
        id: { in: [adminUser.id, employeeUser.id] }
      }
    });
    await prisma.$disconnect();
  });

  describe('Authentication Tests', () => {
    test('should reject requests without token', async () => {
      const response = await request(app)
        .get('/api/complaints')
        .expect(401);
      
      expect(response.body.error).toBe('رمز الوصول مطلوب');
    });

    test('should reject requests with invalid token', async () => {
      const response = await request(app)
        .get('/api/complaints')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);
      
      expect(response.body.error).toBe('رمز وصول غير صالح');
    });

    test('should accept requests with valid admin token', async () => {
      const response = await request(app)
        .get('/api/complaints')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('complaints');
    });
  });

  describe('Authorization Tests', () => {
    test('should allow admin to access all complaints', async () => {
      const response = await request(app)
        .get('/api/complaints')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body.complaints.length).toBeGreaterThan(0);
    });

    test('should allow employee to access only assigned complaints', async () => {
      const response = await request(app)
        .get('/api/complaints')
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(200);
      
      // Employee should only see complaints assigned to them (initially empty)
      expect(response.body.complaints.length).toBe(0);
    });

    test('should allow citizen to access only their own complaints', async () => {
      const response = await request(app)
        .get('/api/complaints')
        .set('Authorization', `Bearer ${citizenToken}`)
        .expect(200);
      
      expect(response.body.complaints.length).toBe(1);
      expect(response.body.complaints[0].id).toBe(testComplaint.id);
    });

    test('should prevent citizen from accessing other citizen complaints', async () => {
      const response = await request(app)
        .get(`/api/complaints/${otherComplaint.id}`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .expect(403);
      
      expect(response.body.error).toBe('غير مسموح لك بالوصول لهذه الشكوى');
    });

    test('should allow admin to access any complaint', async () => {
      const response = await request(app)
        .get(`/api/complaints/${testComplaint.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body.id).toBe(testComplaint.id);
    });

    test('should prevent employee from accessing unassigned complaints', async () => {
      const response = await request(app)
        .get(`/api/complaints/${testComplaint.id}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(403);
      
      expect(response.body.error).toBe('غير مسموح لك بالوصول لهذه الشكوى');
    });
  });

  describe('Data Isolation Tests', () => {
    test('should not leak sensitive data to non-admin users', async () => {
      const response = await request(app)
        .get(`/api/complaints/${testComplaint.id}`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .expect(200);
      
      // Citizen should not see national ID or email in complainant data
      expect(response.body.complainant).not.toHaveProperty('nationalId');
      expect(response.body.complainant).not.toHaveProperty('email');
    });

    test('should provide sensitive data to admin users', async () => {
      const response = await request(app)
        .get(`/api/complaints/${testComplaint.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      // Admin should see all complainant data
      expect(response.body.complainant).toHaveProperty('nationalId');
      expect(response.body.complainant).toHaveProperty('email');
    });
  });

  describe('Status Update Tests', () => {
    test('should allow admin to update complaint status', async () => {
      const response = await request(app)
        .patch(`/api/complaints/${testComplaint.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'IN_PROGRESS',
          notes: 'Test status update'
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.complaint.status).toBe('IN_PROGRESS');
    });

    test('should prevent citizen from updating complaint status', async () => {
      const response = await request(app)
        .patch(`/api/complaints/${testComplaint.id}/status`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          status: 'RESOLVED',
          notes: 'Unauthorized update'
        })
        .expect(403);
      
      expect(response.body.error).toBe('غير مسموح لك بالوصول');
    });

    test('should create audit trail for status changes', async () => {
      const statusChange = await prisma.complaintStatusChange.findFirst({
        where: {
          complaintId: testComplaint.id,
          newStatus: 'IN_PROGRESS'
        }
      });
      
      expect(statusChange).toBeTruthy();
      expect(statusChange.userId).toBe(adminUser.id);
      expect(statusChange.oldStatus).toBe('UNRESOLVED');
      expect(statusChange.newStatus).toBe('IN_PROGRESS');
    });
  });

  describe('Input Validation Tests', () => {
    test('should reject complaint submission with invalid data', async () => {
      const response = await request(app)
        .post('/api/complaints/submit')
        .send({
          fullName: 'A', // Too short
          phone: 'invalid-phone',
          nationalId: '123', // Too short
          typeId: 'invalid-type',
          title: 'Short', // Too short
          description: 'Short' // Too short
        })
        .expect(400);
      
      expect(response.body.error).toBe('بيانات غير صالحة');
      expect(response.body.details).toBeInstanceOf(Array);
    });

    test('should reject status update with invalid status', async () => {
      const response = await request(app)
        .patch(`/api/complaints/${testComplaint.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'INVALID_STATUS',
          notes: 'Test'
        })
        .expect(400);
      
      expect(response.body.error).toBe('بيانات غير صالحة');
    });
  });

  describe('Rate Limiting Tests', () => {
    test('should enforce rate limiting on complaint submission', async () => {
      const promises = Array(15).fill().map(() => 
        request(app)
          .post('/api/complaints/submit')
          .send({
            fullName: 'Test User',
            phone: '01000000099',
            nationalId: '12345678901299',
            typeId: 'test-type-id',
            title: 'Test Complaint',
            description: 'Test Description'
          })
      );

      const responses = await Promise.all(promises);
      const rateLimited = responses.some(r => r.status === 429);
      
      expect(rateLimited).toBe(true);
    });
  });

  describe('File Upload Security Tests', () => {
    test('should reject malicious file uploads', async () => {
      const response = await request(app)
        .post('/api/complaints/submit')
        .attach('files', Buffer.from('fake-image'), {
          filename: '../../../etc/passwd',
          contentType: 'image/jpeg'
        })
        .field('fullName', 'Test User')
        .field('phone', '01000000099')
        .field('nationalId', '12345678901299')
        .field('typeId', 'test-type-id')
        .field('title', 'Test Complaint')
        .field('description', 'Test Description')
        .expect(400);
      
      expect(response.body.error).toContain('نوع الملف غير مدعوم');
    });
  });
});
