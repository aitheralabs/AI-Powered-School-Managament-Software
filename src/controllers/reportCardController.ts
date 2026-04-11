import { Request, Response } from 'express';
import { query, getClient } from '../database/connection';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { 
  CreateReportCardSchema,
  UpdateReportCardSchema,
  ReportCardResponse,
  GradeLetter
} from '../types/grade';
import { getPaginationParams } from '../utils/pagination';

// Helper function to calculate grade letter based on percentage
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

// Generate report card for a student
export const generateReportCard = asyncHandler(async (req: Request, res: Response) => {
  const reportCardData = CreateReportCardSchema.parse(req.body);
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const schoolId = req.schoolId!;

  // Validate that student exists and is active
  const studentCheck = await query(
    `SELECT s.id, s.student_id, s.class_id, u.first_name, u.last_name,
            c.name as class_name, c.grade, c.section
     FROM students s
     JOIN users u ON s.user_id = u.id
     JOIN classes c ON s.class_id = c.id
     WHERE s.id = $1 AND s.school_id = $2 AND s.is_active = true`,
    [reportCardData.studentId, schoolId]
  );

  if (studentCheck.rows.length === 0) {
    throw new AppError('Student not found or inactive', 404);
  }

  const student = studentCheck.rows[0];

  // Validate that semester exists and is active
  const semesterCheck = await query(
    `SELECT sem.id, sem.name, ay.name as academic_year_name
     FROM semesters sem
     JOIN academic_years ay ON sem.academic_year_id = ay.id
     WHERE sem.id = $1 AND sem.school_id = $2 AND sem.is_active = true`,
    [reportCardData.semesterId, schoolId]
  );

  if (semesterCheck.rows.length === 0) {
    throw new AppError('Semester not found or inactive', 404);
  }

  const semester = semesterCheck.rows[0];

  // Check if report card already exists for this student and semester
  const existingReportCard = await query(
    'SELECT id FROM report_cards WHERE student_id = $1 AND semester_id = $2 AND school_id = $3',
    [reportCardData.studentId, reportCardData.semesterId, schoolId]
  );

  if (existingReportCard.rows.length > 0) {
    throw new AppError('Report card already exists for this student and semester', 409);
  }

  // Authorization check for teachers
  if (userRole === 'teacher') {
    const authCheck = await query(
      `SELECT 1 FROM class_subjects cs
       WHERE cs.class_id = $1 AND cs.teacher_id = $2`,
      [student.class_id, userId]
    );

    if (authCheck.rows.length === 0) {
      throw new AppError('You are not authorized to generate report cards for this student', 403);
    }
  }

  // Get all grades for the student in this semester
  const gradesResult = await query(
    `SELECT 
       g.id, g.marks_obtained, g.total_marks, g.percentage, g.grade_letter,
       subj.id as subject_id, subj.name as subject_name, subj.code as subject_code,
       at.id as assessment_type_id, at.name as assessment_type_name, at.weightage
     FROM grades g
     JOIN subjects subj ON g.subject_id = subj.id
     JOIN assessment_types at ON g.assessment_type_id = at.id
     WHERE g.student_id = $1 AND g.semester_id = $2
     ORDER BY subj.name, at.name`,
    [reportCardData.studentId, reportCardData.semesterId]
  );

  if (gradesResult.rows.length === 0) {
    throw new AppError('No grades found for this student in the specified semester', 400);
  }

  // Calculate overall performance
  const { overallPercentage, overallGrade, subjectSummaries } = calculateOverallPerformance(gradesResult.rows);

  // Calculate rank in class
  const { rankInClass, totalStudents } = await calculateClassRank(
    reportCardData.studentId, 
    student.class_id, 
    reportCardData.semesterId, 
    overallPercentage
  );

  // Generate sequential ID for report card
  const idResult = await query('SELECT nextval(\'report_cards_id_seq\') as id');
  const sequentialId = idResult.rows[0].id;

  // Insert report card
  const reportCardResult = await query(
    `INSERT INTO report_cards (
       id, student_id, semester_id, overall_percentage, overall_grade,
       rank_in_class, total_students, remarks, generated_by, generated_at, school_id
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, $10)
     RETURNING *`,
    [
      sequentialId,
      reportCardData.studentId,
      reportCardData.semesterId,
      overallPercentage,
      overallGrade,
      rankInClass,
      totalStudents,
      reportCardData.remarks || null,
      userId,
      schoolId
    ]
  );

  // Format and return the complete report card
  const reportCard = await getReportCardWithDetails(reportCardResult.rows[0].id);

  res.status(201).json({
    success: true,
    data: reportCard,
    message: 'Report card generated successfully'
  });
});

// Get report cards with filtering and pagination
export const getReportCards = asyncHandler(async (req: Request, res: Response) => {
  const { studentId, semesterId, classId } = req.query;
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const schoolId = req.schoolId!;
  const { offset, limit } = getPaginationParams(req);

  // Build WHERE clause based on filters and authorization
  let whereClause = 'WHERE rc.school_id = $1';
  const queryParams: any[] = [schoolId];

  // Add authorization filters
  if (userRole === 'teacher') {
    whereClause += ` AND EXISTS (
      SELECT 1 FROM class_subjects cs
      JOIN students s ON s.class_id = cs.class_id
      WHERE s.id = rc.student_id AND cs.teacher_id = $${queryParams.length + 1}
    )`;
    queryParams.push(userId);
  } else if (userRole === 'student') {
    whereClause += ` AND rc.student_id IN (
      SELECT id FROM students WHERE user_id = $${queryParams.length + 1}
    )`;
    queryParams.push(userId);
  } else if (userRole === 'parent') {
    whereClause += ` AND rc.student_id IN (
      SELECT sp.student_id FROM student_parents sp WHERE sp.parent_user_id = $${queryParams.length + 1}
    )`;
    queryParams.push(userId);
  }

  // Add optional filters
  if (studentId) {
    whereClause += ` AND rc.student_id = $${queryParams.length + 1}`;
    queryParams.push(studentId);
  }

  if (semesterId) {
    whereClause += ` AND rc.semester_id = $${queryParams.length + 1}`;
    queryParams.push(semesterId);
  }

  if (classId) {
    whereClause += ` AND s.class_id = $${queryParams.length + 1}`;
    queryParams.push(classId);
  }

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) as total
     FROM report_cards rc
     JOIN students s ON rc.student_id = s.id
     ${whereClause}`,
    queryParams
  );

  const total = parseInt(countResult.rows[0].total);

  // Get report cards with basic info
  const result = await query(
    `SELECT 
       rc.*,
       s.student_id as student_number,
       su.first_name as student_first_name,
       su.last_name as student_last_name,
       c.name as class_name,
       c.grade as class_grade,
       c.section as class_section,
       sem.name as semester_name,
       ay.name as academic_year_name,
       gu.first_name as generated_by_first_name,
       gu.last_name as generated_by_last_name
     FROM report_cards rc
     JOIN students s ON rc.student_id = s.id
     JOIN users su ON s.user_id = su.id
     JOIN classes c ON s.class_id = c.id
     JOIN semesters sem ON rc.semester_id = sem.id
     JOIN academic_years ay ON sem.academic_year_id = ay.id
     JOIN users gu ON rc.generated_by = gu.id
     ${whereClause}
     ORDER BY rc.generated_at DESC
     LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
    [...queryParams, limit, offset]
  );

  const reportCards = result.rows.map(formatReportCardResponse);

  res.json({
    success: true,
    data: reportCards,
    pagination: {
      page: Math.floor(offset / limit) + 1,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// Get single report card by ID with full details
export const getReportCardById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  const reportCard = await getReportCardWithDetails(parseInt(id));

  if (!reportCard) {
    throw new AppError('Report card not found', 404);
  }

  // Check authorization
  if (userRole === 'teacher') {
    const authCheck = await query(
      `SELECT 1 FROM class_subjects cs
       JOIN students s ON s.class_id = cs.class_id
       WHERE s.id = $1 AND cs.teacher_id = $2`,
      [reportCard.studentId, userId]
    );

    if (authCheck.rows.length === 0) {
      throw new AppError('You are not authorized to view this report card', 403);
    }
  } else if (userRole === 'student') {
    const studentCheck = await query(
      'SELECT 1 FROM students WHERE id = $1 AND user_id = $2',
      [reportCard.studentId, userId]
    );

    if (studentCheck.rows.length === 0) {
      throw new AppError('You can only view your own report cards', 403);
    }
  } else if (userRole === 'parent') {
    const parentCheck = await query(
      'SELECT 1 FROM student_parents WHERE student_id = $1 AND parent_user_id = $2',
      [reportCard.studentId, userId]
    );

    if (parentCheck.rows.length === 0) {
      throw new AppError('You can only view your child\'s report cards', 403);
    }
  }

  res.json({
    success: true,
    data: reportCard
  });
});

// Update report card remarks
export const updateReportCard = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = UpdateReportCardSchema.parse(req.body);
  const userId = req.user!.id;
  const userRole = req.user!.role;

  // Get existing report card
  const existingReportCard = await query('SELECT * FROM report_cards WHERE id = $1', [id]);

  if (existingReportCard.rows.length === 0) {
    throw new AppError('Report card not found', 404);
  }

  const reportCard = existingReportCard.rows[0];

  // Check authorization
  if (userRole === 'teacher') {
    const authCheck = await query(
      `SELECT 1 FROM class_subjects cs
       JOIN students s ON s.class_id = cs.class_id
       WHERE s.id = $1 AND cs.teacher_id = $2`,
      [reportCard.student_id, userId]
    );

    if (authCheck.rows.length === 0) {
      throw new AppError('You are not authorized to update this report card', 403);
    }
  } else if (userRole !== 'admin') {
    throw new AppError('Only teachers and admins can update report cards', 403);
  }

  // Update report card
  const result = await query(
    `UPDATE report_cards 
     SET remarks = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [updateData.remarks || null, id]
  );

  // Fetch updated report card with details
  const updatedReportCard = await getReportCardWithDetails(parseInt(id));

  res.json({
    success: true,
    data: updatedReportCard,
    message: 'Report card updated successfully'
  });
});

// Delete report card
export const deleteReportCard = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  // Get existing report card
  const existingReportCard = await query('SELECT * FROM report_cards WHERE id = $1', [id]);

  if (existingReportCard.rows.length === 0) {
    throw new AppError('Report card not found', 404);
  }

  const reportCard = existingReportCard.rows[0];

  // Check authorization (only admin can delete report cards)
  if (userRole !== 'admin') {
    throw new AppError('Only administrators can delete report cards', 403);
  }

  // Delete report card
  await query('DELETE FROM report_cards WHERE id = $1', [id]);

  res.json({
    success: true,
    message: 'Report card deleted successfully'
  });
});

// Regenerate report card (recalculate based on current grades)
export const regenerateReportCard = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  // Get existing report card
  const existingReportCard = await query('SELECT * FROM report_cards WHERE id = $1', [id]);

  if (existingReportCard.rows.length === 0) {
    throw new AppError('Report card not found', 404);
  }

  const reportCard = existingReportCard.rows[0];

  // Check authorization
  if (userRole === 'teacher') {
    const authCheck = await query(
      `SELECT 1 FROM class_subjects cs
       JOIN students s ON s.class_id = cs.class_id
       WHERE s.id = $1 AND cs.teacher_id = $2`,
      [reportCard.student_id, userId]
    );

    if (authCheck.rows.length === 0) {
      throw new AppError('You are not authorized to regenerate this report card', 403);
    }
  } else if (userRole !== 'admin') {
    throw new AppError('Only teachers and admins can regenerate report cards', 403);
  }

  // Get current grades for recalculation
  const gradesResult = await query(
    `SELECT 
       g.id, g.marks_obtained, g.total_marks, g.percentage, g.grade_letter,
       subj.id as subject_id, subj.name as subject_name, subj.code as subject_code,
       at.id as assessment_type_id, at.name as assessment_type_name, at.weightage
     FROM grades g
     JOIN subjects subj ON g.subject_id = subj.id
     JOIN assessment_types at ON g.assessment_type_id = at.id
     WHERE g.student_id = $1 AND g.semester_id = $2
     ORDER BY subj.name, at.name`,
    [reportCard.student_id, reportCard.semester_id]
  );

  if (gradesResult.rows.length === 0) {
    throw new AppError('No grades found for recalculation', 400);
  }

  // Recalculate overall performance
  const { overallPercentage, overallGrade } = calculateOverallPerformance(gradesResult.rows);

  // Get student's class for rank calculation
  const studentResult = await query('SELECT class_id FROM students WHERE id = $1', [reportCard.student_id]);
  const classId = studentResult.rows[0].class_id;

  // Recalculate rank in class
  const { rankInClass, totalStudents } = await calculateClassRank(
    reportCard.student_id, 
    classId, 
    reportCard.semester_id, 
    overallPercentage
  );

  // Update report card with new calculations
  const result = await query(
    `UPDATE report_cards 
     SET overall_percentage = $1, overall_grade = $2, rank_in_class = $3, 
         total_students = $4, updated_at = CURRENT_TIMESTAMP
     WHERE id = $5
     RETURNING *`,
    [overallPercentage, overallGrade, rankInClass, totalStudents, id]
  );

  // Fetch updated report card with details
  const updatedReportCard = await getReportCardWithDetails(parseInt(id));

  res.json({
    success: true,
    data: updatedReportCard,
    message: 'Report card regenerated successfully'
  });
});

// Helper function to calculate overall performance from grades
function calculateOverallPerformance(grades: any[]): { overallPercentage: number; overallGrade: GradeLetter; subjectSummaries: any[] } {
  // Group grades by subject
  const subjectGroups = grades.reduce((acc: any, grade) => {
    const subjectId = grade.subject_id;
    if (!acc[subjectId]) {
      acc[subjectId] = {
        subjectId,
        subjectName: grade.subject_name,
        subjectCode: grade.subject_code,
        assessments: []
      };
    }
    acc[subjectId].assessments.push({
      assessmentTypeId: grade.assessment_type_id,
      assessmentTypeName: grade.assessment_type_name,
      weightage: parseFloat(grade.weightage),
      marksObtained: parseFloat(grade.marks_obtained),
      totalMarks: parseFloat(grade.total_marks),
      percentage: parseFloat(grade.percentage),
      gradeLetter: grade.grade_letter
    });
    return acc;
  }, {});

  // Calculate weighted average for each subject
  const subjectSummaries = Object.values(subjectGroups).map((subject: any) => {
    const totalWeightage = subject.assessments.reduce((sum: number, assessment: any) => sum + assessment.weightage, 0);
    
    let weightedSum = 0;
    if (totalWeightage > 0) {
      weightedSum = subject.assessments.reduce((sum: number, assessment: any) => {
        return sum + (assessment.percentage * assessment.weightage / totalWeightage);
      }, 0);
    } else {
      // If no weightage defined, use simple average
      weightedSum = subject.assessments.reduce((sum: number, assessment: any) => sum + assessment.percentage, 0) / subject.assessments.length;
    }

    const subjectPercentage = Math.round(weightedSum * 100) / 100;
    const subjectGrade = calculateGradeLetter(subjectPercentage);

    return {
      ...subject,
      subjectPercentage,
      subjectGrade
    };
  });

  // Calculate overall percentage (average of all subjects)
  const overallPercentage = Math.round(
    (subjectSummaries.reduce((sum: number, subject: any) => sum + subject.subjectPercentage, 0) / subjectSummaries.length) * 100
  ) / 100;

  const overallGrade = calculateGradeLetter(overallPercentage);

  return { overallPercentage, overallGrade, subjectSummaries };
}

// Helper function to calculate class rank
async function calculateClassRank(studentId: string, classId: string, semesterId: string, studentPercentage: number): Promise<{ rankInClass: number; totalStudents: number }> {
  // Get all students in the class with their overall percentages for this semester
  const classPerformanceResult = await query(
    `SELECT rc.student_id, rc.overall_percentage
     FROM report_cards rc
     JOIN students s ON rc.student_id = s.id
     WHERE s.class_id = $1 AND rc.semester_id = $2
     ORDER BY rc.overall_percentage DESC`,
    [classId, semesterId]
  );

  const totalStudents = classPerformanceResult.rows.length;
  
  if (totalStudents === 0) {
    return { rankInClass: 1, totalStudents: 1 };
  }

  // Find rank by counting students with higher percentages
  const higherPerformers = classPerformanceResult.rows.filter(
    (row: any) => parseFloat(row.overall_percentage) > studentPercentage
  );

  const rankInClass = higherPerformers.length + 1;

  return { rankInClass, totalStudents };
}

// Helper function to get report card with all details
async function getReportCardWithDetails(reportCardId: number): Promise<ReportCardResponse | null> {
  const result = await query(
    `SELECT 
       rc.*,
       s.student_id as student_number,
       su.first_name as student_first_name,
       su.last_name as student_last_name,
       c.name as class_name,
       c.grade as class_grade,
       c.section as class_section,
       sem.name as semester_name,
       ay.name as academic_year_name,
       gu.first_name as generated_by_first_name,
       gu.last_name as generated_by_last_name
     FROM report_cards rc
     JOIN students s ON rc.student_id = s.id
     JOIN users su ON s.user_id = su.id
     JOIN classes c ON s.class_id = c.id
     JOIN semesters sem ON rc.semester_id = sem.id
     JOIN academic_years ay ON sem.academic_year_id = ay.id
     JOIN users gu ON rc.generated_by = gu.id
     WHERE rc.id = $1`,
    [reportCardId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const reportCard = result.rows[0];

  // Get detailed grades for this report card
  const gradesResult = await query(
    `SELECT 
       subj.name as subject_name,
       subj.code as subject_code,
       at.name as assessment_type_name,
       g.marks_obtained,
       g.total_marks,
       g.percentage,
       g.grade_letter
     FROM grades g
     JOIN subjects subj ON g.subject_id = subj.id
     JOIN assessment_types at ON g.assessment_type_id = at.id
     WHERE g.student_id = $1 AND g.semester_id = $2
     ORDER BY subj.name, at.name`,
    [reportCard.student_id, reportCard.semester_id]
  );

  const grades = gradesResult.rows.map((row: any) => ({
    subject: {
      name: row.subject_name,
      code: row.subject_code,
    },
    assessmentType: {
      name: row.assessment_type_name,
    },
    marksObtained: parseFloat(row.marks_obtained),
    totalMarks: parseFloat(row.total_marks),
    percentage: parseFloat(row.percentage),
    gradeLetter: row.grade_letter,
  }));

  return formatReportCardResponse(reportCard, grades);
}

// Helper function to format report card response
function formatReportCardResponse(row: any, grades?: any[]): ReportCardResponse {
  return {
    id: row.id.toString(),
    altId: null,
    studentId: row.student_id.toString(),
    semesterId: row.semester_id.toString(),
    overallPercentage: row.overall_percentage ? parseFloat(row.overall_percentage) : null,
    overallGrade: row.overall_grade,
    rankInClass: row.rank_in_class ? parseInt(row.rank_in_class) : null,
    totalStudents: row.total_students ? parseInt(row.total_students) : null,
    remarks: row.remarks,
    generatedBy: row.generated_by.toString(),
    generatedAt: row.generated_at.toISOString(),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    student: {
      studentId: row.student_number,
      user: {
        firstName: row.student_first_name,
        lastName: row.student_last_name,
      },
      class: {
        name: row.class_name,
        grade: row.class_grade,
        section: row.class_section,
      },
    },
    semester: {
      name: row.semester_name,
      academicYear: {
        name: row.academic_year_name,
      },
    },
    grades: grades || undefined,
  };
}