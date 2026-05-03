"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
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
globals_1.jest.setTimeout(10000);
beforeAll(async () => {
    try {
        const { query, closePool } = await Promise.resolve().then(() => __importStar(require("../database/connection")));
        const testSchoolId = "00000000-0000-0000-0000-000000000001";
        await query(`
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
    `, [testSchoolId]);
        await query("DELETE FROM timetable_slots WHERE school_id = $1", [testSchoolId]).catch(() => { });
        await query("DELETE FROM exam_schedules WHERE school_id = $1", [testSchoolId]).catch(() => { });
        await query("DELETE FROM exam_results WHERE school_id = $1", [testSchoolId]).catch(() => { });
        await query("DELETE FROM exams WHERE school_id = $1", [testSchoolId]).catch(() => { });
        await query("DELETE FROM report_card_items WHERE school_id = $1", [testSchoolId]).catch(() => { });
        await query("DELETE FROM report_cards WHERE school_id = $1", [testSchoolId]).catch(() => { });
        await query("DELETE FROM grades WHERE school_id = $1", [testSchoolId]).catch(() => { });
        await query("DELETE FROM student_fees WHERE school_id = $1", [testSchoolId]).catch(() => { });
        await query("DELETE FROM payments WHERE school_id = $1", [testSchoolId]).catch(() => { });
        await query("DELETE FROM fee_structures WHERE school_id = $1", [testSchoolId]).catch(() => { });
        await query("DELETE FROM fee_categories WHERE school_id = $1", [testSchoolId]).catch(() => { });
        await query("DELETE FROM attendance WHERE school_id = $1", [testSchoolId]).catch(() => { });
        await query("DELETE FROM class_subjects WHERE class_id IN (SELECT id FROM classes WHERE school_id = $1)", [testSchoolId]).catch(() => { });
        await query("DELETE FROM student_classes WHERE school_id = $1", [testSchoolId]).catch(() => { });
        await query("DELETE FROM teacher_subjects WHERE school_id = $1", [testSchoolId]).catch(() => { });
        await query("DELETE FROM student_class_history WHERE class_id IN (SELECT id FROM classes WHERE school_id = $1)", [testSchoolId]).catch(() => { });
        await query("DELETE FROM students WHERE school_id = $1", [testSchoolId]).catch(() => { });
        await query("DELETE FROM parents WHERE school_id = $1", [testSchoolId]).catch(() => { });
        await query("DELETE FROM teachers WHERE school_id = $1", [testSchoolId]).catch(() => { });
        await query("DELETE FROM staff WHERE school_id = $1", [testSchoolId]).catch(() => { });
        await query("DELETE FROM classes WHERE school_id = $1", [testSchoolId]).catch(() => { });
        await query("DELETE FROM subjects WHERE school_id = $1 OR school_id IS NULL", [testSchoolId]).catch(() => { });
        await query("DELETE FROM semesters WHERE school_id = $1", [testSchoolId]).catch(() => { });
        await query("DELETE FROM academic_years WHERE school_id = $1", [testSchoolId]).catch(() => { });
        await query("DELETE FROM rate_limit_entries").catch(() => { });
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
        await query("DELETE FROM users WHERE email = ANY($1)", [emails]);
        console.log("🧪 Test setup: Test school created and test data cleaned");
    }
    catch (err) {
        console.log("Test setup warning:", err);
    }
}, 30000);
//# sourceMappingURL=setup.js.map