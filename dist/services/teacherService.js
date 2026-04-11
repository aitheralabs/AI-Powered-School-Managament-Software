"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeacherService = void 0;
const baseService_1 = require("./baseService");
const errorHandler_1 = require("../middleware/errorHandler");
const pagination_1 = require("../utils/pagination");
const auth_1 = require("../utils/auth");
const schoolService_1 = require("./schoolService");
const schoolService = new schoolService_1.SchoolService();
class TeacherService extends baseService_1.BaseService {
    async createTeacher(teacherData) {
        const schoolId = this.requireSchool();
        await schoolService.checkLimit(schoolId, 'teacher');
        const existingUser = await this.executeQuery('SELECT id FROM users WHERE email = $1 AND school_id = $2', [teacherData.email, schoolId]);
        if (existingUser.rows.length > 0)
            throw new errorHandler_1.AppError('User with this email already exists', 409);
        const existingEmployee = await this.executeQuery('SELECT id FROM teachers WHERE employee_id = $1 AND school_id = $2', [teacherData.employeeId, schoolId]);
        if (existingEmployee.rows.length > 0)
            throw new errorHandler_1.AppError('Teacher with this employee ID already exists', 409);
        return await this.executeTransaction(async (client) => {
            const passwordHash = await (0, auth_1.hashPassword)(teacherData.password);
            const userSequentialId = await this.generateSequentialId('users');
            const userResult = await client.query(`INSERT INTO users (first_name, last_name, email, password_hash, role, phone, date_of_birth, address, alt_id, school_id)
         VALUES ($1, $2, $3, $4, 'teacher', $5, $6, $7, $8, $9)
         RETURNING id, first_name, last_name, email, phone, date_of_birth, address, is_active, created_at, updated_at`, [teacherData.firstName, teacherData.lastName, teacherData.email, passwordHash,
                teacherData.phone || null, teacherData.dateOfBirth || null, teacherData.address || null,
                userSequentialId, schoolId]);
            const user = userResult.rows[0];
            const teacherSequentialId = await this.generateSequentialId('teachers');
            const teacherResult = await client.query(`INSERT INTO teachers (user_id, employee_id, qualification, experience_years, specialization, joining_date, salary, alt_id, school_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, alt_id, user_id, employee_id, qualification, experience_years, specialization, joining_date, salary, is_active, created_at, updated_at`, [user.id, teacherData.employeeId, teacherData.qualification || null,
                teacherData.experienceYears || 0, teacherData.specialization || null,
                teacherData.joiningDate, teacherData.salary || null, teacherSequentialId, schoolId]);
            return { ...this.transformTeacherResponse(teacherResult.rows[0]), user: this.transformUserResponse(user) };
        });
    }
    async getTeachers(req) {
        const schoolId = this.requireSchool();
        const { page, limit, offset, sortBy, sortOrder } = (0, pagination_1.getPaginationParams)(req, 'first_name');
        const { isActive, search, specialization } = req.query;
        let whereClause = 'WHERE t.school_id = $1';
        const queryParams = [schoolId];
        if (isActive !== undefined) {
            whereClause += ` AND t.is_active = $${queryParams.length + 1}`;
            queryParams.push(isActive === 'true');
        }
        if (search) {
            whereClause += ` AND (u.first_name ILIKE $${queryParams.length + 1} OR u.last_name ILIKE $${queryParams.length + 1} OR u.email ILIKE $${queryParams.length + 1} OR t.employee_id ILIKE $${queryParams.length + 1})`;
            queryParams.push(`%${search}%`);
        }
        if (specialization) {
            whereClause += ` AND t.specialization ILIKE $${queryParams.length + 1}`;
            queryParams.push(`%${specialization}%`);
        }
        const countResult = await this.executeQuery(`SELECT COUNT(*) FROM teachers t JOIN users u ON t.user_id = u.id ${whereClause}`, queryParams);
        const total = parseInt(countResult.rows[0].count);
        const result = await this.executeQuery(`SELECT t.id, t.alt_id, t.user_id, t.employee_id, t.qualification, t.experience_years,
              t.specialization, t.joining_date, t.salary, t.is_active, t.created_at, t.updated_at,
              u.first_name, u.last_name, u.email, u.phone, u.date_of_birth, u.address
       FROM teachers t
       JOIN users u ON t.user_id = u.id
       ${whereClause}
       ORDER BY u.${sortBy} ${sortOrder}
       LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`, [...queryParams, limit, offset]);
        return {
            teachers: result.rows.map((t) => ({ ...this.transformTeacherResponse(t), user: this.transformUserResponse(t) })),
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async getTeacherById(id) {
        const schoolId = this.requireSchool();
        const isUUID = this.validateUUID(id);
        const idFilter = isUUID
            ? 'WHERE t.id = $1 AND t.school_id = $2'
            : 'WHERE (t.alt_id = $1 OR t.employee_id = $1) AND t.school_id = $2';
        const result = await this.executeQuery(`SELECT t.id, t.alt_id, t.user_id, t.employee_id, t.qualification, t.experience_years,
              t.specialization, t.joining_date, t.salary, t.is_active, t.created_at, t.updated_at,
              u.first_name, u.last_name, u.email, u.phone, u.date_of_birth, u.address
       FROM teachers t JOIN users u ON t.user_id = u.id ${idFilter}`, [id, schoolId]);
        if (result.rows.length === 0)
            throw new errorHandler_1.AppError('Teacher not found', 404);
        const teacher = result.rows[0];
        const subjectsResult = await this.executeQuery(`SELECT s.id, s.name, s.code, s.description, s.credit_hours
       FROM teacher_subjects ts
       JOIN subjects s ON ts.subject_id = s.id AND s.school_id = $2
       WHERE ts.teacher_id = $1 AND s.is_active = true ORDER BY s.name`, [teacher.id, schoolId]);
        const classesResult = await this.executeQuery(`SELECT c.id, c.name, c.grade, c.section, c.capacity, c.room, ay.name as academic_year_name
       FROM classes c
       JOIN academic_years ay ON c.academic_year_id = ay.id AND ay.school_id = $2
       WHERE c.teacher_id = $1 AND c.is_active = true AND c.school_id = $2
       ORDER BY c.grade, c.section`, [teacher.id, schoolId]);
        return {
            ...this.transformTeacherResponse(teacher),
            user: this.transformUserResponse(teacher),
            subjects: subjectsResult.rows.map((s) => ({ id: s.id, name: s.name, code: s.code, creditHours: s.credit_hours })),
            classes: classesResult.rows.map((c) => ({ id: c.id, name: c.name, grade: c.grade, section: c.section, academicYearName: c.academic_year_name })),
        };
    }
    async updateTeacher(id, updateData) {
        const schoolId = this.requireSchool();
        const existingTeacher = await this.checkEntityExists('teachers', id, 'alt_id');
        const teacherId = existingTeacher.id;
        const userId = existingTeacher.user_id;
        return await this.executeTransaction(async (client) => {
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
            const teacherUpdateData = {};
            if (updateData.qualification !== undefined)
                teacherUpdateData.qualification = updateData.qualification;
            if (updateData.experienceYears !== undefined)
                teacherUpdateData.experienceYears = updateData.experienceYears;
            if (updateData.specialization !== undefined)
                teacherUpdateData.specialization = updateData.specialization;
            if (updateData.salary !== undefined)
                teacherUpdateData.salary = updateData.salary;
            if (Object.keys(teacherUpdateData).length === 0 && Object.keys(userUpdateData).length === 0) {
                throw new errorHandler_1.AppError('No fields to update', 400);
            }
            let teacherResult;
            if (Object.keys(teacherUpdateData).length > 0) {
                const { query: tq, values: tv } = this.buildUpdateQuery('teachers', teacherUpdateData);
                tv.push(teacherId);
                teacherResult = await client.query(tq, tv);
            }
            else {
                teacherResult = await client.query('SELECT id, alt_id, user_id, employee_id, qualification, experience_years, specialization, joining_date, salary, is_active, created_at, updated_at FROM teachers WHERE id = $1', [teacherId]);
            }
            const userResult = await client.query('SELECT first_name, last_name, email, phone, date_of_birth, address FROM users WHERE id = $1', [userId]);
            return { ...this.transformTeacherResponse(teacherResult.rows[0]), user: this.transformUserResponse(userResult.rows[0]) };
        });
    }
    async deleteTeacher(id) {
        const schoolId = this.requireSchool();
        const existingTeacher = await this.checkEntityExists('teachers', id, 'alt_id');
        const teacherId = existingTeacher.id;
        const userId = existingTeacher.user_id;
        const assignmentsCheck = await this.executeQuery('SELECT COUNT(*) FROM classes WHERE teacher_id = $1 AND is_active = true AND school_id = $2', [teacherId, schoolId]);
        if (parseInt(assignmentsCheck.rows[0].count) > 0) {
            throw new errorHandler_1.AppError('Cannot deactivate teacher with active class assignments. Reassign classes first.', 409);
        }
        return await this.executeTransaction(async (client) => {
            await client.query('UPDATE teachers SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND school_id = $2', [teacherId, schoolId]);
            await client.query('UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND school_id = $2', [userId, schoolId]);
            return { success: true };
        });
    }
    transformTeacherResponse(teacher) {
        return {
            id: teacher.id, altId: teacher.alt_id, userId: teacher.user_id,
            employeeId: teacher.employee_id, qualification: teacher.qualification,
            experienceYears: teacher.experience_years, specialization: teacher.specialization,
            joiningDate: teacher.joining_date, salary: teacher.salary,
            isActive: teacher.is_active, createdAt: teacher.created_at, updatedAt: teacher.updated_at,
        };
    }
    transformUserResponse(user) {
        return {
            firstName: user.first_name, lastName: user.last_name, email: user.email,
            phone: user.phone, dateOfBirth: user.date_of_birth, address: user.address,
        };
    }
}
exports.TeacherService = TeacherService;
//# sourceMappingURL=teacherService.js.map