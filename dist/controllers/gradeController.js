"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkCreateGrades = exports.getGradeStats = exports.getClassGrades = exports.getStudentGrades = exports.deleteGrade = exports.updateGrade = exports.getGradeById = exports.getGrades = exports.createGrade = void 0;
const connection_1 = require("../database/connection");
const errorHandler_1 = require("../middleware/errorHandler");
const grade_1 = require("../types/grade");
const pagination_1 = require("../utils/pagination");
function calculateGradeLetter(percentage) {
    if (percentage >= 95)
        return 'A+';
    if (percentage >= 90)
        return 'A';
    if (percentage >= 85)
        return 'B+';
    if (percentage >= 80)
        return 'B';
    if (percentage >= 75)
        return 'C+';
    if (percentage >= 70)
        return 'C';
    if (percentage >= 60)
        return 'D';
    return 'F';
}
exports.createGrade = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const gradeData = grade_1.CreateGradeSchema.parse(req.body);
    const userId = req.user.id;
    const userRole = req.user.role;
    const schoolId = req.schoolId;
    if (userRole === 'teacher') {
        const authCheck = await (0, connection_1.query)(`SELECT 1 FROM class_subjects cs
       JOIN students s ON s.class_id = cs.class_id AND s.school_id = $4
       WHERE s.id = $1 AND cs.subject_id = $2 AND cs.teacher_id = $3`, [gradeData.studentId, gradeData.subjectId, userId, schoolId]);
        if (authCheck.rows.length === 0) {
            throw new errorHandler_1.AppError('You are not authorized to enter grades for this student and subject', 403);
        }
    }
    const studentCheck = await (0, connection_1.query)('SELECT id FROM students WHERE id = $1 AND school_id = $2 AND is_active = true', [gradeData.studentId, schoolId]);
    if (studentCheck.rows.length === 0)
        throw new errorHandler_1.AppError('Student not found or inactive', 404);
    const subjectCheck = await (0, connection_1.query)('SELECT id FROM subjects WHERE id = $1 AND school_id = $2 AND is_active = true', [gradeData.subjectId, schoolId]);
    if (subjectCheck.rows.length === 0)
        throw new errorHandler_1.AppError('Subject not found or inactive', 404);
    const assessmentCheck = await (0, connection_1.query)('SELECT id FROM assessment_types WHERE id = $1 AND school_id = $2 AND is_active = true', [gradeData.assessmentTypeId, schoolId]);
    if (assessmentCheck.rows.length === 0)
        throw new errorHandler_1.AppError('Assessment type not found or inactive', 404);
    const semesterCheck = await (0, connection_1.query)('SELECT id FROM semesters WHERE id = $1 AND school_id = $2 AND is_active = true', [gradeData.semesterId, schoolId]);
    if (semesterCheck.rows.length === 0)
        throw new errorHandler_1.AppError('Semester not found or inactive', 404);
    const duplicateCheck = await (0, connection_1.query)('SELECT id FROM grades WHERE student_id = $1 AND subject_id = $2 AND assessment_type_id = $3 AND semester_id = $4 AND school_id = $5', [gradeData.studentId, gradeData.subjectId, gradeData.assessmentTypeId, gradeData.semesterId, schoolId]);
    if (duplicateCheck.rows.length > 0) {
        throw new errorHandler_1.AppError('Grade already exists for this student, subject, assessment type, and semester', 409);
    }
    const result = await (0, connection_1.query)(`INSERT INTO grades
       (student_id, subject_id, assessment_type_id, marks_obtained,
        total_marks, semester_id, recorded_by, remarks, school_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`, [
        gradeData.studentId, gradeData.subjectId, gradeData.assessmentTypeId,
        gradeData.marksObtained, gradeData.totalMarks,
        gradeData.semesterId, userId, gradeData.remarks || null, schoolId,
    ]);
    const gradeWithRelations = await getGradeWithRelations(result.rows[0].id, schoolId);
    res.status(201).json({ success: true, data: gradeWithRelations, message: 'Grade created successfully' });
});
exports.getGrades = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const queryParams = grade_1.GradeQuerySchema.parse(req.query);
    const userId = req.user.id;
    const userRole = req.user.role;
    const schoolId = req.schoolId;
    const { offset, limit } = (0, pagination_1.getPaginationParams)(req);
    let whereClause = 'WHERE g.school_id = $1';
    const sqlParams = [schoolId];
    if (userRole === 'teacher') {
        whereClause += ` AND EXISTS (
      SELECT 1 FROM class_subjects cs
      JOIN students s ON s.class_id = cs.class_id
      WHERE s.id = g.student_id AND cs.subject_id = g.subject_id AND cs.teacher_id = $${sqlParams.length + 1}
    )`;
        sqlParams.push(userId);
    }
    else if (userRole === 'student') {
        whereClause += ` AND g.student_id IN (SELECT id FROM students WHERE user_id = $${sqlParams.length + 1} AND school_id = $1)`;
        sqlParams.push(userId);
    }
    else if (userRole === 'parent') {
        whereClause += ` AND g.student_id IN (SELECT sp.student_id FROM student_parents sp WHERE sp.parent_user_id = $${sqlParams.length + 1} AND sp.school_id = $1)`;
        sqlParams.push(userId);
    }
    if (queryParams.studentId) {
        whereClause += ` AND g.student_id = $${sqlParams.length + 1}`;
        sqlParams.push(queryParams.studentId);
    }
    if (queryParams.subjectId) {
        whereClause += ` AND g.subject_id = $${sqlParams.length + 1}`;
        sqlParams.push(queryParams.subjectId);
    }
    if (queryParams.semesterId) {
        whereClause += ` AND g.semester_id = $${sqlParams.length + 1}`;
        sqlParams.push(queryParams.semesterId);
    }
    if (queryParams.gradeLetter) {
        whereClause += ` AND g.grade_letter = $${sqlParams.length + 1}`;
        sqlParams.push(queryParams.gradeLetter);
    }
    const countResult = await (0, connection_1.query)(`SELECT COUNT(*) as total FROM grades g JOIN students s ON g.student_id = s.id ${whereClause}`, sqlParams);
    const total = parseInt(countResult.rows[0].total);
    const result = await (0, connection_1.query)(`SELECT g.*, s.student_id as student_number,
            su.first_name as student_first_name, su.last_name as student_last_name,
            subj.name as subject_name, subj.code as subject_code,
            at.name as assessment_type_name, at.weightage as assessment_weightage,
            sem.name as semester_name, ay.name as academic_year_name,
            ru.first_name as recorded_by_first_name, ru.last_name as recorded_by_last_name
     FROM grades g
     JOIN students s ON g.student_id = s.id
     JOIN users su ON s.user_id = su.id
     JOIN subjects subj ON g.subject_id = subj.id
     JOIN assessment_types at ON g.assessment_type_id = at.id
     JOIN semesters sem ON g.semester_id = sem.id
     JOIN academic_years ay ON sem.academic_year_id = ay.id
     JOIN users ru ON g.recorded_by = ru.id
     ${whereClause}
     ORDER BY g.created_at DESC
     LIMIT $${sqlParams.length + 1} OFFSET $${sqlParams.length + 2}`, [...sqlParams, limit, offset]);
    res.json({
        success: true,
        data: result.rows.map(formatGradeResponse),
        pagination: { page: queryParams.page, limit: queryParams.limit, total, pages: Math.ceil(total / queryParams.limit) }
    });
});
exports.getGradeById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const grade = await getGradeWithRelations(req.params.id, req.schoolId);
    if (!grade)
        throw new errorHandler_1.AppError('Grade not found', 404);
    res.json({ success: true, data: grade });
});
exports.updateGrade = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updateData = grade_1.UpdateGradeSchema.parse(req.body);
    const userId = req.user.id;
    const userRole = req.user.role;
    const schoolId = req.schoolId;
    const existingGrade = await (0, connection_1.query)('SELECT * FROM grades WHERE id = $1 AND school_id = $2', [id, schoolId]);
    if (existingGrade.rows.length === 0)
        throw new errorHandler_1.AppError('Grade not found', 404);
    const grade = existingGrade.rows[0];
    if (userRole === 'teacher') {
        const authCheck = await (0, connection_1.query)(`SELECT 1 FROM class_subjects cs JOIN students s ON s.class_id = cs.class_id
       WHERE s.id = $1 AND cs.subject_id = $2 AND cs.teacher_id = $3`, [grade.student_id, grade.subject_id, userId]);
        if (authCheck.rows.length === 0)
            throw new errorHandler_1.AppError('You are not authorized to update this grade', 403);
    }
    else if (userRole !== 'admin') {
        throw new errorHandler_1.AppError('Only teachers and admins can update grades', 403);
    }
    const marksObtained = updateData.marksObtained ?? grade.marks_obtained;
    const totalMarks = updateData.totalMarks ?? grade.total_marks;
    const remarks = updateData.remarks !== undefined ? updateData.remarks : grade.remarks;
    await (0, connection_1.query)('UPDATE grades SET marks_obtained = $1, total_marks = $2, remarks = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 AND school_id = $5', [marksObtained, totalMarks, remarks, id, schoolId]);
    const updatedGrade = await getGradeWithRelations(id, schoolId);
    res.json({ success: true, data: updatedGrade, message: 'Grade updated successfully' });
});
exports.deleteGrade = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const schoolId = req.schoolId;
    const existingGrade = await (0, connection_1.query)('SELECT * FROM grades WHERE id = $1 AND school_id = $2', [id, schoolId]);
    if (existingGrade.rows.length === 0)
        throw new errorHandler_1.AppError('Grade not found', 404);
    const grade = existingGrade.rows[0];
    if (userRole === 'teacher') {
        const authCheck = await (0, connection_1.query)(`SELECT 1 FROM class_subjects cs JOIN students s ON s.class_id = cs.class_id
       WHERE s.id = $1 AND cs.subject_id = $2 AND cs.teacher_id = $3`, [grade.student_id, grade.subject_id, userId]);
        if (authCheck.rows.length === 0)
            throw new errorHandler_1.AppError('You are not authorized to delete this grade', 403);
    }
    else if (userRole !== 'admin') {
        throw new errorHandler_1.AppError('Only teachers and admins can delete grades', 403);
    }
    await (0, connection_1.query)('DELETE FROM grades WHERE id = $1 AND school_id = $2', [id, schoolId]);
    res.json({ success: true, message: 'Grade deleted successfully' });
});
exports.getStudentGrades = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { studentId } = req.params;
    const schoolId = req.schoolId;
    const { semesterId, subjectId } = req.query;
    let whereClause = 'WHERE g.school_id = $1 AND g.student_id = $2';
    const sqlParams = [schoolId, studentId];
    if (semesterId) {
        whereClause += ` AND g.semester_id = $${sqlParams.length + 1}`;
        sqlParams.push(semesterId);
    }
    if (subjectId) {
        whereClause += ` AND g.subject_id = $${sqlParams.length + 1}`;
        sqlParams.push(subjectId);
    }
    const result = await (0, connection_1.query)(`SELECT g.*, s.student_id as student_number,
            su.first_name as student_first_name, su.last_name as student_last_name,
            subj.name as subject_name, subj.code as subject_code,
            at.name as assessment_type_name, at.weightage as assessment_weightage,
            sem.name as semester_name, ay.name as academic_year_name,
            ru.first_name as recorded_by_first_name, ru.last_name as recorded_by_last_name
     FROM grades g
     JOIN students s ON g.student_id = s.id
     JOIN users su ON s.user_id = su.id
     JOIN subjects subj ON g.subject_id = subj.id
     JOIN assessment_types at ON g.assessment_type_id = at.id
     JOIN semesters sem ON g.semester_id = sem.id
     JOIN academic_years ay ON sem.academic_year_id = ay.id
     JOIN users ru ON g.recorded_by = ru.id
     ${whereClause}
     ORDER BY g.created_at DESC`, sqlParams);
    res.json({ success: true, data: result.rows.map(formatGradeResponse) });
});
exports.getClassGrades = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { classId } = req.params;
    const schoolId = req.schoolId;
    const { semesterId, subjectId, assessmentTypeId } = req.query;
    let whereClause = 'WHERE g.school_id = $1 AND s.class_id = $2';
    const sqlParams = [schoolId, classId];
    if (semesterId) {
        whereClause += ` AND g.semester_id = $${sqlParams.length + 1}`;
        sqlParams.push(semesterId);
    }
    if (subjectId) {
        whereClause += ` AND g.subject_id = $${sqlParams.length + 1}`;
        sqlParams.push(subjectId);
    }
    if (assessmentTypeId) {
        whereClause += ` AND g.assessment_type_id = $${sqlParams.length + 1}`;
        sqlParams.push(assessmentTypeId);
    }
    const result = await (0, connection_1.query)(`SELECT g.*, s.student_id as student_number,
            su.first_name as student_first_name, su.last_name as student_last_name,
            subj.name as subject_name, subj.code as subject_code,
            at.name as assessment_type_name, at.weightage as assessment_weightage,
            sem.name as semester_name, ay.name as academic_year_name,
            ru.first_name as recorded_by_first_name, ru.last_name as recorded_by_last_name
     FROM grades g
     JOIN students s ON g.student_id = s.id
     JOIN users su ON s.user_id = su.id
     JOIN subjects subj ON g.subject_id = subj.id
     JOIN assessment_types at ON g.assessment_type_id = at.id
     JOIN semesters sem ON g.semester_id = sem.id
     JOIN academic_years ay ON sem.academic_year_id = ay.id
     JOIN users ru ON g.recorded_by = ru.id
     ${whereClause}
     ORDER BY su.last_name, su.first_name, g.created_at DESC`, sqlParams);
    res.json({ success: true, data: result.rows.map(formatGradeResponse) });
});
exports.getGradeStats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const schoolId = req.schoolId;
    const { classId, subjectId, semesterId } = req.query;
    let whereClause = 'WHERE g.school_id = $1';
    const sqlParams = [schoolId];
    if (classId) {
        whereClause += ` AND s.class_id = $${sqlParams.length + 1}`;
        sqlParams.push(classId);
    }
    if (subjectId) {
        whereClause += ` AND g.subject_id = $${sqlParams.length + 1}`;
        sqlParams.push(subjectId);
    }
    if (semesterId) {
        whereClause += ` AND g.semester_id = $${sqlParams.length + 1}`;
        sqlParams.push(semesterId);
    }
    const [summaryRes, distributionRes] = await Promise.all([
        (0, connection_1.query)(`SELECT
         COUNT(*) AS total,
         AVG(g.percentage) AS avg_percentage,
         MAX(g.percentage) AS max_percentage,
         MIN(g.percentage) AS min_percentage,
         COUNT(*) FILTER (WHERE g.percentage >= 50) AS passing,
         COUNT(*) FILTER (WHERE g.percentage < 50)  AS failing
       FROM grades g
       JOIN students s ON g.student_id = s.id
       ${whereClause}`, sqlParams),
        (0, connection_1.query)(`SELECT g.grade_letter, COUNT(*) AS count
       FROM grades g
       JOIN students s ON g.student_id = s.id
       ${whereClause}
       GROUP BY g.grade_letter
       ORDER BY g.grade_letter`, sqlParams),
    ]);
    const s = summaryRes.rows[0];
    const total = parseInt(s.total, 10);
    res.json({
        success: true,
        data: {
            total,
            avgPercentage: total > 0 ? Math.round(parseFloat(s.avg_percentage) * 100) / 100 : 0,
            maxPercentage: total > 0 ? parseFloat(s.max_percentage) : 0,
            minPercentage: total > 0 ? parseFloat(s.min_percentage) : 0,
            passing: parseInt(s.passing, 10),
            failing: parseInt(s.failing, 10),
            passRate: total > 0 ? Math.round((parseInt(s.passing, 10) / total) * 100) : 0,
            byGradeLetter: distributionRes.rows.map((r) => ({
                grade: r.grade_letter,
                count: parseInt(r.count, 10),
            })),
        },
    });
});
exports.bulkCreateGrades = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { grades } = req.body;
    if (!Array.isArray(grades) || grades.length === 0) {
        res.status(400).json({ success: false, message: 'grades array is required and must not be empty' });
        return;
    }
    const userId = req.user.id;
    const schoolId = req.schoolId;
    const results = [];
    for (const g of grades) {
        const row = await (0, connection_1.query)(`INSERT INTO grades
         (student_id, subject_id, assessment_type_id, marks_obtained,
          total_marks, semester_id, recorded_by, remarks, school_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT ON CONSTRAINT unique_grade_per_school
       DO UPDATE SET marks_obtained=$4, total_marks=$5,
                     remarks=$8, updated_at=CURRENT_TIMESTAMP
       RETURNING id`, [g.studentId, g.subjectId, g.assessmentTypeId, g.marksObtained, g.totalMarks,
            g.semesterId, userId, g.remarks || null, schoolId]);
        results.push(row.rows[0].id);
    }
    res.status(201).json({
        success: true,
        message: `${results.length} grade(s) saved successfully`,
        data: { savedIds: results },
    });
});
async function getGradeWithRelations(gradeId, schoolId) {
    const result = await (0, connection_1.query)(`SELECT g.*, s.student_id as student_number,
            su.first_name as student_first_name, su.last_name as student_last_name,
            subj.name as subject_name, subj.code as subject_code,
            at.name as assessment_type_name, at.weightage as assessment_weightage,
            sem.name as semester_name, ay.name as academic_year_name,
            ru.first_name as recorded_by_first_name, ru.last_name as recorded_by_last_name
     FROM grades g
     JOIN students s ON g.student_id = s.id
     JOIN users su ON s.user_id = su.id
     JOIN subjects subj ON g.subject_id = subj.id
     JOIN assessment_types at ON g.assessment_type_id = at.id
     JOIN semesters sem ON g.semester_id = sem.id
     JOIN academic_years ay ON sem.academic_year_id = ay.id
     JOIN users ru ON g.recorded_by = ru.id
     WHERE g.id = $1 AND g.school_id = $2`, [gradeId, schoolId]);
    if (result.rows.length === 0)
        return null;
    return formatGradeResponse(result.rows[0]);
}
function formatGradeResponse(row) {
    return {
        id: row.id.toString(), altId: null,
        studentId: row.student_id.toString(),
        subjectId: row.subject_id.toString(),
        assessmentTypeId: row.assessment_type_id.toString(),
        marksObtained: parseFloat(row.marks_obtained),
        totalMarks: parseFloat(row.total_marks),
        percentage: parseFloat(row.percentage),
        gradeLetter: row.grade_letter,
        semesterId: row.semester_id.toString(),
        recordedBy: row.recorded_by.toString(),
        remarks: row.remarks,
        createdAt: new Date(row.created_at).toISOString(),
        updatedAt: new Date(row.updated_at).toISOString(),
        student: { studentId: row.student_number, user: { firstName: row.student_first_name, lastName: row.student_last_name } },
        subject: { name: row.subject_name, code: row.subject_code },
        assessmentType: { name: row.assessment_type_name, weightage: parseFloat(row.assessment_weightage) },
        semester: { name: row.semester_name, academicYear: { name: row.academic_year_name } },
        recordedByUser: { firstName: row.recorded_by_first_name, lastName: row.recorded_by_last_name },
    };
}
//# sourceMappingURL=gradeController.js.map