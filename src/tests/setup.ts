// Jest setup file for global test configuration
import { jest } from "@jest/globals";

// IMPORTANT: Set environment variables BEFORE importing any modules
// This ensures the environment configuration uses the test values
process.env.NODE_ENV = "test";
process.env.JWT_SECRET =
  "your_super_secret_jwt_key_change_this_in_production_environment_32_chars_minimum";
process.env.DB_HOST = "localhost";
process.env.DB_PORT = "5432";
process.env.DB_NAME = "SMS";
process.env.DB_USER = "postgres";
process.env.DB_PASSWORD = "Kishan8051";
process.env.JWT_EXPIRES_IN = "7d";
process.env.CORS_ORIGIN = "http://localhost:3000";
process.env.RATE_LIMIT_WINDOW_MS = "900000";
process.env.RATE_LIMIT_MAX_REQUESTS = "100";

// Global test timeout
jest.setTimeout(10000);

// Create test school and clean up test data
// Use beforeAll so Jest waits for DB setup to complete before any test runs
beforeAll(async () => {
  try {
    const { query, closePool } = await import("../database/connection");
    const testSchoolId = "00000000-0000-0000-0000-000000000001";

    // Create test school if not exists
    await query(
      `
      INSERT INTO schools (
        id, name, slug, email, plan, subscription_status, is_active,
        max_students, max_teachers, max_staff,
        feature_ai_insights, feature_library, feature_transport,
        feature_hostel, feature_messaging, feature_api_access
      )
      VALUES ($1, 'Test School', 'test', 'testschool@test.local',
        'premium', 'active', true,
        1000, 100, 100, true, true, true, true, true, true)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        is_active = EXCLUDED.is_active,
        plan = EXCLUDED.plan,
        subscription_status = EXCLUDED.subscription_status
    `,
      [testSchoolId],
    );

    // Clean up test data by school_id (order matters: delete dependent tables first)
    // Timetable / exams
    await query("DELETE FROM timetable_slots WHERE school_id = $1", [testSchoolId]).catch(() => {});
    await query("DELETE FROM exam_schedules WHERE school_id = $1", [testSchoolId]).catch(() => {});
    await query("DELETE FROM exam_results WHERE school_id = $1", [testSchoolId]).catch(() => {});
    await query("DELETE FROM exams WHERE school_id = $1", [testSchoolId]).catch(() => {});
    // Report cards and grades
    await query("DELETE FROM report_card_items WHERE school_id = $1", [testSchoolId]).catch(() => {});
    await query("DELETE FROM report_cards WHERE school_id = $1", [testSchoolId]).catch(() => {});
    await query("DELETE FROM grades WHERE school_id = $1", [testSchoolId]).catch(() => {});
    // Fees and payments
    await query("DELETE FROM student_fees WHERE school_id = $1", [testSchoolId]).catch(() => {});
    await query("DELETE FROM payments WHERE school_id = $1", [testSchoolId]).catch(() => {});
    await query("DELETE FROM fee_structures WHERE school_id = $1", [testSchoolId]).catch(() => {});
    await query("DELETE FROM fee_categories WHERE school_id = $1", [testSchoolId]).catch(() => {});
    // Attendance (must come before students/classes due to FKs)
    await query("DELETE FROM attendance WHERE school_id = $1", [testSchoolId]).catch(() => {});
    // Student-class junction / history (before classes and students)
    await query("DELETE FROM class_subjects WHERE class_id IN (SELECT id FROM classes WHERE school_id = $1)", [testSchoolId]).catch(() => {});
    await query("DELETE FROM student_classes WHERE school_id = $1", [testSchoolId]).catch(() => {}); // table may not exist
    await query("DELETE FROM teacher_subjects WHERE school_id = $1", [testSchoolId]).catch(() => {});
    await query("DELETE FROM student_class_history WHERE class_id IN (SELECT id FROM classes WHERE school_id = $1)", [testSchoolId]).catch(() => {});
    // Students must be deleted BEFORE classes (students.class_id FK ON DELETE RESTRICT)
    await query("DELETE FROM students WHERE school_id = $1", [testSchoolId]).catch(() => {});
    await query("DELETE FROM parents WHERE school_id = $1", [testSchoolId]).catch(() => {});
    await query("DELETE FROM teachers WHERE school_id = $1", [testSchoolId]).catch(() => {});
    await query("DELETE FROM staff WHERE school_id = $1", [testSchoolId]).catch(() => {});
    // Classes and subjects (after students and teachers — classes.teacher_id FK -> users.id)
    await query("DELETE FROM classes WHERE school_id = $1", [testSchoolId]).catch(() => {});
    await query("DELETE FROM subjects WHERE school_id = $1 OR school_id IS NULL", [testSchoolId]).catch(() => {});
    // Academic structure (after classes)
    await query("DELETE FROM semesters WHERE school_id = $1", [testSchoolId]).catch(() => {});
    await query("DELETE FROM academic_years WHERE school_id = $1", [testSchoolId]).catch(() => {});

    // Clear rate limit entries so no suite is blocked by a previous suite's requests
    await query("DELETE FROM rate_limit_entries").catch(() => {});

    // Clean up test users by email AFTER school data is removed (FK: classes.teacher_id -> users.id)
    const emails = [
      "newuser@test.com",
      "admincreated@test.com",
      "teacherattempt@test.com",
      "studentattempt@test.com",
      "inactive@test.com",
      "admin@test.com",
      "teacher@test.com",
      "student@test.com",
      "parent@test.com",
      "staff@test.com",
      "basicnewuser@test.com",
      // api.basic.test.ts emails
      "testadmin@example.com",
      "admin@basictest.com",
      "xss@test.com",
      // api.integration.test.ts unique emails
      "int-admin@test.com",
      "int-teacher@test.com",
      "int-student@test.com",
    ];
    await query("DELETE FROM users WHERE email = ANY($1)", [emails]);

    console.log("🧪 Test setup: Test school created and test data cleaned");
    // Optional: do not close the pool here; tests will use it
  } catch (err) {
    console.log("Test setup warning:", err);
  }
}, 30000); // 30s timeout for DB setup
