"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subjectService = exports.SubjectService = void 0;
const baseService_1 = require("./baseService");
const errorHandler_1 = require("../middleware/errorHandler");
const pagination_1 = require("../utils/pagination");
class SubjectService extends baseService_1.BaseService {
    async createSubject(subjectData) {
        const schoolId = this.requireSchool();
        const existingSubject = await this.executeQuery('SELECT id FROM subjects WHERE code = $1 AND school_id = $2', [subjectData.code, schoolId]);
        if (existingSubject.rows.length > 0)
            throw new errorHandler_1.AppError('Subject with this code already exists', 409);
        const sequentialId = await this.generateSequentialId('subjects');
        const result = await this.executeQuery(`INSERT INTO subjects (name, code, description, credit_hours, alt_id, school_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, alt_id, name, code, description, credit_hours, is_active, created_at, updated_at`, [subjectData.name, subjectData.code, subjectData.description || null, subjectData.creditHours || 1, sequentialId, schoolId]);
        return this.transformSubjectResponse(result.rows[0]);
    }
    async getSubjects(req) {
        const schoolId = this.requireSchool();
        const { page, limit, offset, sortBy, sortOrder } = (0, pagination_1.getPaginationParams)(req, 'name');
        const { isActive, search } = req.query;
        let whereClause = 'WHERE school_id = $1';
        const queryParams = [schoolId];
        if (isActive !== undefined) {
            whereClause += ` AND is_active = $${queryParams.length + 1}`;
            queryParams.push(isActive === 'true');
        }
        if (search) {
            whereClause += ` AND (name ILIKE $${queryParams.length + 1} OR code ILIKE $${queryParams.length + 1} OR description ILIKE $${queryParams.length + 1})`;
            queryParams.push(`%${search}%`);
        }
        const countResult = await this.executeQuery(`SELECT COUNT(*) FROM subjects ${whereClause}`, queryParams);
        const total = parseInt(countResult.rows[0].count);
        const result = await this.executeQuery(`SELECT id, alt_id, name, code, description, credit_hours, is_active, created_at, updated_at
       FROM subjects
       ${whereClause}
       ORDER BY ${sortBy} ${sortOrder}
       LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`, [...queryParams, limit, offset]);
        return {
            subjects: result.rows.map((subject) => this.transformSubjectResponse(subject)),
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async getSubjectById(id) {
        const subject = await this.checkEntityExists('subjects', id, 'alt_id');
        const classesResult = await this.executeQuery(`SELECT c.id, c.name, c.grade, c.section, ay.name as academic_year_name
       FROM class_subjects cs
       JOIN classes c ON cs.class_id = c.id
       JOIN academic_years ay ON c.academic_year_id = ay.id
       WHERE cs.subject_id = $1 AND c.is_active = true
       ORDER BY c.grade, c.section`, [subject.id]);
        const teachersResult = await this.executeQuery(`SELECT t.id, t.employee_id, u.first_name, u.last_name
       FROM teacher_subjects ts
       JOIN teachers t ON ts.teacher_id = t.id
       JOIN users u ON t.user_id = u.id
       WHERE ts.subject_id = $1 AND t.is_active = true AND u.is_active = true
       ORDER BY u.first_name, u.last_name`, [subject.id]);
        return {
            ...this.transformSubjectResponse(subject),
            classes: classesResult.rows.map((cls) => ({ id: cls.id, name: cls.name, grade: cls.grade, section: cls.section, academicYear: cls.academic_year_name })),
            teachers: teachersResult.rows.map((teacher) => ({ id: teacher.id, employeeId: teacher.employee_id, name: `${teacher.first_name} ${teacher.last_name}` })),
        };
    }
    async updateSubject(id, updateData) {
        const existingSubject = await this.checkEntityExists('subjects', id, 'alt_id');
        const actualSubjectId = existingSubject.id;
        if (updateData.code && updateData.code !== existingSubject.code) {
            const codeConflict = await this.executeQuery('SELECT id FROM subjects WHERE code = $1 AND id != $2', [updateData.code, actualSubjectId]);
            if (codeConflict.rows.length > 0)
                throw new errorHandler_1.AppError('Subject with this code already exists', 409);
        }
        const { query: updateQuery, values } = this.buildUpdateQuery('subjects', updateData);
        values.push(actualSubjectId);
        const result = await this.executeQuery(updateQuery, values);
        return this.transformSubjectResponse(result.rows[0]);
    }
    async deleteSubject(id) {
        const existingSubject = await this.checkEntityExists('subjects', id, 'alt_id');
        const actualSubjectId = existingSubject.id;
        const dependenciesCheck = await this.executeQuery(`SELECT
         (SELECT COUNT(*) FROM class_subjects WHERE subject_id = $1) as class_assignments,
         (SELECT COUNT(*) FROM teacher_subjects WHERE subject_id = $1) as teacher_assignments,
         (SELECT COUNT(*) FROM grades WHERE subject_id = $1) as grade_records`, [actualSubjectId]);
        const dependencies = dependenciesCheck.rows[0];
        const totalDependencies = parseInt(dependencies.class_assignments) + parseInt(dependencies.teacher_assignments) + parseInt(dependencies.grade_records);
        if (totalDependencies > 0) {
            throw new errorHandler_1.AppError(`Cannot delete subject. It has ${dependencies.class_assignments} class assignments, ${dependencies.teacher_assignments} teacher assignments, and ${dependencies.grade_records} grade records.`, 409);
        }
        await this.executeQuery('UPDATE subjects SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [actualSubjectId]);
        return { success: true };
    }
    async toggleSubjectStatus(id, isActive) {
        const existingSubject = await this.checkEntityExists('subjects', id, 'alt_id');
        const result = await this.executeQuery('UPDATE subjects SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *', [isActive, existingSubject.id]);
        return this.transformSubjectResponse(result.rows[0]);
    }
    async getSubjectStatistics(id) {
        const subject = await this.checkEntityExists('subjects', id, 'alt_id');
        const actualSubjectId = subject.id;
        const statsResult = await this.executeQuery(`SELECT
        (SELECT COUNT(*) FROM class_subjects WHERE subject_id = $1) as total_classes,
        (SELECT COUNT(DISTINCT t.id) FROM teacher_subjects ts JOIN teachers t ON ts.teacher_id = t.id WHERE ts.subject_id = $1 AND t.is_active = true) as total_teachers,
        (SELECT COUNT(DISTINCT s.id) FROM students s JOIN classes c ON c.id = s.class_id JOIN class_subjects cs ON cs.class_id = c.id WHERE cs.subject_id = $1 AND s.is_active = true) as total_students,
        (SELECT COUNT(*) FROM grades WHERE subject_id = $1) as total_grades,
        (SELECT AVG(marks_obtained::float / total_marks * 100) FROM grades WHERE subject_id = $1 AND total_marks > 0) as average_percentage`, [actualSubjectId]);
        const gradeDistributionResult = await this.executeQuery(`SELECT
        CASE
          WHEN (marks_obtained::float / total_marks * 100) >= 90 THEN 'A+'
          WHEN (marks_obtained::float / total_marks * 100) >= 80 THEN 'A'
          WHEN (marks_obtained::float / total_marks * 100) >= 70 THEN 'B+'
          WHEN (marks_obtained::float / total_marks * 100) >= 60 THEN 'B'
          WHEN (marks_obtained::float / total_marks * 100) >= 50 THEN 'C+'
          WHEN (marks_obtained::float / total_marks * 100) >= 40 THEN 'C'
          ELSE 'F'
        END as grade,
        COUNT(*) as count
       FROM grades WHERE subject_id = $1 AND total_marks > 0
       GROUP BY 1 ORDER BY MIN(marks_obtained::float / total_marks * 100) DESC`, [actualSubjectId]);
        const stats = statsResult.rows[0];
        return {
            subject: this.transformSubjectResponse(subject),
            stats: {
                totalClasses: parseInt(stats.total_classes) || 0,
                totalTeachers: parseInt(stats.total_teachers) || 0,
                totalStudents: parseInt(stats.total_students) || 0,
                totalGrades: parseInt(stats.total_grades) || 0,
                averagePercentage: stats.average_percentage ? parseFloat(stats.average_percentage).toFixed(2) : null,
            },
            gradeDistribution: gradeDistributionResult.rows.map((row) => ({ grade: row.grade, count: parseInt(row.count) })),
        };
    }
    transformSubjectResponse(subject) {
        return {
            id: subject.id, altId: subject.alt_id, name: subject.name, code: subject.code,
            description: subject.description, creditHours: subject.credit_hours,
            isActive: subject.is_active, createdAt: subject.created_at, updatedAt: subject.updated_at,
        };
    }
}
exports.SubjectService = SubjectService;
exports.subjectService = new SubjectService();
//# sourceMappingURL=subjectService.js.map