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

// Global test timeout — must match or exceed the CLI --testTimeout (30s)
jest.setTimeout(30000);

// Create test school and clean up test data
// Use beforeAll so Jest waits for DB setup to complete before any test runs
beforeAll(async () => {
  try {
    const { pool } = await import("../database/connection");
    const testSchoolId = "00000000-0000-0000-0000-000000000001";

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
      "testadmin@example.com",
      "admin@basictest.com",
      "xss@test.com",
      "int-admin@test.com",
      "int-teacher@test.com",
      "int-student@test.com",
    ];

    // Use advisory lock so only the first worker performs cleanup;
    // other workers wait for the lock, then skip (data already clean).
    const LOCK_ID = 123456789; // arbitrary constant for pg_advisory_lock
    const client = await pool.connect();
    try {
      // Acquire session-level advisory lock (blocks until available)
      await client.query("SELECT pg_advisory_lock($1)", [LOCK_ID]);

      // Check if cleanup was already done by another worker (idempotent flag)
      const flagCheck = await client.query(
        "SELECT 1 FROM schools WHERE id = $1 AND slug = 'test'",
        [testSchoolId],
      );
      const schoolExists = flagCheck.rowCount && flagCheck.rowCount > 0;

      await client.query("BEGIN");

      // Create test school if not exists
      await client.query(
        `INSERT INTO schools (
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
          subscription_status = EXCLUDED.subscription_status`,
        [testSchoolId],
      );

      // Clean up all test data in FK-safe order using a single transaction.
      // Each DELETE is wrapped in a savepoint so missing tables don't abort the txn.
      const cleanupQueries = [
        // Timetable / exams
        { sql: "DELETE FROM timetable_slots WHERE school_id = $1", params: [testSchoolId] },
        { sql: "DELETE FROM exam_schedules WHERE school_id = $1", params: [testSchoolId] },
        { sql: "DELETE FROM exam_results WHERE school_id = $1", params: [testSchoolId] },
        { sql: "DELETE FROM exams WHERE school_id = $1", params: [testSchoolId] },
        // Report cards and grades
        { sql: "DELETE FROM report_card_items WHERE school_id = $1", params: [testSchoolId] },
        { sql: "DELETE FROM report_cards WHERE school_id = $1", params: [testSchoolId] },
        { sql: "DELETE FROM grades WHERE school_id = $1", params: [testSchoolId] },
        // Fees and payments
        { sql: "DELETE FROM student_fees WHERE school_id = $1", params: [testSchoolId] },
        { sql: "DELETE FROM payments WHERE school_id = $1", params: [testSchoolId] },
        { sql: "DELETE FROM fee_structures WHERE school_id = $1", params: [testSchoolId] },
        { sql: "DELETE FROM fee_categories WHERE school_id = $1", params: [testSchoolId] },
        // Attendance
        { sql: "DELETE FROM attendance WHERE school_id = $1", params: [testSchoolId] },
        // Junctions / history
        { sql: "DELETE FROM class_subjects WHERE class_id IN (SELECT id FROM classes WHERE school_id = $1)", params: [testSchoolId] },
        { sql: "DELETE FROM student_classes WHERE school_id = $1", params: [testSchoolId] },
        { sql: "DELETE FROM teacher_subjects WHERE school_id = $1", params: [testSchoolId] },
        { sql: "DELETE FROM student_class_history WHERE class_id IN (SELECT id FROM classes WHERE school_id = $1)", params: [testSchoolId] },
        // Entities (students before classes due to FK)
        { sql: "DELETE FROM students WHERE school_id = $1", params: [testSchoolId] },
        { sql: "DELETE FROM parents WHERE school_id = $1", params: [testSchoolId] },
        { sql: "DELETE FROM teachers WHERE school_id = $1", params: [testSchoolId] },
        { sql: "DELETE FROM staff WHERE school_id = $1", params: [testSchoolId] },
        { sql: "DELETE FROM classes WHERE school_id = $1", params: [testSchoolId] },
        { sql: "DELETE FROM subjects WHERE school_id = $1 OR school_id IS NULL", params: [testSchoolId] },
        // Academic structure
        { sql: "DELETE FROM semesters WHERE school_id = $1", params: [testSchoolId] },
        { sql: "DELETE FROM academic_years WHERE school_id = $1", params: [testSchoolId] },
        // Rate limits
        { sql: "DELETE FROM rate_limit_entries", params: [] },
        // Test users
        { sql: "DELETE FROM users WHERE email = ANY($1)", params: [emails] },
      ];

      for (let i = 0; i < cleanupQueries.length; i++) {
        const { sql, params } = cleanupQueries[i];
        try {
          await client.query(`SAVEPOINT sp_${i}`);
          await client.query(sql, params);
          await client.query(`RELEASE SAVEPOINT sp_${i}`);
        } catch {
          await client.query(`ROLLBACK TO SAVEPOINT sp_${i}`);
        }
      }

      await client.query("COMMIT");

      // Release advisory lock so other workers can proceed
      await client.query("SELECT pg_advisory_unlock($1)", [LOCK_ID]);
    } catch (err) {
      await client.query("ROLLBACK").catch(() => {});
      await client.query("SELECT pg_advisory_unlock($1)", [LOCK_ID]).catch(() => {});
      throw err;
    } finally {
      client.release();
    }

    console.log("Test setup: Test school created and test data cleaned");
  } catch (err) {
    console.log("Test setup warning:", err);
  }
}, 60000); // 60s timeout for DB setup
