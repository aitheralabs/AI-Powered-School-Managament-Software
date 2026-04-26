// ─── Server URLs ──────────────────────────────────────────────────────────────
export const API_URL = 'http://localhost:3000/api/v1';
export const APP_URL = 'http://localhost:4200';

// ─── Test credentials (must exist in DB before running) ───────────────────────
// Run: npm run db:seed  to create the super admin
// Then manually create admin/teacher/student/parent via super-admin UI or API

export const CREDENTIALS = {
  superAdmin: {
    email: 'superadmin@system.com',
    password: 'SuperAdmin@123',
  },
  admin: {
    email: 'admin@testschool.com',
    password: 'Admin@123',
  },
  teacher: {
    email: 'teacher@testschool.com',
    password: 'Teacher@123',
  },
  student: {
    email: 'student@testschool.com',
    password: 'Student@123',
  },
  parent: {
    email: 'parent@testschool.com',
    password: 'Parent@123',
  },
};

// ─── Storage state files (auth tokens cached between tests) ───────────────────
export const STATE = {
  superAdmin: 'e2e/.auth/superadmin.json',
  admin:      'e2e/.auth/admin.json',
  teacher:    'e2e/.auth/teacher.json',
  student:    'e2e/.auth/student.json',
  parent:     'e2e/.auth/parent.json',
};
