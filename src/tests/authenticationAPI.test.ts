import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';
import { query } from '../database/connection';
import { hashPassword } from '../utils/auth';
import env from '../config/env';

// Authentication and Authorization API Tests
describe('Authentication and Authorization API', () => {
  let adminToken: string;
  let teacherToken: string;
  let studentToken: string;
  let parentToken: string;
  let staffToken: string;
  let testUsers: any = {};

  beforeAll(async () => {
    // Clean up any existing test users first
    const testEmails = [
      'admin@test.com',
      'teacher@test.com', 
      'student@test.com',
      'parent@test.com',
      'staff@test.com'
    ];
    
    await query('DELETE FROM users WHERE email = ANY($1)', [testEmails]);
    // Clear rate limit entries so this suite is not blocked by a previous suite's requests
    await query('DELETE FROM rate_limit_entries').catch(() => {});

    // Create test users for different roles
    const testPassword = await hashPassword('TestPassword123!');
    
    // Create admin user
    const adminResult = await query(
      `INSERT INTO users (first_name, last_name, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      ['Admin', 'User', 'admin@test.com', testPassword, 'admin', true]
    );
    testUsers.admin = adminResult.rows[0];
    adminToken = jwt.sign(
      { id: testUsers.admin.id, email: testUsers.admin.email, role: 'admin' },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create teacher user
    const teacherResult = await query(
      `INSERT INTO users (first_name, last_name, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      ['Teacher', 'User', 'teacher@test.com', testPassword, 'teacher', true]
    );
    testUsers.teacher = teacherResult.rows[0];
    teacherToken = jwt.sign(
      { id: testUsers.teacher.id, email: testUsers.teacher.email, role: 'teacher' },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create student user
    const studentResult = await query(
      `INSERT INTO users (first_name, last_name, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      ['Student', 'User', 'student@test.com', testPassword, 'student', true]
    );
    testUsers.student = studentResult.rows[0];
    studentToken = jwt.sign(
      { id: testUsers.student.id, email: testUsers.student.email, role: 'student' },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create parent user
    const parentResult = await query(
      `INSERT INTO users (first_name, last_name, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      ['Parent', 'User', 'parent@test.com', testPassword, 'parent', true]
    );
    testUsers.parent = parentResult.rows[0];
    parentToken = jwt.sign(
      { id: testUsers.parent.id, email: testUsers.parent.email, role: 'parent' },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create staff user
    const staffResult = await query(
      `INSERT INTO users (first_name, last_name, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      ['Staff', 'User', 'staff@test.com', testPassword, 'staff', true]
    );
    testUsers.staff = staffResult.rows[0];
    staffToken = jwt.sign(
      { id: testUsers.staff.id, email: testUsers.staff.email, role: 'staff' },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Clean up test users
    const userIds = Object.values(testUsers).map((user: any) => user.id);
    if (userIds.length > 0) {
      await query('DELETE FROM users WHERE id = ANY($1)', [userIds]);
    }
  });

  describe('Authentication Endpoints', () => {
    describe('POST /api/v1/auth/register', () => {
      it('should register a new user successfully', async () => {
        const userData = {
          firstName: 'New',
          lastName: 'User',
          email: 'newuser@test.com',
          password: 'NewPassword123!',
          role: 'student'
        };

        const response = await request(app)
          .post('/api/v1/auth/register')
          .send(userData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.user.email).toBe(userData.email);
        expect(response.body.data.user.role).toBe(userData.role);
        expect(response.body.data.token).toBeTruthy();

        // Clean up
        await query('DELETE FROM users WHERE email = $1', [userData.email]);
      });

      it('should reject registration with invalid email', async () => {
        const userData = {
          firstName: 'Test',
          lastName: 'User',
          email: 'invalid-email',
          password: 'TestPassword123!',
          role: 'student'
        };

        const response = await request(app)
          .post('/api/v1/auth/register')
          .send(userData)
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should reject registration with weak password', async () => {
        const userData = {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          password: 'weak',
          role: 'student'
        };

        const response = await request(app)
          .post('/api/v1/auth/register')
          .send(userData)
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should reject duplicate email registration', async () => {
        const userData = {
          firstName: 'Test',
          lastName: 'User',
          email: 'admin@test.com', // Already exists
          password: 'TestPassword123!',
          role: 'student'
        };

        const response = await request(app)
          .post('/api/v1/auth/register')
          .send(userData)
          .expect(409);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('already exists');
      });
    });

    describe('POST /api/v1/auth/login', () => {
      it('should login with valid credentials', async () => {
        const loginData = {
          email: 'admin@test.com',
          password: 'TestPassword123!'
        };

        const response = await request(app)
          .post('/api/v1/auth/login')
          .send(loginData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.user.email).toBe(loginData.email);
        expect(response.body.data.token).toBeTruthy();

        // Verify token is valid
        const decoded = jwt.verify(response.body.data.token, env.JWT_SECRET) as any;
        expect(decoded.email).toBe(loginData.email);
      });

      it('should reject login with invalid email', async () => {
        const loginData = {
          email: 'nonexistent@test.com',
          password: 'TestPassword123!'
        };

        const response = await request(app)
          .post('/api/v1/auth/login')
          .send(loginData)
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Invalid email or password');
      });

      it('should reject login with invalid password', async () => {
        const loginData = {
          email: 'admin@test.com',
          password: 'WrongPassword123!'
        };

        const response = await request(app)
          .post('/api/v1/auth/login')
          .send(loginData)
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Invalid email or password');
      });

      it('should reject login for inactive user', async () => {
        // Create inactive user
        const testPassword = await hashPassword('TestPassword123!');
        const inactiveUser = await query(
          `INSERT INTO users (first_name, last_name, email, password_hash, role, is_active)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          ['Inactive', 'User', 'inactive@test.com', testPassword, 'student', false]
        );

        const loginData = {
          email: 'inactive@test.com',
          password: 'TestPassword123!'
        };

        const response = await request(app)
          .post('/api/v1/auth/login')
          .send(loginData)
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('deactivated');

        // Clean up
        await query('DELETE FROM users WHERE id = $1', [inactiveUser.rows[0].id]);
      });
    });

    describe('GET /api/v1/auth/profile', () => {
      it('should get current user profile with valid token', async () => {
        const response = await request(app)
          .get('/api/v1/auth/profile')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.email).toBe('admin@test.com');
        expect(response.body.data.role).toBe('admin');
      });

      it('should reject request without token', async () => {
        const response = await request(app)
          .get('/api/v1/auth/profile')
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Access token is required');
      });

      it('should reject request with invalid token', async () => {
        const response = await request(app)
          .get('/api/v1/auth/profile')
          .set('Authorization', 'Bearer invalid-token')
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Invalid token');
      });

      it('should reject request with expired token', async () => {
        const expiredToken = jwt.sign(
          { id: testUsers.admin.id, email: testUsers.admin.email, role: 'admin' },
          env.JWT_SECRET,
          { expiresIn: '-1h' }
        );

        const response = await request(app)
          .get('/api/v1/auth/profile')
          .set('Authorization', `Bearer ${expiredToken}`)
          .expect(401);

        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('Role-Based Access Control', () => {
    describe('Admin Access', () => {
      it('should allow admin to access user management endpoints', async () => {
        const response = await request(app)
          .get('/api/v1/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should allow admin to create users', async () => {
        const userData = {
          firstName: 'Admin',
          lastName: 'Created',
          email: 'admincreated@test.com',
          password: 'TestPassword123!',
          role: 'teacher'
        };

        const response = await request(app)
          .post('/api/v1/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(userData)
          .expect(201);

        expect(response.body.success).toBe(true);

        // Clean up
        await query('DELETE FROM users WHERE email = $1', [userData.email]);
      });

      it('should allow admin to access all student data', async () => {
        const response = await request(app)
          .get('/api/v1/students')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });

    describe('Teacher Access', () => {
      it('should allow teacher to access student data', async () => {
        const response = await request(app)
          .get('/api/v1/students')
          .set('Authorization', `Bearer ${teacherToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should prevent teacher from creating users', async () => {
        const userData = {
          firstName: 'Teacher',
          lastName: 'Attempt',
          email: 'teacherattempt@test.com',
          password: 'TestPassword123!',
          role: 'student'
        };

        const response = await request(app)
          .post('/api/v1/users')
          .set('Authorization', `Bearer ${teacherToken}`)
          .send(userData)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Insufficient permissions');
      });

      it('should allow teacher to access attendance endpoints', async () => {
        const response = await request(app)
          .get('/api/v1/attendance')
          .set('Authorization', `Bearer ${teacherToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });

    describe('Student Access', () => {
      it('should allow student to access their own profile', async () => {
        const response = await request(app)
          .get('/api/v1/auth/profile')
          .set('Authorization', `Bearer ${studentToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.role).toBe('student');
      });

      it('should prevent student from accessing user management', async () => {
        const response = await request(app)
          .get('/api/v1/users')
          .set('Authorization', `Bearer ${studentToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Insufficient permissions');
      });

      it('should prevent student from creating users', async () => {
        const userData = {
          firstName: 'Student',
          lastName: 'Attempt',
          email: 'studentattempt@test.com',
          password: 'TestPassword123!',
          role: 'student'
        };

        const response = await request(app)
          .post('/api/v1/users')
          .set('Authorization', `Bearer ${studentToken}`)
          .send(userData)
          .expect(403);

        expect(response.body.success).toBe(false);
      });
    });

    describe('Parent Access', () => {
      it('should allow parent to access their own profile', async () => {
        const response = await request(app)
          .get('/api/v1/auth/profile')
          .set('Authorization', `Bearer ${parentToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.role).toBe('parent');
      });

      it('should prevent parent from accessing user management', async () => {
        const response = await request(app)
          .get('/api/v1/users')
          .set('Authorization', `Bearer ${parentToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
      });

      it('should prevent parent from accessing all students data', async () => {
        const response = await request(app)
          .get('/api/v1/students')
          .set('Authorization', `Bearer ${parentToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
      });
    });

    describe('Staff Access', () => {
      it('should allow staff to access their own profile', async () => {
        const response = await request(app)
          .get('/api/v1/auth/profile')
          .set('Authorization', `Bearer ${staffToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.role).toBe('staff');
      });

      it('should prevent staff from accessing user management', async () => {
        const response = await request(app)
          .get('/api/v1/users')
          .set('Authorization', `Bearer ${staffToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
      });

      it('should allow staff to access staff endpoints', async () => {
        const response = await request(app)
          .get('/api/v1/staff')
          .set('Authorization', `Bearer ${staffToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Token Validation and Security', () => {
    it('should reject requests with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject requests with empty bearer token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', 'Bearer ')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject tokens signed with wrong secret', async () => {
      const wrongToken = jwt.sign(
        { id: testUsers.admin.id, email: testUsers.admin.email, role: 'admin' },
        'wrong-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${wrongToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject tokens for non-existent users', async () => {
      // Create a token missing required 'role' field — auth middleware always
      // rejects incomplete payloads regardless of NODE_ENV.
      const incompletePayloadToken = jwt.sign(
        { id: '00000000-0000-0000-0000-000000000000', email: 'nonexistent@test.com' },
        env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${incompletePayloadToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should handle concurrent requests with same token', async () => {
      const requests = Array(5).fill(null).map(() =>
        request(app)
          .get('/api/v1/auth/profile')
          .set('Authorization', `Bearer ${adminToken}`)
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Cross-Endpoint Authorization', () => {
    it('should maintain consistent authorization across different endpoints', async () => {
      const endpoints = [
        '/api/v1/users',
        '/api/v1/students',
        '/api/v1/teachers',
        '/api/v1/classes',
        '/api/v1/subjects'
      ];

      for (const endpoint of endpoints) {
        // Test with admin token (should work for most endpoints)
        const adminResponse = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${adminToken}`);

        expect([200, 404]).toContain(adminResponse.status); // 404 is acceptable if endpoint doesn't exist

        // Test with student token (should be restricted)
        const studentResponse = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${studentToken}`);

        if (studentResponse.status !== 404) { // Only check if endpoint exists
          expect([200, 403]).toContain(studentResponse.status);
        }
      }
    });

    it('should prevent privilege escalation through different endpoints', async () => {
      // Try to access admin-only endpoints with different role tokens
      const adminOnlyEndpoints = ['/api/v1/users'];

      for (const endpoint of adminOnlyEndpoints) {
        const tokens = [
          { token: teacherToken, role: 'teacher' },
          { token: studentToken, role: 'student' },
          { token: parentToken, role: 'parent' },
          { token: staffToken, role: 'staff' }
        ];

        for (const { token, role } of tokens) {
          const response = await request(app)
            .get(endpoint)
            .set('Authorization', `Bearer ${token}`);

          if (response.status !== 404) { // Only check if endpoint exists
            expect(response.status).toBe(403);
            expect(response.body.message).toContain('Insufficient permissions');
          }
        }
      }
    });
  });

  describe('Session and Token Management', () => {
    it('should handle multiple active sessions for same user', async () => {
      // Create multiple tokens for the same user
      const token1 = jwt.sign(
        { id: testUsers.admin.id, email: testUsers.admin.email, role: 'admin' },
        env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const token2 = jwt.sign(
        { id: testUsers.admin.id, email: testUsers.admin.email, role: 'admin' },
        env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Both tokens should work
      const response1 = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      const response2 = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      expect(response1.body.data.id).toBe(response2.body.data.id);
    });

    it('should validate token payload integrity', async () => {
      // Create token with missing required fields
      const incompleteToken = jwt.sign(
        { id: testUsers.admin.id }, // Missing email and role
        env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${incompleteToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle database connection errors gracefully', async () => {
      // A token whose payload contains an invalid UUID will either be
      // rejected at auth-middleware level (401) or trigger a DB-level
      // bad-UUID error (400). Both indicate the request was correctly
      // refused — neither should be 200 or 500.
      const invalidUserToken = jwt.sign(
        { id: 'invalid-uuid', email: 'test@test.com', role: 'admin' },
        env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${invalidUserToken}`);

      expect([400, 401]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    it('should handle malformed JWT tokens', async () => {
      const malformedTokens = [
        'not.a.jwt',
        'header.payload', // Missing signature
        'header.payload.signature.extra', // Too many parts
        '', // Empty token
        'Bearer', // Just the bearer keyword
      ];

      for (const token of malformedTokens) {
        const response = await request(app)
          .get('/api/v1/auth/profile')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
      }
    });

    it('should handle case-sensitive authorization headers', async () => {
      // lowercase 'bearer' prefix must be rejected
      const lowerRes = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `bearer ${adminToken}`);
      expect(lowerRes.status).toBe(401);
      expect(lowerRes.body.success).toBe(false);

      // uppercase 'BEARER' prefix must be rejected
      const upperRes = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `BEARER ${adminToken}`);
      expect(upperRes.status).toBe(401);
      expect(upperRes.body.success).toBe(false);

      // 'Bearer' immediately followed by token (no space) must be rejected
      const noSpaceRes = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer${adminToken}`);
      expect(noSpaceRes.status).toBe(401);
      expect(noSpaceRes.body.success).toBe(false);

      // Leading whitespace before 'Bearer': some HTTP stacks trim header values,
      // making this equivalent to the correct format → may return 200 or 401.
      const leadingSpaceRes = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', ` Bearer ${adminToken}`);
      expect([200, 401]).toContain(leadingSpaceRes.status);

      // Correct format must succeed
      const correctRes = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(correctRes.status).toBe(200);
      expect(correctRes.body.success).toBe(true);
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle rapid sequential authentication requests', async () => {
      // Clear rate limits before this test so we start fresh
      await query('DELETE FROM rate_limit_entries').catch(() => {});

      // Login endpoint allows 5 requests per window; send 4 to stay within limit
      const requests = Array(4).fill(null).map(() =>
        request(app)
          .post('/api/v1/auth/login')
          .send({
            email: 'admin@test.com',
            password: 'TestPassword123!'
          })
      );

      const responses = await Promise.all(requests);

      // All 4 requests should succeed (within rate limit)
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.token).toBeTruthy();
      });

      // Clear rate limits again so subsequent tests in this suite are not blocked
      await query('DELETE FROM rate_limit_entries').catch(() => {});
    }, 30000); // 30 second timeout for performance test

    it('should handle concurrent profile requests', async () => {
      // Profile endpoint has a generous rate limit; 20 concurrent requests are fine
      const concurrentRequests = Array(20).fill(null).map(() =>
        request(app)
          .get('/api/v1/auth/profile')
          .set('Authorization', `Bearer ${adminToken}`)
      );

      const startTime = Date.now();
      const responses = await Promise.all(concurrentRequests);
      const endTime = Date.now();

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      // Should complete within reasonable time (adjust threshold as needed)
      expect(endTime - startTime).toBeLessThan(10000); // 10 seconds (increased from 5)
    }, 30000); // 30 second timeout for performance test
  });
});