/**
 * Seed: creates demo data for a new developer to explore the app.
 * Run: npm run db:seed:demo
 *
 * Creates:
 *   - 1 demo school (Delhi Public School)
 *   - 1 admin user
 *   - 1 academic year (2025-26)
 *   - 5 subjects
 *   - 3 teachers (with user accounts)
 *   - 3 classes (grades 1-3)
 *   - 9 students (3 per class, with user accounts)
 *   - class-subject assignments
 *
 * Safe to run multiple times — uses ON CONFLICT DO NOTHING.
 * All passwords are "Demo@12345678" (bcrypt hashed).
 *
 * WARNING: This is for DEVELOPMENT only. Never run in production.
 */
import * as dotenv from 'dotenv';
dotenv.config();

import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';

const env = process.env.NODE_ENV || 'development';

if (env === 'production') {
  console.error('❌ Demo seed must NOT be run in production.');
  process.exit(1);
}

if (!process.env.DB_PASSWORD) {
  console.error('❌ DB_PASSWORD environment variable is required.');
  process.exit(1);
}

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME     || 'school_management',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD,
});

// All demo accounts use this password
const DEMO_PASSWORD = 'Demo@12345678';

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

    // ── 1. School ────────────────────────────────────────────────────────
    const schoolRes = await client.query(`
      INSERT INTO schools (name, slug, email, phone, address, city, state, country, postal_code, plan, subscription_status, max_students, max_teachers, max_staff, feature_messaging, is_active, onboarded_at)
      VALUES ('Delhi Public School - Demo', 'dps-demo', 'admin@dps-demo.edu', '9876543210', '123 Education Lane', 'New Delhi', 'Delhi', 'India', '110001', 'standard', 'active', 500, 50, 20, true, true, NOW())
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `);
    const schoolId = schoolRes.rows[0].id;
    console.log(`✅ School created: ${schoolId}`);

    // ── 2. Admin user ────────────────────────────────────────────────────
    const adminRes = await client.query(`
      INSERT INTO users (first_name, last_name, email, password_hash, role, phone, is_active, school_id, email_verified)
      VALUES ('Admin', 'Demo', 'admin@dps-demo.edu', $1, 'admin', '9876543210', true, $2, true)
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
      RETURNING id
    `, [passwordHash, schoolId]);
    console.log(`✅ Admin user created: admin@dps-demo.edu`);

    // ── 3. Academic year ─────────────────────────────────────────────────
    const ayRes = await client.query(`
      INSERT INTO academic_years (name, start_date, end_date, is_active, school_id)
      VALUES ('2025-26', '2025-04-01', '2026-03-31', true, $1)
      ON CONFLICT (name) DO UPDATE SET is_active = true
      RETURNING id
    `, [schoolId]);
    const academicYearId = ayRes.rows[0].id;
    console.log(`✅ Academic year: 2025-26`);

    // ── 4. Subjects ──────────────────────────────────────────────────────
    const subjectData = [
      { name: 'Mathematics',  code: 'MATH', credits: 5 },
      { name: 'English',      code: 'ENG',  credits: 4 },
      { name: 'Science',      code: 'SCI',  credits: 5 },
      { name: 'Hindi',        code: 'HIN',  credits: 4 },
      { name: 'Social Studies', code: 'SST', credits: 3 },
    ];

    const subjectIds: Record<string, string> = {};
    for (const s of subjectData) {
      const res = await client.query(`
        INSERT INTO subjects (name, code, credit_hours, is_active, school_id)
        VALUES ($1, $2, $3, true, $4)
        ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
        RETURNING id
      `, [s.name, s.code, s.credits, schoolId]);
      subjectIds[s.code] = res.rows[0].id;
    }
    console.log(`✅ ${subjectData.length} subjects created`);

    // ── 5. Teachers ──────────────────────────────────────────────────────
    const teacherData = [
      { first: 'Rajesh',  last: 'Sharma',   email: 'rajesh.sharma@dps-demo.edu',  empId: 'TCH-001', qual: 'M.Sc Mathematics', exp: 10, spec: 'Mathematics' },
      { first: 'Priya',   last: 'Verma',    email: 'priya.verma@dps-demo.edu',    empId: 'TCH-002', qual: 'M.A English',      exp: 8,  spec: 'English' },
      { first: 'Amit',    last: 'Patel',    email: 'amit.patel@dps-demo.edu',     empId: 'TCH-003', qual: 'M.Sc Physics',     exp: 12, spec: 'Science' },
    ];

    const teacherUserIds: string[] = [];
    const teacherIds: string[] = [];

    for (const t of teacherData) {
      const userRes = await client.query(`
        INSERT INTO users (first_name, last_name, email, password_hash, role, is_active, school_id, email_verified)
        VALUES ($1, $2, $3, $4, 'teacher', true, $5, true)
        ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
        RETURNING id
      `, [t.first, t.last, t.email, passwordHash, schoolId]);
      const userId = userRes.rows[0].id;
      teacherUserIds.push(userId);

      const tRes = await client.query(`
        INSERT INTO teachers (user_id, employee_id, qualification, experience_years, specialization, joining_date, salary, is_active, school_id)
        VALUES ($1, $2, $3, $4, $5, '2024-04-01', 50000, true, $6)
        ON CONFLICT (employee_id) DO UPDATE SET user_id = EXCLUDED.user_id
        RETURNING id
      `, [userId, t.empId, t.qual, t.exp, t.spec, schoolId]);
      teacherIds.push(tRes.rows[0].id);
    }
    console.log(`✅ ${teacherData.length} teachers created`);

    // ── 6. Classes ───────────────────────────────────────────────────────
    const classData = [
      { name: 'Class 1-A', grade: '1', section: 'A', teacherIdx: 0, room: 'R-101' },
      { name: 'Class 2-A', grade: '2', section: 'A', teacherIdx: 1, room: 'R-201' },
      { name: 'Class 3-A', grade: '3', section: 'A', teacherIdx: 2, room: 'R-301' },
    ];

    const classIds: string[] = [];
    for (const c of classData) {
      const res = await client.query(`
        INSERT INTO classes (name, grade, section, teacher_id, capacity, room, is_active, academic_year_id, school_id)
        VALUES ($1, $2, $3, $4, 40, $5, true, $6, $7)
        ON CONFLICT (grade, section, academic_year_id) DO UPDATE SET name = EXCLUDED.name
        RETURNING id
      `, [c.name, c.grade, c.section, teacherUserIds[c.teacherIdx], c.room, academicYearId, schoolId]);
      classIds.push(res.rows[0].id);
    }
    console.log(`✅ ${classData.length} classes created`);

    // ── 7. Class-subject assignments ─────────────────────────────────────
    // Assign all subjects to all classes, rotating teachers
    const subjectCodes = Object.keys(subjectIds);
    for (let ci = 0; ci < classIds.length; ci++) {
      for (let si = 0; si < subjectCodes.length; si++) {
        const teacherIdx = si % teacherUserIds.length;
        await client.query(`
          INSERT INTO class_subjects (class_id, subject_id, teacher_id)
          VALUES ($1, $2, $3)
          ON CONFLICT (class_id, subject_id) DO NOTHING
        `, [classIds[ci], subjectIds[subjectCodes[si]], teacherUserIds[teacherIdx]]);
      }
    }
    console.log(`✅ Class-subject assignments created`);

    // ── 8. Students ──────────────────────────────────────────────────────
    const studentData = [
      // Class 1
      { first: 'Aarav',    last: 'Kumar',    email: 'aarav.kumar@dps-demo.edu',    sid: 'STU-001', classIdx: 0, guardian: 'Suresh Kumar',  gPhone: '9111111001' },
      { first: 'Diya',     last: 'Singh',    email: 'diya.singh@dps-demo.edu',     sid: 'STU-002', classIdx: 0, guardian: 'Ramesh Singh',  gPhone: '9111111002' },
      { first: 'Vihaan',   last: 'Gupta',    email: 'vihaan.gupta@dps-demo.edu',   sid: 'STU-003', classIdx: 0, guardian: 'Anil Gupta',    gPhone: '9111111003' },
      // Class 2
      { first: 'Ananya',   last: 'Reddy',    email: 'ananya.reddy@dps-demo.edu',   sid: 'STU-004', classIdx: 1, guardian: 'Venkat Reddy',  gPhone: '9111111004' },
      { first: 'Arjun',    last: 'Joshi',    email: 'arjun.joshi@dps-demo.edu',    sid: 'STU-005', classIdx: 1, guardian: 'Deepak Joshi',  gPhone: '9111111005' },
      { first: 'Ishaan',   last: 'Mehta',    email: 'ishaan.mehta@dps-demo.edu',   sid: 'STU-006', classIdx: 1, guardian: 'Sanjay Mehta',  gPhone: '9111111006' },
      // Class 3
      { first: 'Kavya',    last: 'Nair',     email: 'kavya.nair@dps-demo.edu',     sid: 'STU-007', classIdx: 2, guardian: 'Rajiv Nair',    gPhone: '9111111007' },
      { first: 'Rohan',    last: 'Desai',    email: 'rohan.desai@dps-demo.edu',    sid: 'STU-008', classIdx: 2, guardian: 'Manoj Desai',   gPhone: '9111111008' },
      { first: 'Saanvi',   last: 'Iyer',     email: 'saanvi.iyer@dps-demo.edu',    sid: 'STU-009', classIdx: 2, guardian: 'Karthik Iyer',  gPhone: '9111111009' },
    ];

    for (const s of studentData) {
      const userRes = await client.query(`
        INSERT INTO users (first_name, last_name, email, password_hash, role, is_active, school_id, email_verified)
        VALUES ($1, $2, $3, $4, 'student', true, $5, true)
        ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
        RETURNING id
      `, [s.first, s.last, s.email, passwordHash, schoolId]);

      await client.query(`
        INSERT INTO students (user_id, student_id, class_id, enrollment_date, guardian_name, guardian_phone, guardian_email, emergency_contact, is_active, school_id)
        VALUES ($1, $2, $3, '2025-04-01', $4, $5, $6, $5, true, $7)
        ON CONFLICT (student_id) DO NOTHING
      `, [userRes.rows[0].id, s.sid, classIds[s.classIdx], s.guardian, s.gPhone, s.email, schoolId]);
    }
    console.log(`✅ ${studentData.length} students created`);

    await client.query('COMMIT');

    console.log('\n========================================');
    console.log('  Demo data seeded successfully!');
    console.log('========================================');
    console.log('\n  Demo Login Credentials:');
    console.log('  ─────────────────────────────────');
    console.log(`  Admin:   admin@dps-demo.edu / ${DEMO_PASSWORD}`);
    console.log(`  Teacher: rajesh.sharma@dps-demo.edu / ${DEMO_PASSWORD}`);
    console.log(`  Teacher: priya.verma@dps-demo.edu / ${DEMO_PASSWORD}`);
    console.log(`  Teacher: amit.patel@dps-demo.edu / ${DEMO_PASSWORD}`);
    console.log(`  Student: aarav.kumar@dps-demo.edu / ${DEMO_PASSWORD}`);
    console.log('  (... and 8 more students)');
    console.log(`\n  All accounts use password: ${DEMO_PASSWORD}`);
    console.log(`  School: Delhi Public School - Demo`);
    console.log(`  Academic Year: 2025-26\n`);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Demo seed failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
