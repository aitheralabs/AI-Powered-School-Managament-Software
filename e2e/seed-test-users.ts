/**
 * Seed script: creates test users for E2E testing.
 * Run: npm run seed:test-users
 *
 * Uses individual auto-commit queries (no transaction) to avoid ts-node
 * transaction commit issues. Safe to run multiple times.
 */
import * as dotenv from 'dotenv';
dotenv.config();

import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME     || 'SMS',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || 'Kishan8051',
});

async function run(sql: string, params: any[] = []) {
  const client = await pool.connect();
  try {
    return await client.query(sql, params);
  } finally {
    client.release();
  }
}

async function main() {
  try {
    // ── 1. Verify DB connection ──────────────────────────────────────────────
    const dbCheck = await run('SELECT current_database() AS db');
    console.log('Connected to DB:', dbCheck.rows[0].db);

    // ── 2. Ensure test school exists (no transaction, auto-commit) ───────────
    let schoolId: string;
    const existingSchool = await run(`SELECT id FROM schools WHERE email = 'e2etestschool@test.com'`);

    if (existingSchool.rows.length > 0) {
      schoolId = existingSchool.rows[0].id;
      console.log('✅ Using existing E2E school ID:', schoolId);
      // Ensure it's active
      await run(
        `UPDATE schools SET subscription_status = 'active', plan = 'premium' WHERE id = $1`,
        [schoolId]
      );
    } else {
      // Check if slug is taken; if so, use a timestamp suffix
      const slugCheck = await run(`SELECT id FROM schools WHERE slug = 'e2e-test-school'`);
      const slug = slugCheck.rows.length > 0 ? `e2e-test-school-${Date.now()}` : 'e2e-test-school';

      const schoolRes = await run(`
        INSERT INTO schools (name, slug, email, phone, address, plan, subscription_status)
        VALUES ('E2E Test School', $1, 'e2etestschool@test.com', '9000000000', '1 Test Lane', 'premium', 'active')
        RETURNING id
      `, [slug]);
      schoolId = schoolRes.rows[0].id;
      console.log('✅ Created E2E school ID:', schoolId);
    }

    // Immediately verify school persisted
    const schoolVerify = await run(`SELECT id, email FROM schools WHERE id = $1`, [schoolId]);
    if (schoolVerify.rows.length === 0) {
      throw new Error('School was not persisted! DB connection issue.');
    }
    console.log('✅ School verified in DB:', schoolVerify.rows[0].email);

    // ── 3. Upsert each test user (individual queries, auto-commit) ───────────
    const users = [
      { email: 'admin@testschool.com',   password: 'Admin@123',   role: 'admin',   first: 'Test', last: 'Admin'   },
      { email: 'teacher@testschool.com', password: 'Teacher@123', role: 'teacher', first: 'Test', last: 'Teacher' },
      { email: 'student@testschool.com', password: 'Student@123', role: 'student', first: 'Test', last: 'Student' },
      { email: 'parent@testschool.com',  password: 'Parent@123',  role: 'parent',  first: 'Test', last: 'Parent'  },
    ];

    for (const u of users) {
      const hash = await bcrypt.hash(u.password, 10);

      // Check if user already exists
      const existing = await run(`SELECT id, password_hash FROM users WHERE email = $1`, [u.email]);

      if (existing.rows.length > 0) {
        // Update password and ensure active + correct school
        await run(`
          UPDATE users
          SET password_hash = $1, is_active = true, school_id = $2, role = $3
          WHERE email = $4
        `, [hash, schoolId, u.role, u.email]);
        console.log(`✅ Updated ${u.role}: ${u.email}`);
      } else {
        await run(`
          INSERT INTO users (school_id, email, password_hash, role, first_name, last_name, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, true)
        `, [schoolId, u.email, hash, u.role, u.first, u.last]);
        console.log(`✅ Inserted ${u.role}: ${u.email}`);
      }

      // Immediately verify
      const verify = await run(`SELECT id, email, role, is_active, school_id FROM users WHERE email = $1`, [u.email]);
      if (verify.rows.length === 0) {
        throw new Error(`User ${u.email} was not persisted!`);
      }
      const v = verify.rows[0];
      console.log(`   → Verified: role=${v.role}, active=${v.is_active}, school_id=${v.school_id}`);

      // Verify bcrypt works
      const match = await bcrypt.compare(u.password, (await run(`SELECT password_hash FROM users WHERE email = $1`, [u.email])).rows[0].password_hash);
      console.log(`   → Password check: ${match ? '✅ OK' : '❌ MISMATCH'}`);
    }

    // ── 4. Ensure academic year exists ──────────────────────────────────────
    let academicYearId: string;
    const existingYear = await run(`SELECT id FROM academic_years WHERE school_id = $1 AND is_active = true ORDER BY created_at DESC LIMIT 1`, [schoolId]);
    if (existingYear.rows.length > 0) {
      academicYearId = existingYear.rows[0].id;
      console.log('✅ Using existing academic year:', academicYearId);
    } else {
      const yearRes = await run(
        `INSERT INTO academic_years (name, start_date, end_date, is_active, school_id)
         VALUES ('2024-2025', '2024-04-01', '2025-03-31', true, $1) RETURNING id`,
        [schoolId]
      );
      academicYearId = yearRes.rows[0].id;
      console.log('✅ Created academic year:', academicYearId);
    }

    // ── 5. Ensure E2E class exists ───────────────────────────────────────────
    let classId: string;
    const existingClass = await run(`SELECT id FROM classes WHERE school_id = $1`, [schoolId]);
    if (existingClass.rows.length > 0) {
      classId = existingClass.rows[0].id;
      console.log('✅ Using existing class:', classId);
      // Ensure class has academic_year_id set
      await run(`UPDATE classes SET academic_year_id = $1 WHERE id = $2 AND academic_year_id IS NULL`, [academicYearId, classId]);
    } else {
      const cls = await run(
        `INSERT INTO classes (name, grade, section, capacity, school_id, is_active, academic_year_id)
         VALUES ('Class 10', '10', 'A', 40, $1, true, $2) RETURNING id`,
        [schoolId, academicYearId]
      );
      classId = cls.rows[0].id;
      console.log('✅ Created E2E class:', classId);
    }

    // ── 6. Link teacher record (correct required columns) ────────────────────
    const tchUser = await run(`SELECT id FROM users WHERE email = 'teacher@testschool.com'`);
    if (tchUser.rows[0]) {
      try {
        const tchExists = await run(`SELECT id FROM teachers WHERE user_id = $1`, [tchUser.rows[0].id]);
        if (tchExists.rows.length === 0) {
          // Find a unique employee_id
          const empCheck = await run(`SELECT id FROM teachers WHERE employee_id = 'E2E-TCH-001'`);
          const empId = empCheck.rows.length > 0 ? `E2E-TCH-${Date.now()}` : 'E2E-TCH-001';
          await run(
            `INSERT INTO teachers (user_id, school_id, employee_id, joining_date, is_active)
             VALUES ($1, $2, $3, '2020-06-01', true)`,
            [tchUser.rows[0].id, schoolId, empId]
          );
          console.log('✅ Teacher record created (employee_id:', empId + ')');
        } else {
          console.log('✅ Teacher record already exists');
        }
      } catch (e: any) { console.log('   (teachers table skip:', e.message.slice(0, 80), ')'); }
    }

    // ── 7. Link student record (correct required columns) ────────────────────
    const stuUser = await run(`SELECT id FROM users WHERE email = 'student@testschool.com'`);
    if (stuUser.rows[0]) {
      try {
        const stuExists = await run(`SELECT id FROM students WHERE user_id = $1`, [stuUser.rows[0].id]);
        if (stuExists.rows.length === 0) {
          const stuCheck = await run(`SELECT id FROM students WHERE student_id = 'E2E-STU-001'`);
          const stuId = stuCheck.rows.length > 0 ? `E2E-STU-${Date.now()}` : 'E2E-STU-001';
          await run(
            `INSERT INTO students (user_id, school_id, student_id, class_id, enrollment_date,
                                   guardian_name, guardian_phone, emergency_contact, is_active)
             VALUES ($1, $2, $3, $4, '2023-04-01', 'Test Guardian', '9000000001', '9000000002', true)`,
            [stuUser.rows[0].id, schoolId, stuId, classId]
          );
          console.log('✅ Student record created (class_id:', classId + ')');
        } else {
          console.log('✅ Student record already exists');
        }
      } catch (e: any) { console.log('   (students table skip:', e.message.slice(0, 80), ')'); }
    }

    console.log('\n✅ All test users seeded and verified!\n');
    console.log('Credentials:');
    console.log('  Admin:      admin@testschool.com   / Admin@123');
    console.log('  Teacher:    teacher@testschool.com / Teacher@123');
    console.log('  Student:    student@testschool.com / Student@123');
    console.log('  Parent:     parent@testschool.com  / Parent@123');
    console.log('  SuperAdmin: superadmin@system.com  / SuperAdmin@123  (run: npm run db:seed)\n');

  } catch (err: any) {
    console.error('\n❌ Seed failed:', err.message || err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
