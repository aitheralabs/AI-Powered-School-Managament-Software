import request from 'supertest';
import app from '../app';
import { query } from '../database/connection';

// API Integration Tests - Testing Real Endpoints
// Uses int-* prefixed emails to avoid conflicts with authenticationAPI.test.ts
describe('API Integration Tests', () => {
  let adminToken: string;
  let teacherToken: string;
  let studentToken: string;
  let parentToken: string;

  // Test data IDs that will be created during tests
  let createdUserId: string;
  let createdStudentId: string;
  let createdTeacherId: string;      // teachers table UUID
  let createdTeacherUserId: string;  // users table UUID (needed for class assignment)
  let createdClassId: string;
  let createdSubjectId: string;
  let createdAcademicYearId: string;
  let createdSemesterId: string;

  beforeAll(async () => {
    // Clean up test data in correct FK order so registration tests are idempotent.
    // classes.teacher_id -> users.id, so classes must be deleted before users.
    const testSchoolId = '00000000-0000-0000-0000-000000000001';
    const testEmails = ['int-admin@test.com', 'int-teacher@test.com', 'int-student@test.com'];
    try {
      await query('DELETE FROM student_fees WHERE school_id = $1', [testSchoolId]).catch(() => {});
      await query('DELETE FROM payments WHERE school_id = $1', [testSchoolId]).catch(() => {});
      await query('DELETE FROM fee_categories WHERE school_id = $1', [testSchoolId]).catch(() => {});
      await query('DELETE FROM attendance WHERE school_id = $1', [testSchoolId]).catch(() => {});
      await query('DELETE FROM class_subjects WHERE class_id IN (SELECT id FROM classes WHERE school_id = $1)', [testSchoolId]).catch(() => {});
      await query('DELETE FROM student_classes WHERE school_id = $1', [testSchoolId]).catch(() => {}); // table may not exist
      await query('DELETE FROM student_class_history WHERE class_id IN (SELECT id FROM classes WHERE school_id = $1)', [testSchoolId]).catch(() => {});
      await query('DELETE FROM students WHERE school_id = $1', [testSchoolId]).catch(() => {});
      await query('DELETE FROM teachers WHERE school_id = $1', [testSchoolId]).catch(() => {});
      await query('DELETE FROM classes WHERE school_id = $1', [testSchoolId]).catch(() => {});
      await query('DELETE FROM subjects WHERE school_id = $1 OR school_id IS NULL', [testSchoolId]).catch(() => {});
      await query('DELETE FROM semesters WHERE school_id = $1', [testSchoolId]).catch(() => {});
      await query('DELETE FROM academic_years WHERE school_id = $1', [testSchoolId]).catch(() => {});
      await query('DELETE FROM users WHERE email = ANY($1)', [testEmails]).catch(() => {});
      // Clear rate limit entries so prior suites don't block this suite's login attempts
      await query('DELETE FROM rate_limit_entries').catch(() => {});
    } catch (err) { /* ignore */ }
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  describe('Health Check and Basic Endpoints', () => {
    it('should return health check status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Server is running');
      expect(response.body.environment).toBeTruthy();
    });

    it('should return API documentation', async () => {
      const response = await request(app)
        .get('/api/v1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('School Management API v1');
      expect(response.body.endpoints).toBeTruthy();
      expect(response.body.endpoints.auth).toBe('/api/v1/auth');
      expect(response.body.endpoints.users).toBe('/api/v1/users');
    });

    it('should handle 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/v1/non-existent-route')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('Authentication API Tests', () => {
    it('should register a new admin user', async () => {
      const userData = {
        firstName: 'Admin',
        lastName: 'User',
        email: 'int-admin@test.com',
        password: 'AdminPass123!',
        role: 'admin'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('registered successfully');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.role).toBe(userData.role);
      expect(response.body.data.token).toBeTruthy();
      
      adminToken = response.body.data.token;
      createdUserId = response.body.data.user.id;
    });

    it('should not register user with duplicate email', async () => {
      const userData = {
        firstName: 'Another',
        lastName: 'Admin',
        email: 'int-admin@test.com', // Same email as above
        password: 'AdminPass123!',
        role: 'admin'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should validate registration data', async () => {
      const invalidData = {
        firstName: 'A', // Too short
        lastName: '', // Empty
        email: 'invalid-email', // Invalid format
        password: '123', // Too short
        role: 'invalid-role' // Invalid role
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeTruthy();
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'int-admin@test.com',
        password: 'AdminPass123!'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('successful');
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data.token).toBeTruthy();
      
      adminToken = response.body.data.token; // Update token
    });

    it('should not login with invalid credentials', async () => {
      const loginData = {
        email: 'int-admin@test.com',
        password: 'WrongPassword123!'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid');
    });

    it('should validate login data', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: ''
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeTruthy();
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      // Profile endpoint returns data as flat user object (not nested under data.user)
      const userData = response.body.data.user || response.body.data;
      expect(userData.email).toBe('int-admin@test.com');
      expect(userData.role).toBe('admin');
    });

    it('should not get profile without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('token');
    });

    it('should not get profile with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid token');
    });
  });

  describe('User Management API Tests', () => {
    it('should get users list with admin token', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toBeTruthy();
      expect(Array.isArray(response.body.data.users)).toBe(true);
      expect(response.body.data.pagination).toBeTruthy();
    });

    it('should not get users list without admin token', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should get specific user by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(createdUserId);
      expect(response.body.data.user.email).toBe('int-admin@test.com');
    });

    it('should handle invalid user ID format', async () => {
      const response = await request(app)
        .get('/api/v1/users/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`);

      // IdSchema accepts non-UUID strings, so may return 404 (not found) or 400 (bad request)
      expect([400, 404]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    it('should handle non-existent user ID', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app)
        .get(`/api/v1/users/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should update user profile', async () => {
      const updateData = {
        firstName: 'Updated Admin',
        lastName: 'Updated User'
      };

      const response = await request(app)
        .put(`/api/v1/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.firstName).toBe(updateData.firstName);
      expect(response.body.data.user.lastName).toBe(updateData.lastName);
    });

    it('should validate update data', async () => {
      const invalidData = {
        firstName: 'A', // Too short
        email: 'invalid-email'
      };

      const response = await request(app)
        .put(`/api/v1/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeTruthy();
    });
  });

  describe('Academic Year Management API Tests', () => {
    it('should create academic year', async () => {
      const academicYearData = {
        name: '2024-2025',
        startDate: '2024-08-01',
        endDate: '2025-07-31',
        isActive: true
      };

      const response = await request(app)
        .post('/api/v1/academic-years')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(academicYearData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.academicYear.name).toBe(academicYearData.name);
      expect(response.body.data.academicYear.isActive).toBe(true);
      
      createdAcademicYearId = response.body.data.academicYear.id;
    });

    it('should get academic years list', async () => {
      const response = await request(app)
        .get('/api/v1/academic-years')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.academicYears).toBeTruthy();
      expect(Array.isArray(response.body.data.academicYears)).toBe(true);
      expect(response.body.data.academicYears.length).toBeGreaterThan(0);
    });

    it('should validate academic year data', async () => {
      const invalidData = {
        name: '', // Empty name
        startDate: 'invalid-date',
        endDate: '2024-01-01', // End before start
        isActive: 'not-boolean'
      };

      const response = await request(app)
        .post('/api/v1/academic-years')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeTruthy();
    });
  });

  describe('Semester Management API Tests', () => {
    it('should create semester within academic year', async () => {
      const semesterData = {
        name: 'Fall 2024',
        academicYearId: createdAcademicYearId,
        startDate: '2024-08-01',
        endDate: '2024-12-31',
        isActive: true
      };

      const response = await request(app)
        .post('/api/v1/semesters')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(semesterData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.semester.name).toBe(semesterData.name);
      expect(response.body.data.semester.academicYearId).toBe(createdAcademicYearId);
      
      createdSemesterId = response.body.data.semester.id;
    });

    it('should get semesters list', async () => {
      const response = await request(app)
        .get('/api/v1/semesters')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.semesters).toBeTruthy();
      expect(Array.isArray(response.body.data.semesters)).toBe(true);
    });

    it('should filter semesters by academic year', async () => {
      const response = await request(app)
        .get(`/api/v1/semesters?academicYearId=${createdAcademicYearId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.semesters).toBeTruthy();
      expect(response.body.data.semesters.every((s: any) => s.academicYearId === createdAcademicYearId)).toBe(true);
    });
  });

  describe('Subject Management API Tests', () => {
    it('should create subject', async () => {
      const subjectData = {
        name: 'Mathematics',
        code: 'MATH101',
        description: 'Basic Mathematics for Grade 5',
        creditHours: 4,
        isActive: true
      };

      const response = await request(app)
        .post('/api/v1/subjects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(subjectData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.subject.name).toBe(subjectData.name);
      expect(response.body.data.subject.code).toBe(subjectData.code);
      
      createdSubjectId = response.body.data.subject.id;
    });

    it('should get subjects list', async () => {
      const response = await request(app)
        .get('/api/v1/subjects')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.subjects).toBeTruthy();
      expect(Array.isArray(response.body.data.subjects)).toBe(true);
    });

    it('should not create subject with duplicate code', async () => {
      const duplicateSubjectData = {
        name: 'Advanced Mathematics',
        code: 'MATH101', // Same code as above
        description: 'Advanced Mathematics',
        creditHours: 5,
        isActive: true
      };

      const response = await request(app)
        .post('/api/v1/subjects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(duplicateSubjectData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should update subject', async () => {
      const updateData = {
        description: 'Updated Mathematics Description',
        creditHours: 5
      };

      const response = await request(app)
        .put(`/api/v1/subjects/${createdSubjectId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.subject.description).toBe(updateData.description);
      expect(response.body.data.subject.creditHours).toBe(updateData.creditHours);
    });
  });

  describe('Teacher Management API Tests', () => {
    it('should create a teacher', async () => {
      const teacherData = {
        firstName: 'John',
        lastName: 'Smith',
        email: 'int-teacher@test.com',
        password: 'TeacherPass123!',
        employeeId: 'INT-EMP001',
        phone: '+1234567890',
        dateOfBirth: '1985-05-15',
        joiningDate: '2020-08-01',
        qualification: 'M.Sc. Mathematics',
        experienceYears: 5,
        address: '123 Teacher Lane'
      };

      const response = await request(app)
        .post('/api/v1/teachers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(teacherData)
        .expect(201);

      expect(response.body.success).toBe(true);

      createdTeacherId = response.body.data.id;           // teachers table UUID
      createdTeacherUserId = response.body.data.userId;   // users table UUID

      // Login to get teacher token
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'int-teacher@test.com', password: 'TeacherPass123!' })
        .expect(200);
      teacherToken = loginRes.body.data.token;
    });

    it('should get teachers list', async () => {
      const response = await request(app)
        .get('/api/v1/teachers')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.teachers).toBeTruthy();
      expect(Array.isArray(response.body.data.teachers)).toBe(true);
    });

    it('should get teacher by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/teachers/${createdTeacherId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.teacher.id).toBe(createdTeacherId);
    });

    it('should allow teacher to access own profile', async () => {
      const response = await request(app)
        .get(`/api/v1/teachers/${createdTeacherId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.teacher.id).toBe(createdTeacherId);
    });
  });

  describe('Class Management API Tests', () => {
    it('should create class', async () => {
      const classData = {
        name: 'Grade 5A',
        grade: '5',
        section: 'A',
        capacity: 30,
        teacherId: createdTeacherUserId,  // class uses the user's UUID, not teacher table UUID
        academicYearId: createdAcademicYearId,
        room: 'Room 101',
        description: 'Grade 5 Section A'
      };

      const response = await request(app)
        .post('/api/v1/classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(classData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.class.name).toBe(classData.name);
      expect(response.body.data.class.grade).toBe(classData.grade);
      expect(response.body.data.class.section).toBe(classData.section);
      
      createdClassId = response.body.data.class.id;
    });

    it('should get classes list', async () => {
      const response = await request(app)
        .get('/api/v1/classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.classes).toBeTruthy();
      expect(Array.isArray(response.body.data.classes)).toBe(true);
    });

    it('should filter classes by grade', async () => {
      const response = await request(app)
        .get('/api/v1/classes?grade=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.classes.every((c: any) => c.grade === '5')).toBe(true);
    });

    it('should assign subject to class', async () => {
      const assignmentData = {
        subjectId: createdSubjectId,
        teacherId: createdTeacherId
      };

      const response = await request(app)
        .post(`/api/v1/classes/${createdClassId}/subjects`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(assignmentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('assigned');
    });

    it('should get class subjects', async () => {
      const response = await request(app)
        .get(`/api/v1/classes/${createdClassId}/subjects`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.subjects).toBeTruthy();
      expect(Array.isArray(response.body.data.subjects)).toBe(true);
    });
  });

  describe('Student Management API Tests', () => {
    it('should create a student', async () => {
      const studentData = {
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'int-student@test.com',
        password: 'StudentPass123!',
        studentId: 'INT-STU001',
        classId: createdClassId,
        enrollmentDate: new Date().toISOString().split('T')[0],
        dateOfBirth: '2010-01-15',
        guardianName: 'Jane Johnson',
        guardianPhone: '+1234567890',
        guardianEmail: 'int-parent@test.com',
        emergencyContact: '+1234567891',
        address: '123 Student Street'
      };

      const response = await request(app)
        .post('/api/v1/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(studentData)
        .expect(201);

      expect(response.body.success).toBe(true);

      createdStudentId = response.body.data.id;  // students table UUID

      // Login to get student token
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'int-student@test.com', password: 'StudentPass123!' })
        .expect(200);
      studentToken = loginRes.body.data.token;
    });

    it('should get students list', async () => {
      const response = await request(app)
        .get('/api/v1/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.students).toBeTruthy();
      expect(Array.isArray(response.body.data.students)).toBe(true);
    });

    it('should allow teacher to see students', async () => {
      const response = await request(app)
        .get('/api/v1/students')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.students).toBeTruthy();
    });

    it('should not allow student to see all students', async () => {
      const response = await request(app)
        .get('/api/v1/students')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      // Message may be "Insufficient permissions" or similar
      expect(response.body.message).toBeTruthy();
    });

    it('should get student by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/students/${createdStudentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.student.id).toBe(createdStudentId);
    });

    it('should allow student to access own profile', async () => {
      const response = await request(app)
        .get(`/api/v1/students/${createdStudentId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.student.id).toBe(createdStudentId);
    });
  });

  describe('Attendance Management API Tests', () => {
    it('should mark attendance', async () => {
      const attendanceData = {
        studentId: createdStudentId,
        classId: createdClassId,
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        remarks: 'On time'
      };

      const response = await request(app)
        .post('/api/v1/attendance')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(attendanceData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.attendance.status).toBe('present');
    });

    it('should get attendance records', async () => {
      const response = await request(app)
        .get('/api/v1/attendance')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.attendance).toBeTruthy();
      expect(Array.isArray(response.body.data.attendance)).toBe(true);
    });

    it('should get student attendance', async () => {
      const response = await request(app)
        .get(`/api/v1/attendance/student/${createdStudentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.attendance).toBeTruthy();
    });

    it('should allow student to see own attendance', async () => {
      const response = await request(app)
        .get(`/api/v1/attendance/student/${createdStudentId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.attendance).toBeTruthy();
    });

    it('should get class attendance', async () => {
      const response = await request(app)
        .get(`/api/v1/attendance/class/${createdClassId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.attendance).toBeTruthy();
    });
  });

  describe('Fee Management API Tests', () => {
    let createdFeeCategoryId: string;
    let createdStudentFeeId: string;

    it('should create fee category', async () => {
      const feeCategoryData = {
        name: 'Tuition Fee',
        description: 'Monthly tuition fee',
        amount: 5000,
        frequency: 'monthly',
        isMandatory: true,
        academicYearId: createdAcademicYearId
      };

      const response = await request(app)
        .post('/api/v1/fees/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(feeCategoryData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.feeCategory.name).toBe(feeCategoryData.name);
      
      createdFeeCategoryId = response.body.data.feeCategory.id;
    });

    it('should get fee categories', async () => {
      const response = await request(app)
        .get('/api/v1/fees/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.feeCategories).toBeTruthy();
      expect(Array.isArray(response.body.data.feeCategories)).toBe(true);
    });

    it('should assign fee to student', async () => {
      const feeAssignmentData = {
        studentIds: [createdStudentId],
        feeCategoryId: createdFeeCategoryId,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now
      };

      const response = await request(app)
        .post('/api/v1/fees/assign-students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(feeAssignmentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('assigned');
    });

    it('should get student fees', async () => {
      const response = await request(app)
        .get(`/api/v1/fees/student/${createdStudentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.fees).toBeTruthy();
      expect(Array.isArray(response.body.data.fees)).toBe(true);
      
      if (response.body.data.fees.length > 0) {
        createdStudentFeeId = response.body.data.fees[0].id;
      }
    });

    it('should allow student to see own fees', async () => {
      const response = await request(app)
        .get(`/api/v1/fees/student/${createdStudentId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.fees).toBeTruthy();
    });

    it('should record payment', async () => {
      if (!createdStudentFeeId) {
        // Skip if no fee was created
        return;
      }

      const paymentData = {
        studentFeeId: createdStudentFeeId,
        amount: 2500, // Partial payment
        paymentMethod: 'cash',
        transactionId: 'TXN001',
        receiptNumber: 'RCP001'
      };

      const response = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(paymentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.payment.amount).toBe(paymentData.amount);
    });

    it('should get payments', async () => {
      const response = await request(app)
        .get('/api/v1/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.payments).toBeTruthy();
      expect(Array.isArray(response.body.data.payments)).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle missing Content-Type header', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send('email=test@test.com&password=password')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle very large request body', async () => {
      const largeData = {
        firstName: 'A'.repeat(10000), // Very long string
        lastName: 'User',
        email: 'large@test.com',
        password: 'Password123!',
        role: 'student'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(largeData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle concurrent requests', async () => {
      const requests = Array(5).fill(null).map(() =>
        request(app)
          .get('/health')
          .expect(200)
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle multiple simultaneous API calls', async () => {
      const startTime = Date.now();
      
      const requests = Array(10).fill(null).map(() =>
        request(app)
          .get('/api/v1/subjects')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
      );

      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // All requests should complete within reasonable time (5 seconds)
      expect(duration).toBeLessThan(5000);
      
      responses.forEach(response => {
        expect(response.body.success).toBe(true);
      });
    });

    it('should handle pagination efficiently', async () => {
      const response = await request(app)
        .get('/api/v1/users?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination).toBeTruthy();
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(5);
    });

    it('should respond quickly to health checks', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Health check should be very fast (under 100ms)
      expect(duration).toBeLessThan(100);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Security Testing', () => {
    it('should prevent SQL injection attempts', async () => {
      const maliciousData = {
        email: "admin@test.com'; DROP TABLE users; --",
        password: 'password'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(maliciousData)
        .expect(401);

      expect(response.body.success).toBe(false);
      // Should not crash the server
    });

    it('should prevent XSS attempts', async () => {
      const xssData = {
        firstName: '<script>alert("xss")</script>',
        lastName: 'User',
        email: 'xss@test.com',
        password: 'Password123!',
        role: 'student'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(xssData);

      // Should either reject the data or sanitize it
      if (response.status === 201) {
        expect(response.body.data.user.firstName).not.toContain('<script>');
      } else {
        expect(response.body.success).toBe(false);
      }
    });

    it('should enforce rate limiting (if implemented)', async () => {
      // This test would check if rate limiting is working
      // For now, we'll just ensure the server doesn't crash with many requests
      const requests = Array(20).fill(null).map(() =>
        request(app)
          .post('/api/v1/auth/login')
          .send({ email: 'nonexistent@test.com', password: 'wrongpassword' })
      );

      const responses = await Promise.all(requests);
      
      // All should return 401 (not crash the server)
      responses.forEach(response => {
        expect([401, 429]).toContain(response.status); // 429 if rate limited
      });
    });

    it('should validate authorization headers properly', async () => {
      const invalidHeaders = [
        'Bearer',
        'Bearer ',
        'InvalidFormat token',
        'Bearer invalid.token.format',
        ''
      ];

      for (const header of invalidHeaders) {
        const response = await request(app)
          .get('/api/v1/users')
          .set('Authorization', header);

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
      }
    });
  });

  afterAll(async () => {
    // Clean up test data if needed
    console.log('Integration tests completed');
  });
});