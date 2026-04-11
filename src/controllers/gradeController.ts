import { Request, Response } from 'express';
import { query } from '../database/connection';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import {
  CreateGradeSchema,
  UpdateGradeSchema,
  GradeQuerySchema,
  GradeResponse,
  GradeLetter
} from '../types/grade';
import { getPaginationParams } from '../utils/pagination';

function calculateGradeLetter(percentage: number): GradeLetter {
  if (percentage >= 95) return 'A+';
  if (percentage >= 90) return 'A';
  if (percentage >= 85) return 'B+';
  if (percentage >= 80) return 'B';
  if (percentage >= 75) return 'C+';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
}

export const createGrade = asyncHandler(async (req: Request, res: Response) => {
  const gradeData = CreateGradeSchema.parse(req.body);
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const schoolId = req.schoolId!;

  if (userRole === 'teacher') {
    const authCheck = await query(
      `SELECT 1 FROM class_subjects cs
       JOIN students s ON s.class_id = cs.class_id AND s.school_id = $4
       WHERE s.id = $1 AND cs.subject_id = $2 AND cs.teacher_id = $3`,
      [gradeData.studentId, gradeData.subjectId, userId, schoolId]
    );
    if (authCheck.rows.length === 0) {
      throw new AppError('You are not authorized to enter grades for this student and subject', 403);
    }
  }

  const studentCheck = await query(
    'SELECT id FROM students WHERE id = $1 AND school_id = $2 AND is_active = true',
    [gradeData.studentId, schoolId]
  );
  if (studentCheck.rows.length === 0) throw new AppError('Student not found or inactive', 404);

  const subjectCheck = await query(
    'SELECT id FROM subjects WHERE id = $1 AND school_id = $2 AND is_active = true',
    [gradeData.subjectId, schoolId]
  );
  if (subjectCheck.rows.length === 0) throw new AppError('Subject not found or inactive', 404);

  const assessmentCheck = await query(
    'SELECT id FROM assessment_types WHERE id = $1 AND school_id = $2 AND is_active = true',
    [gradeData.assessmentTypeId, schoolId]
  );
  if (assessmentCheck.rows.length === 0) throw new AppError('Assessment type not found or inactive', 404);

  const semesterCheck = await query(
    'SELECT id FROM semesters WHERE id = $1 AND school_id = $2 AND is_active = true',
    [gradeData.semesterId, schoolId]
  );
  if (semesterCheck.rows.length === 0) throw new AppError('Semester not found or inactive', 404);

  const duplicateCheck = await query(
    'SELECT id FROM grades WHERE student_id = $1 AND subject_id = $2 AND assessment_type_id = $3 AND semester_id = $4 AND school_id = $5',
    [gradeData.studentId, gradeData.subjectId, gradeData.assessmentTypeId, gradeData.semesterId, schoolId]
  );
  if (duplicateCheck.rows.length > 0) {
    throw new AppError('Grade already exists for this student, subject, assessment type, and semester', 409);
  }

  const percentage = Math.round((gradeData.marksObtained / gradeData.totalMarks) * 100 * 100) / 100;
  const gradeLetter = calculateGradeLetter(percentage);

  const result = await query(
    `INSERT INTO grades
       (student_id, subject_id, assessment_type_id, marks_obtained,
        total_marks, percentage, grade_letter, semester_id, recorded_by, remarks, school_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      gradeData.studentId, gradeData.subjectId, gradeData.assessmentTypeId,
      gradeData.marksObtained, gradeData.totalMarks, percentage, gradeLetter,
      gradeData.semesterId, userId, gradeData.remarks || null, schoolId,
    ]
  );

  const gradeWithRelations = await getGradeWithRelations(result.rows[0].id, schoolId);
  res.status(201).json({ success: true, data: gradeWithRelations, message: 'Grade created successfully' });
});

export const getGrades = asyncHandler(async (req: Request, res: Response) => {
  const queryParams = GradeQuerySchema.parse(req.query);
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const schoolId = req.schoolId!;
  const { offset, limit } = getPaginationParams(req);

  let whereClause = 'WHERE g.school_id = $1';
  const sqlParams: any[] = [schoolId];

  if (userRole === 'teacher') {
    whereClause += ` AND EXISTS (
      SELECT 1 FROM class_subjects cs
      JOIN students s ON s.class_id = cs.class_id
      WHERE s.id = g.student_id AND cs.subject_id = g.subject_id AND cs.teacher_id = $${sqlParams.length + 1}
    )`;
    sqlParams.push(userId);
  } else if (userRole === 'student') {
    whereClause += ` AND g.student_id IN (SELECT id FROM students WHERE user_id = $${sqlParams.length + 1} AND school_id = $1)`;
    sqlParams.push(userId);
  } else if (userRole === 'parent') {
    whereClause += ` AND g.student_id IN (SELECT sp.student_id FROM student_parents sp WHERE sp.parent_user_id = $${sqlParams.length + 1} AND sp.school_id = $1)`;
    sqlParams.push(userId);
  }

  if (queryParams.studentId) { whereClause += ` AND g.student_id = $${sqlParams.length + 1}`; sqlParams.push(queryParams.studentId); }
  if (queryParams.subjectId) { whereClause += ` AND g.subject_id = $${sqlParams.length + 1}`; sqlParams.push(queryParams.subjectId); }
  if (queryParams.semesterId) { whereClause += ` AND g.semester_id = $${sqlParams.length + 1}`; sqlParams.push(queryParams.semesterId); }
  if (queryParams.gradeLetter) { whereClause += ` AND g.grade_letter = $${sqlParams.length + 1}`; sqlParams.push(queryParams.gradeLetter); }

  const countResult = await query(
    `SELECT COUNT(*) as total FROM grades g JOIN students s ON g.student_id = s.id ${whereClause}`,
    sqlParams
  );
  const total = parseInt(countResult.rows[0].total);

  const result = await query(
    `SELECT g.*, s.student_id as student_number,
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
     LIMIT $${sqlParams.length + 1} OFFSET $${sqlParams.length + 2}`,
    [...sqlParams, limit, offset]
  );

  res.json({
    success: true,
    data: result.rows.map(formatGradeResponse),
    pagination: { page: queryParams.page, limit: queryParams.limit, total, pages: Math.ceil(total / queryParams.limit) }
  });
});

export const getGradeById = asyncHandler(async (req: Request, res: Response) => {
  const grade = await getGradeWithRelations(req.params.id, req.schoolId!);
  if (!grade) throw new AppError('Grade not found', 404);
  res.json({ success: true, data: grade });
});

export const updateGrade = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = UpdateGradeSchema.parse(req.body);
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const schoolId = req.schoolId!;

  const existingGrade = await query('SELECT * FROM grades WHERE id = $1 AND school_id = $2', [id, schoolId]);
  if (existingGrade.rows.length === 0) throw new AppError('Grade not found', 404);
  const grade = existingGrade.rows[0];

  if (userRole === 'teacher') {
    const authCheck = await query(
      `SELECT 1 FROM class_subjects cs JOIN students s ON s.class_id = cs.class_id
       WHERE s.id = $1 AND cs.subject_id = $2 AND cs.teacher_id = $3`,
      [grade.student_id, grade.subject_id, userId]
    );
    if (authCheck.rows.length === 0) throw new AppError('You are not authorized to update this grade', 403);
  } else if (userRole !== 'admin') {
    throw new AppError('Only teachers and admins can update grades', 403);
  }

  const marksObtained = updateData.marksObtained ?? grade.marks_obtained;
  const totalMarks = updateData.totalMarks ?? grade.total_marks;
  const remarks = updateData.remarks !== undefined ? updateData.remarks : grade.remarks;
  const percentage = Math.round((marksObtained / totalMarks) * 100 * 100) / 100;
  const gradeLetter = calculateGradeLetter(percentage);

  await query(
    'UPDATE grades SET marks_obtained = $1, total_marks = $2, percentage = $3, grade_letter = $4, remarks = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 AND school_id = $7',
    [marksObtained, totalMarks, percentage, gradeLetter, remarks, id, schoolId]
  );

  const updatedGrade = await getGradeWithRelations(id, schoolId);
  res.json({ success: true, data: updatedGrade, message: 'Grade updated successfully' });
});

export const deleteGrade = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const schoolId = req.schoolId!;

  const existingGrade = await query('SELECT * FROM grades WHERE id = $1 AND school_id = $2', [id, schoolId]);
  if (existingGrade.rows.length === 0) throw new AppError('Grade not found', 404);
  const grade = existingGrade.rows[0];

  if (userRole === 'teacher') {
    const authCheck = await query(
      `SELECT 1 FROM class_subjects cs JOIN students s ON s.class_id = cs.class_id
       WHERE s.id = $1 AND cs.subject_id = $2 AND cs.teacher_id = $3`,
      [grade.student_id, grade.subject_id, userId]
    );
    if (authCheck.rows.length === 0) throw new AppError('You are not authorized to delete this grade', 403);
  } else if (userRole !== 'admin') {
    throw new AppError('Only teachers and admins can delete grades', 403);
  }

  await query('DELETE FROM grades WHERE id = $1 AND school_id = $2', [id, schoolId]);
  res.json({ success: true, message: 'Grade deleted successfully' });
});

async function getGradeWithRelations(gradeId: string | number, schoolId: string): Promise<GradeResponse | null> {
  const result = await query(
    `SELECT g.*, s.student_id as student_number,
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
     WHERE g.id = $1 AND g.school_id = $2`,
    [gradeId, schoolId]
  );
  if (result.rows.length === 0) return null;
  return formatGradeResponse(result.rows[0]);
}

function formatGradeResponse(row: any): GradeResponse {
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
