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
exports.ClassService = void 0;
const baseService_1 = require("./baseService");
const errorHandler_1 = require("../middleware/errorHandler");
const pagination_1 = require("../utils/pagination");
const cacheService_1 = __importStar(require("./cacheService"));
class ClassService extends baseService_1.BaseService {
    async createClass(classData) {
        const schoolId = this.requireSchool();
        return await this.executeTransaction(async (client) => {
            const academicYearExists = await client.query('SELECT id, name FROM academic_years WHERE id = $1 AND school_id = $2', [classData.academicYearId, schoolId]);
            if (academicYearExists.rows.length === 0)
                throw new errorHandler_1.AppError('Academic year not found', 404);
            if (classData.teacherId) {
                const teacherExists = await client.query("SELECT id FROM users WHERE id = $1 AND role = 'teacher' AND is_active = true AND school_id = $2", [classData.teacherId, schoolId]);
                if (teacherExists.rows.length === 0)
                    throw new errorHandler_1.AppError('Teacher not found or inactive', 404);
                const existingAssignment = await client.query('SELECT id, grade, section FROM classes WHERE teacher_id = $1 AND is_active = true AND school_id = $2', [classData.teacherId, schoolId]);
                if (existingAssignment.rows.length > 0) {
                    const ec = existingAssignment.rows[0];
                    throw new errorHandler_1.AppError(`Teacher is already assigned to class ${ec.grade}-${ec.section}`, 409);
                }
            }
            const existingClass = await client.query('SELECT id FROM classes WHERE grade = $1 AND section = $2 AND academic_year_id = $3 AND school_id = $4', [classData.grade, classData.section, classData.academicYearId, schoolId]);
            if (existingClass.rows.length > 0) {
                throw new errorHandler_1.AppError('Class with this grade and section already exists for this academic year', 409);
            }
            const sequentialId = await this.generateSequentialId('classes');
            const result = await client.query(`INSERT INTO classes
           (name, grade, section, teacher_id, capacity, room, description, academic_year_id, current_enrollment, alt_id, school_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, $9, $10)
         RETURNING id, alt_id, name, grade, section, teacher_id, capacity, room, description, academic_year_id, current_enrollment, is_active, created_at, updated_at`, [
                classData.name, classData.grade, classData.section,
                classData.teacherId || null, classData.capacity,
                classData.room || null, classData.description || null,
                classData.academicYearId, sequentialId, schoolId,
            ]);
            const newClass = result.rows[0];
            const academicYear = academicYearExists.rows[0];
            let teacher = null;
            if (newClass.teacher_id) {
                const teacherResult = await client.query('SELECT first_name, last_name FROM users WHERE id = $1 AND school_id = $2', [newClass.teacher_id, schoolId]);
                if (teacherResult.rows.length > 0) {
                    const t = teacherResult.rows[0];
                    teacher = { id: newClass.teacher_id, name: `${t.first_name} ${t.last_name}` };
                }
            }
            await cacheService_1.default.delPattern(`${cacheService_1.CacheKeys.CLASS}:${schoolId}:*`);
            await cacheService_1.default.delPattern(`${cacheService_1.CacheKeys.CLASSES_ALL}:${schoolId}:*`);
            return { ...this.transformClassResponse(newClass), academicYear: { id: academicYear.id, name: academicYear.name }, teacher };
        });
    }
    async getClasses(req) {
        const schoolId = this.requireSchool();
        const { page, limit, offset, sortBy, sortOrder } = (0, pagination_1.getPaginationParams)(req, 'grade');
        const { isActive, academicYearId, grade, teacherId } = req.query;
        const cacheKey = `${cacheService_1.CacheKeys.CLASSES_ALL}:${schoolId}:${page}:${limit}:${isActive || 'all'}:${academicYearId || 'all'}:${grade || 'all'}:${teacherId || 'all'}`;
        return await cacheService_1.default.cacheQuery(cacheKey, async () => {
            let whereClause = 'WHERE c.school_id = $1';
            const queryParams = [schoolId];
            if (isActive !== undefined) {
                whereClause += ` AND c.is_active = $${queryParams.length + 1}`;
                queryParams.push(isActive === 'true');
            }
            if (academicYearId) {
                whereClause += ` AND c.academic_year_id = $${queryParams.length + 1}`;
                queryParams.push(academicYearId);
            }
            if (grade) {
                whereClause += ` AND c.grade = $${queryParams.length + 1}`;
                queryParams.push(grade);
            }
            if (teacherId) {
                whereClause += ` AND c.teacher_id = $${queryParams.length + 1}`;
                queryParams.push(teacherId);
            }
            const countResult = await this.executeQuery(`SELECT COUNT(*) FROM classes c JOIN academic_years ay ON c.academic_year_id = ay.id ${whereClause}`, queryParams);
            const total = parseInt(countResult.rows[0].count);
            const result = await this.executeQuery(`SELECT c.id, c.alt_id, c.name, c.grade, c.section, c.teacher_id, c.capacity, c.room,
                c.description, c.academic_year_id, c.current_enrollment, c.is_active, c.created_at, c.updated_at,
                ay.name as academic_year_name,
                u.first_name as teacher_first_name, u.last_name as teacher_last_name
         FROM classes c
         JOIN academic_years ay ON c.academic_year_id = ay.id
         LEFT JOIN users u ON c.teacher_id = u.id
         ${whereClause}
         ORDER BY c.${sortBy} ${sortOrder}, c.section
         LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`, [...queryParams, limit, offset]);
            const classes = result.rows.map((cls) => ({
                ...this.transformClassResponse(cls),
                academicYear: { id: cls.academic_year_id, name: cls.academic_year_name },
                teacher: cls.teacher_first_name ? { id: cls.teacher_id, name: `${cls.teacher_first_name} ${cls.teacher_last_name}` } : null,
            }));
            return { items: classes, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
        }, cacheService_1.CacheTTL.FIVE_MINUTES);
    }
    async getClassById(id) {
        const schoolId = this.requireSchool();
        const classInfo = await this.checkEntityExists('classes', id, 'alt_id');
        const academicYearResult = await this.executeQuery('SELECT id, name FROM academic_years WHERE id = $1 AND school_id = $2', [classInfo.academic_year_id, schoolId]);
        let teacher = null;
        if (classInfo.teacher_id) {
            const teacherResult = await this.executeQuery('SELECT first_name, last_name FROM users WHERE id = $1 AND school_id = $2', [classInfo.teacher_id, schoolId]);
            if (teacherResult.rows.length > 0) {
                const t = teacherResult.rows[0];
                teacher = { id: classInfo.teacher_id, name: `${t.first_name} ${t.last_name}` };
            }
        }
        const studentsResult = await this.executeQuery(`SELECT s.id, s.student_id, u.first_name, u.last_name, s.enrollment_date
       FROM students s
       JOIN users u ON s.user_id = u.id
       WHERE s.class_id = $1 AND s.school_id = $2 AND s.is_active = true
       ORDER BY u.first_name, u.last_name`, [classInfo.id, schoolId]);
        const subjectsResult = await this.executeQuery(`SELECT cs.id as assignment_id, s.id, s.name, s.code, s.credit_hours,
              u.first_name as teacher_first_name, u.last_name as teacher_last_name
       FROM class_subjects cs
       JOIN subjects s ON cs.subject_id = s.id AND s.school_id = $2
       LEFT JOIN users u ON cs.teacher_id = u.id
       WHERE cs.class_id = $1 AND s.is_active = true
       ORDER BY s.name`, [classInfo.id, schoolId]);
        return {
            ...this.transformClassResponse(classInfo),
            academicYear: academicYearResult.rows[0]
                ? { id: academicYearResult.rows[0].id, name: academicYearResult.rows[0].name }
                : null,
            teacher,
            students: studentsResult.rows.map((s) => ({
                id: s.id, studentId: s.student_id,
                name: `${s.first_name} ${s.last_name}`, enrollmentDate: s.enrollment_date,
            })),
            subjects: subjectsResult.rows.map((s) => ({
                assignmentId: s.assignment_id, id: s.id, name: s.name, code: s.code, creditHours: s.credit_hours,
                teacher: s.teacher_first_name ? { name: `${s.teacher_first_name} ${s.teacher_last_name}` } : null,
            })),
        };
    }
    async updateClass(id, updateData) {
        const schoolId = this.requireSchool();
        const existingClass = await this.checkEntityExists('classes', id, 'alt_id');
        const actualClassId = existingClass.id;
        return await this.executeTransaction(async (client) => {
            if (updateData.teacherId) {
                const teacherExists = await client.query("SELECT id FROM users WHERE id = $1 AND role = 'teacher' AND is_active = true AND school_id = $2", [updateData.teacherId, schoolId]);
                if (teacherExists.rows.length === 0)
                    throw new errorHandler_1.AppError('Teacher not found or inactive', 404);
                const existingAssignment = await client.query('SELECT id, grade, section FROM classes WHERE teacher_id = $1 AND is_active = true AND id != $2 AND school_id = $3', [updateData.teacherId, actualClassId, schoolId]);
                if (existingAssignment.rows.length > 0) {
                    const ec = existingAssignment.rows[0];
                    throw new errorHandler_1.AppError(`Teacher already assigned to class ${ec.grade}-${ec.section}`, 409);
                }
            }
            const { query: updateQuery, values } = this.buildUpdateQuery('classes', updateData);
            values.push(actualClassId);
            const result = await client.query(updateQuery, values);
            await cacheService_1.default.delPattern(`${cacheService_1.CacheKeys.CLASS}:${schoolId}:*`);
            await cacheService_1.default.delPattern(`${cacheService_1.CacheKeys.CLASSES_ALL}:${schoolId}:*`);
            return this.transformClassResponse(result.rows[0]);
        });
    }
    async deleteClass(id) {
        const schoolId = this.requireSchool();
        const classInfo = await this.checkEntityExists('classes', id, 'alt_id');
        const studentsCheck = await this.executeQuery('SELECT COUNT(*) FROM students WHERE class_id = $1 AND school_id = $2 AND is_active = true', [classInfo.id, schoolId]);
        if (parseInt(studentsCheck.rows[0].count) > 0) {
            throw new errorHandler_1.AppError('Cannot delete class with active students. Reassign or deactivate them first.', 409);
        }
        await this.executeQuery('UPDATE classes SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND school_id = $2', [classInfo.id, schoolId]);
        await cacheService_1.default.delPattern(`${cacheService_1.CacheKeys.CLASS}:${schoolId}:*`);
        await cacheService_1.default.delPattern(`${cacheService_1.CacheKeys.CLASSES_ALL}:${schoolId}:*`);
        return { success: true };
    }
    async assignSubjectToClass(classId, subjectId, teacherId) {
        const schoolId = this.requireSchool();
        const classInfo = await this.checkEntityExists('classes', classId, 'alt_id');
        const subjectExists = await this.executeQuery('SELECT id FROM subjects WHERE id = $1 AND (school_id = $2 OR school_id IS NULL) AND is_active = true', [subjectId, schoolId]);
        if (subjectExists.rows.length === 0)
            throw new errorHandler_1.AppError('Subject not found', 404);
        let resolvedTeacherId = null;
        if (teacherId) {
            const userRow = await this.executeQuery("SELECT id FROM users WHERE id = $1 AND role = 'teacher' AND school_id = $2", [teacherId, schoolId]);
            if (userRow.rows.length > 0) {
                resolvedTeacherId = userRow.rows[0].id;
            }
            else {
                const teacherRow = await this.executeQuery('SELECT user_id FROM teachers WHERE id = $1 AND school_id = $2', [teacherId, schoolId]);
                if (teacherRow.rows.length > 0)
                    resolvedTeacherId = teacherRow.rows[0].user_id;
            }
        }
        const result = await this.executeQuery(`INSERT INTO class_subjects (class_id, subject_id, teacher_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (class_id, subject_id) DO UPDATE SET teacher_id = EXCLUDED.teacher_id
       RETURNING id, class_id, subject_id, teacher_id, created_at`, [classInfo.id, subjectId, resolvedTeacherId]);
        await cacheService_1.default.delPattern(`${cacheService_1.CacheKeys.CLASS}:${schoolId}:*`);
        return result.rows[0];
    }
    async getClassSubjects(classId) {
        const schoolId = this.requireSchool();
        const classInfo = await this.checkEntityExists('classes', classId, 'alt_id');
        const result = await this.executeQuery(`SELECT cs.id as assignment_id, s.id, s.name, s.code, s.credit_hours, s.description,
              u.first_name as teacher_first_name, u.last_name as teacher_last_name, u.id as teacher_user_id
       FROM class_subjects cs
       JOIN subjects s ON cs.subject_id = s.id
       LEFT JOIN users u ON cs.teacher_id = u.id
       WHERE cs.class_id = $1 AND s.is_active = true
       ORDER BY s.name`, [classInfo.id]);
        return {
            subjects: result.rows.map((s) => ({
                assignmentId: s.assignment_id,
                id: s.id,
                name: s.name,
                code: s.code,
                creditHours: s.credit_hours,
                description: s.description,
                teacher: s.teacher_first_name ? { id: s.teacher_user_id, name: `${s.teacher_first_name} ${s.teacher_last_name}` } : null,
            })),
        };
    }
    transformClassResponse(cls) {
        return {
            id: cls.id, altId: cls.alt_id, name: cls.name, grade: cls.grade, section: cls.section,
            teacherId: cls.teacher_id, capacity: cls.capacity, room: cls.room,
            description: cls.description, academicYearId: cls.academic_year_id,
            currentEnrollment: cls.current_enrollment, isActive: cls.is_active,
            createdAt: cls.created_at, updatedAt: cls.updated_at,
        };
    }
}
exports.ClassService = ClassService;
//# sourceMappingURL=classService.js.map