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
exports.StudentService = void 0;
const baseService_1 = require("./baseService");
const errorHandler_1 = require("../middleware/errorHandler");
const pagination_1 = require("../utils/pagination");
const auth_1 = require("../utils/auth");
const cacheService_1 = __importStar(require("./cacheService"));
const schoolService_1 = require("./schoolService");
const schoolService = new schoolService_1.SchoolService();
class StudentService extends baseService_1.BaseService {
    async createStudent(studentData) {
        const schoolId = this.requireSchool();
        await schoolService.checkLimit(schoolId, 'student');
        const result = await this.executeTransaction(async (client) => {
            const existingUser = await client.query('SELECT id FROM users WHERE email = $1 AND school_id = $2', [studentData.email, schoolId]);
            if (existingUser.rows.length > 0) {
                throw new errorHandler_1.AppError('A user with this email already exists in this school', 409);
            }
            const existingStudentId = await client.query('SELECT id FROM students WHERE student_id = $1 AND school_id = $2', [studentData.studentId, schoolId]);
            if (existingStudentId.rows.length > 0) {
                throw new errorHandler_1.AppError('A student with this ID already exists', 409);
            }
            const classResult = await client.query('SELECT id, capacity, current_enrollment FROM classes WHERE id = $1 AND school_id = $2 AND is_active = true', [studentData.classId, schoolId]);
            if (classResult.rows.length === 0) {
                throw new errorHandler_1.AppError('Class not found or inactive', 404);
            }
            const classInfo = classResult.rows[0];
            if (classInfo.current_enrollment >= classInfo.capacity) {
                throw new errorHandler_1.AppError('Class is at full capacity', 409);
            }
            const password = studentData.password || this.generateDefaultPassword(studentData.studentId);
            const passwordHash = await (0, auth_1.hashPassword)(password);
            const userSequentialId = await this.generateSequentialId('users');
            const userResult = await client.query(`INSERT INTO users (first_name, last_name, email, password_hash, role, phone, date_of_birth, address, alt_id, school_id)
         VALUES ($1, $2, $3, $4, 'student', $5, $6, $7, $8, $9)
         RETURNING id, first_name, last_name, email, phone, date_of_birth, address, is_active, created_at, updated_at`, [
                studentData.firstName, studentData.lastName, studentData.email, passwordHash,
                studentData.phone || null, studentData.dateOfBirth || null, studentData.address || null,
                userSequentialId, schoolId,
            ]);
            const user = userResult.rows[0];
            const studentSequentialId = await this.generateSequentialId('students');
            const studentResult = await client.query(`INSERT INTO students
           (user_id, student_id, class_id, enrollment_date, guardian_name, guardian_phone,
            guardian_email, emergency_contact, medical_info, alt_id, school_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id, alt_id, user_id, student_id, class_id, enrollment_date,
                   guardian_name, guardian_phone, guardian_email, emergency_contact,
                   medical_info, is_active, created_at, updated_at`, [
                user.id, studentData.studentId, studentData.classId, studentData.enrollmentDate,
                studentData.guardianName, studentData.guardianPhone, studentData.guardianEmail || null,
                studentData.emergencyContact, studentData.medicalInfo || null,
                studentSequentialId, schoolId,
            ]);
            const student = studentResult.rows[0];
            await client.query('UPDATE classes SET current_enrollment = current_enrollment + 1 WHERE id = $1 AND school_id = $2', [studentData.classId, schoolId]);
            await client.query(`INSERT INTO student_class_history (student_id, class_id, academic_year_id, start_date)
         VALUES ($1, $2, (SELECT academic_year_id FROM classes WHERE id = $2 AND school_id = $3), $4)`, [student.id, studentData.classId, schoolId, studentData.enrollmentDate]);
            return {
                ...this.transformStudentResponse(student),
                user: this.transformUserResponse(user),
                temporaryPassword: studentData.password ? undefined : password,
            };
        });
        await cacheService_1.default.delPattern(`${cacheService_1.CacheKeys.STUDENTS_BY_CLASS}:${schoolId}:*`);
        await cacheService_1.default.delPattern(`${cacheService_1.CacheKeys.CLASS}:${schoolId}:*`);
        await cacheService_1.default.delPattern(`${cacheService_1.CacheKeys.STATS_ENROLLMENT}:${schoolId}:*`);
        return result;
    }
    async getStudents(req) {
        const schoolId = this.requireSchool();
        const { page, limit, offset, sortBy, sortOrder } = (0, pagination_1.getPaginationParams)(req, 'first_name');
        const { isActive, search, classId, grade } = req.query;
        const cacheKey = `${cacheService_1.CacheKeys.STUDENTS_BY_CLASS}:${schoolId}:${page}:${limit}:${sortBy}:${sortOrder}:${isActive || 'all'}:${search || 'none'}:${classId || 'all'}:${grade || 'all'}`;
        if (!search) {
            return await cacheService_1.default.cacheQuery(cacheKey, () => this.executeStudentsQuery(req, schoolId), cacheService_1.CacheTTL.FIVE_MINUTES);
        }
        return await this.executeStudentsQuery(req, schoolId);
    }
    async executeStudentsQuery(req, schoolId) {
        const { page, limit, offset, sortBy, sortOrder } = (0, pagination_1.getPaginationParams)(req, 'first_name');
        const { isActive, search, classId, grade } = req.query;
        let whereClause = "WHERE s.school_id = $1 AND u.role = 'student'";
        const queryParams = [schoolId];
        if (isActive !== undefined) {
            whereClause += ` AND s.is_active = $${queryParams.length + 1}`;
            queryParams.push(isActive === 'true');
        }
        if (search) {
            whereClause += ` AND (u.first_name ILIKE $${queryParams.length + 1} OR u.last_name ILIKE $${queryParams.length + 1} OR u.email ILIKE $${queryParams.length + 1} OR s.student_id ILIKE $${queryParams.length + 1})`;
            queryParams.push(`%${search}%`);
        }
        if (classId) {
            whereClause += ` AND s.class_id = $${queryParams.length + 1}`;
            queryParams.push(classId);
        }
        if (grade) {
            whereClause += ` AND c.grade = $${queryParams.length + 1}`;
            queryParams.push(grade);
        }
        const countResult = await this.executeQuery(`SELECT COUNT(*) FROM students s
       JOIN users u ON s.user_id = u.id
       JOIN classes c ON s.class_id = c.id
       ${whereClause}`, queryParams);
        const total = parseInt(countResult.rows[0].count);
        const result = await this.executeQuery(`SELECT s.id, s.alt_id, s.user_id, s.student_id, s.class_id, s.enrollment_date,
              s.guardian_name, s.guardian_phone, s.guardian_email, s.emergency_contact,
              s.medical_info, s.is_active, s.created_at, s.updated_at,
              u.first_name, u.last_name, u.email, u.phone, u.date_of_birth, u.address,
              c.name as class_name, c.grade, c.section,
              ay.name as academic_year_name
       FROM students s
       JOIN users u ON s.user_id = u.id
       JOIN classes c ON s.class_id = c.id
       JOIN academic_years ay ON c.academic_year_id = ay.id
       ${whereClause}
       ORDER BY u.${sortBy} ${sortOrder}
       LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`, [...queryParams, limit, offset]);
        const students = result.rows.map((student) => ({
            ...this.transformStudentResponse(student),
            user: this.transformUserResponse(student),
            class: {
                id: student.class_id,
                name: student.class_name,
                grade: student.grade,
                section: student.section,
                academicYear: student.academic_year_name,
            },
        }));
        return { students, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }
    async getStudentById(id) {
        const schoolId = this.requireSchool();
        const cacheKey = `${cacheService_1.CacheKeys.STUDENT}:${schoolId}:${id}`;
        return await cacheService_1.default.cacheQuery(cacheKey, async () => {
            const isUUID = this.validateUUID(id);
            const idFilter = isUUID
                ? 'WHERE s.id = $1 AND s.school_id = $2'
                : 'WHERE (s.alt_id = $1 OR s.student_id = $1) AND s.school_id = $2';
            const result = await this.executeQuery(`SELECT s.id, s.alt_id, s.user_id, s.student_id, s.class_id, s.enrollment_date,
                s.guardian_name, s.guardian_phone, s.guardian_email, s.emergency_contact,
                s.medical_info, s.is_active, s.created_at, s.updated_at,
                u.first_name, u.last_name, u.email, u.phone, u.date_of_birth, u.address,
                c.name as class_name, c.grade, c.section,
                ay.name as academic_year_name
         FROM students s
         JOIN users u ON s.user_id = u.id
         JOIN classes c ON s.class_id = c.id
         JOIN academic_years ay ON c.academic_year_id = ay.id
         ${idFilter}`, [id, schoolId]);
            if (result.rows.length === 0)
                throw new errorHandler_1.AppError('Student not found', 404);
            const student = result.rows[0];
            const attendanceResult = await this.executeQuery(`SELECT
           COUNT(*) as total_days,
           COUNT(CASE WHEN status = 'present' THEN 1 END) as present_days,
           COUNT(CASE WHEN status = 'absent'  THEN 1 END) as absent_days,
           COUNT(CASE WHEN status = 'late'    THEN 1 END) as late_days
         FROM attendance
         WHERE student_id = $1 AND school_id = $2`, [student.id, schoolId]);
            const att = attendanceResult.rows[0];
            const attendancePercentage = att.total_days > 0
                ? Math.round((att.present_days / att.total_days) * 100)
                : 0;
            return {
                ...this.transformStudentResponse(student),
                user: this.transformUserResponse(student),
                class: { id: student.class_id, name: student.class_name, grade: student.grade, section: student.section, academicYear: student.academic_year_name },
                attendanceSummary: {
                    totalDays: parseInt(att.total_days),
                    presentDays: parseInt(att.present_days),
                    absentDays: parseInt(att.absent_days),
                    lateDays: parseInt(att.late_days),
                    attendancePercentage,
                },
            };
        }, cacheService_1.CacheTTL.TEN_MINUTES);
    }
    async updateStudent(id, updateData) {
        const schoolId = this.requireSchool();
        const existingStudent = await this.checkEntityExists('students', id, 'alt_id');
        const studentId = existingStudent.id;
        const userId = existingStudent.user_id;
        const result = await this.executeTransaction(async (client) => {
            const userUpdateData = {};
            if (updateData.firstName)
                userUpdateData.firstName = updateData.firstName;
            if (updateData.lastName)
                userUpdateData.lastName = updateData.lastName;
            if (updateData.phone !== undefined)
                userUpdateData.phone = updateData.phone;
            if (updateData.dateOfBirth !== undefined)
                userUpdateData.dateOfBirth = updateData.dateOfBirth;
            if (updateData.address !== undefined)
                userUpdateData.address = updateData.address;
            if (Object.keys(userUpdateData).length > 0) {
                const { query: uq, values: uv } = this.buildUpdateQuery('users', userUpdateData);
                uv.push(userId);
                await client.query(uq, uv);
            }
            const studentUpdateData = {};
            if (updateData.guardianName)
                studentUpdateData.guardianName = updateData.guardianName;
            if (updateData.guardianPhone)
                studentUpdateData.guardianPhone = updateData.guardianPhone;
            if (updateData.guardianEmail !== undefined)
                studentUpdateData.guardianEmail = updateData.guardianEmail;
            if (updateData.emergencyContact)
                studentUpdateData.emergencyContact = updateData.emergencyContact;
            if (updateData.medicalInfo !== undefined)
                studentUpdateData.medicalInfo = updateData.medicalInfo;
            if (updateData.classId && updateData.classId !== existingStudent.class_id) {
                const newClassResult = await client.query('SELECT id, capacity, current_enrollment FROM classes WHERE id = $1 AND school_id = $2 AND is_active = true', [updateData.classId, schoolId]);
                if (newClassResult.rows.length === 0)
                    throw new errorHandler_1.AppError('New class not found or inactive', 404);
                const newClass = newClassResult.rows[0];
                if (newClass.current_enrollment >= newClass.capacity)
                    throw new errorHandler_1.AppError('New class is at full capacity', 409);
                await client.query('UPDATE classes SET current_enrollment = current_enrollment - 1 WHERE id = $1 AND school_id = $2', [existingStudent.class_id, schoolId]);
                await client.query('UPDATE classes SET current_enrollment = current_enrollment + 1 WHERE id = $1 AND school_id = $2', [updateData.classId, schoolId]);
                await client.query('UPDATE student_class_history SET end_date = CURRENT_DATE WHERE student_id = $1 AND end_date IS NULL', [studentId]);
                await client.query(`INSERT INTO student_class_history (student_id, class_id, academic_year_id, start_date)
           VALUES ($1, $2, (SELECT academic_year_id FROM classes WHERE id = $2 AND school_id = $3), CURRENT_DATE)`, [studentId, updateData.classId, schoolId]);
                studentUpdateData.classId = updateData.classId;
            }
            if (Object.keys(studentUpdateData).length === 0 && Object.keys(userUpdateData).length === 0) {
                throw new errorHandler_1.AppError('No fields to update', 400);
            }
            let studentResult;
            if (Object.keys(studentUpdateData).length > 0) {
                const { query: sq, values: sv } = this.buildUpdateQuery('students', studentUpdateData);
                sv.push(studentId);
                studentResult = await client.query(sq, sv);
            }
            else {
                studentResult = await client.query('SELECT id, alt_id, user_id, student_id, class_id, enrollment_date, guardian_name, guardian_phone, guardian_email, emergency_contact, medical_info, is_active, created_at, updated_at FROM students WHERE id = $1', [studentId]);
            }
            const userResult = await client.query('SELECT first_name, last_name, email, phone, date_of_birth, address FROM users WHERE id = $1', [userId]);
            return {
                ...this.transformStudentResponse(studentResult.rows[0]),
                user: this.transformUserResponse(userResult.rows[0]),
            };
        });
        await cacheService_1.default.delPattern(`${cacheService_1.CacheKeys.STUDENT}:${schoolId}:*`);
        await cacheService_1.default.delPattern(`${cacheService_1.CacheKeys.STUDENTS_BY_CLASS}:${schoolId}:*`);
        await cacheService_1.default.delPattern(`${cacheService_1.CacheKeys.CLASS}:${schoolId}:*`);
        return result;
    }
    async deleteStudent(id) {
        const schoolId = this.requireSchool();
        const existingStudent = await this.checkEntityExists('students', id, 'alt_id');
        const studentId = existingStudent.id;
        const userId = existingStudent.user_id;
        await this.executeTransaction(async (client) => {
            await client.query('UPDATE students SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND school_id = $2', [studentId, schoolId]);
            await client.query('UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND school_id = $2', [userId, schoolId]);
            await client.query('UPDATE classes SET current_enrollment = current_enrollment - 1 WHERE id = $1 AND school_id = $2', [existingStudent.class_id, schoolId]);
            await client.query('UPDATE student_class_history SET end_date = CURRENT_DATE WHERE student_id = $1 AND end_date IS NULL', [studentId]);
        });
        await cacheService_1.default.delPattern(`${cacheService_1.CacheKeys.STUDENT}:${schoolId}:*`);
        await cacheService_1.default.delPattern(`${cacheService_1.CacheKeys.STUDENTS_BY_CLASS}:${schoolId}:*`);
        await cacheService_1.default.delPattern(`${cacheService_1.CacheKeys.CLASS}:${schoolId}:*`);
        await cacheService_1.default.delPattern(`${cacheService_1.CacheKeys.STATS_ENROLLMENT}:${schoolId}:*`);
        return { success: true };
    }
    async getStudentsByClass(classId, params) {
        const schoolId = this.requireSchool();
        const { page, limit } = params;
        const cacheKey = `${cacheService_1.CacheKeys.STUDENTS_BY_CLASS}:${schoolId}:${classId}:${page}:${limit}`;
        return await cacheService_1.default.cacheQuery(cacheKey, async () => {
            const offset = (page - 1) * limit;
            await this.checkEntityExists('classes', classId, 'alt_id');
            const countResult = await this.executeQuery('SELECT COUNT(*) FROM students s WHERE s.class_id = $1 AND s.school_id = $2 AND s.is_active = true', [classId, schoolId]);
            const total = parseInt(countResult.rows[0].count);
            const result = await this.executeQuery(`SELECT s.id, s.alt_id, s.user_id, s.student_id, s.class_id, s.enrollment_date,
                s.guardian_name, s.guardian_phone, s.guardian_email, s.emergency_contact,
                s.medical_info, s.is_active, s.created_at, s.updated_at,
                u.first_name, u.last_name, u.email, u.phone, u.date_of_birth, u.address
         FROM students s
         JOIN users u ON s.user_id = u.id
         WHERE s.class_id = $1 AND s.school_id = $2 AND s.is_active = true
         ORDER BY u.first_name, u.last_name
         LIMIT $3 OFFSET $4`, [classId, schoolId, limit, offset]);
            return {
                students: result.rows.map((row) => ({
                    ...this.transformStudentResponse(row),
                    user: this.transformUserResponse(row),
                })),
                pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
            };
        }, cacheService_1.CacheTTL.FIVE_MINUTES);
    }
    async getStudentSummary(id) {
        const schoolId = this.requireSchool();
        const student = await this.getStudentById(id);
        const feeResult = await this.executeQuery(`SELECT
         COALESCE(SUM(CASE WHEN sf.status IN ('pending','partial','overdue') THEN sf.amount - COALESCE(sf.amount_paid,0) ELSE 0 END), 0) as pending_fees,
         MAX(sf.due_date) as next_due_date
       FROM student_fees sf
       WHERE sf.student_id = $1 AND sf.school_id = $2`, [student.id, schoolId]);
        const gradesResult = await this.executeQuery(`SELECT g.percentage, g.grade_letter, g.assessment_date,
              sub.name as subject_name, at.name as assessment_type
       FROM grades g
       JOIN subjects sub ON g.subject_id = sub.id
       JOIN assessment_types at ON g.assessment_type_id = at.id
       WHERE g.student_id = $1 AND g.school_id = $2
       ORDER BY g.assessment_date DESC
       LIMIT 5`, [student.id, schoolId]);
        const gpaResult = await this.executeQuery('SELECT AVG(percentage) as overall_gpa FROM grades WHERE student_id = $1 AND school_id = $2', [student.id, schoolId]);
        return {
            studentId: student.id,
            personalInfo: {
                name: `${student.user.firstName} ${student.user.lastName}`,
                studentIdNumber: student.studentId,
                email: student.user.email,
                phone: student.user.phone,
                dateOfBirth: student.user.dateOfBirth,
                address: student.user.address,
            },
            academicInfo: {
                currentClass: `${student.class?.grade} ${student.class?.section}`,
                enrollmentDate: student.enrollmentDate,
                academicYear: student.class?.academicYear,
            },
            guardianInfo: {
                guardianName: student.guardianName,
                guardianPhone: student.guardianPhone,
                guardianEmail: student.guardianEmail,
                emergencyContact: student.emergencyContact,
            },
            currentStats: {
                attendancePercentage: student.attendanceSummary?.attendancePercentage || 0,
                overallGpa: gpaResult.rows[0]?.overall_gpa
                    ? parseFloat(gpaResult.rows[0].overall_gpa).toFixed(2)
                    : null,
                pendingFees: parseFloat(feeResult.rows[0]?.pending_fees || '0'),
                nextDueDate: feeResult.rows[0]?.next_due_date,
                recentGrades: gradesResult.rows.map((g) => ({
                    subject: g.subject_name,
                    assessmentType: g.assessment_type,
                    percentage: g.percentage,
                    gradeLetter: g.grade_letter,
                    assessmentDate: g.assessment_date,
                })),
            },
        };
    }
    async getStudentClassHistory(id) {
        const schoolId = this.requireSchool();
        const existingStudent = await this.checkEntityExists('students', id, 'alt_id');
        const result = await this.executeQuery(`SELECT sch.id, sch.student_id, sch.class_id, sch.academic_year_id,
              sch.start_date, sch.end_date, sch.created_at, sch.updated_at,
              c.name as class_name, c.grade, c.section,
              ay.name as academic_year_name, ay.start_date as year_start, ay.end_date as year_end
       FROM student_class_history sch
       JOIN classes c ON sch.class_id = c.id AND c.school_id = $2
       JOIN academic_years ay ON sch.academic_year_id = ay.id AND ay.school_id = $2
       WHERE sch.student_id = $1
       ORDER BY sch.start_date DESC`, [existingStudent.id, schoolId]);
        return result.rows.map((row) => ({
            id: row.id,
            classId: row.class_id,
            startDate: row.start_date,
            endDate: row.end_date,
            class: { name: row.class_name, grade: row.grade, section: row.section },
            academicYear: { name: row.academic_year_name, startDate: row.year_start, endDate: row.year_end },
        }));
    }
    async bulkUpdateStudents(studentIds, updateData) {
        const schoolId = this.requireSchool();
        return await this.executeTransaction(async (client) => {
            const results = { updatedCount: 0, failedUpdates: [] };
            for (const studentId of studentIds) {
                try {
                    const studentResult = await client.query('SELECT id, user_id FROM students WHERE (id = $1 OR alt_id = $1) AND school_id = $2', [studentId, schoolId]);
                    if (studentResult.rows.length === 0) {
                        results.failedUpdates.push({ studentId, error: 'Student not found' });
                        continue;
                    }
                    const student = studentResult.rows[0];
                    const userUpdateData = {};
                    if (updateData.firstName)
                        userUpdateData.firstName = updateData.firstName;
                    if (updateData.lastName)
                        userUpdateData.lastName = updateData.lastName;
                    if (updateData.phone !== undefined)
                        userUpdateData.phone = updateData.phone;
                    if (Object.keys(userUpdateData).length > 0) {
                        const { query: uq, values: uv } = this.buildUpdateQuery('users', userUpdateData);
                        uv.push(student.user_id);
                        await client.query(uq, uv);
                    }
                    const studentUpdateData = {};
                    if (updateData.guardianName)
                        studentUpdateData.guardianName = updateData.guardianName;
                    if (updateData.guardianPhone)
                        studentUpdateData.guardianPhone = updateData.guardianPhone;
                    if (updateData.classId)
                        studentUpdateData.classId = updateData.classId;
                    if (Object.keys(studentUpdateData).length > 0) {
                        const { query: sq, values: sv } = this.buildUpdateQuery('students', studentUpdateData);
                        sv.push(student.id);
                        await client.query(sq, sv);
                    }
                    results.updatedCount++;
                }
                catch (error) {
                    results.failedUpdates.push({ studentId, error: error.message });
                }
            }
            return results;
        });
    }
    generateDefaultPassword(studentId) {
        return `student${studentId}`;
    }
    transformStudentResponse(student) {
        return {
            id: student.id,
            altId: student.alt_id,
            userId: student.user_id,
            studentId: student.student_id,
            classId: student.class_id,
            enrollmentDate: student.enrollment_date,
            guardianName: student.guardian_name,
            guardianPhone: student.guardian_phone,
            guardianEmail: student.guardian_email,
            emergencyContact: student.emergency_contact,
            medicalInfo: student.medical_info,
            isActive: student.is_active,
            createdAt: student.created_at,
            updatedAt: student.updated_at,
        };
    }
    transformUserResponse(user) {
        return {
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            phone: user.phone,
            dateOfBirth: user.date_of_birth,
            address: user.address,
        };
    }
}
exports.StudentService = StudentService;
//# sourceMappingURL=studentService.js.map