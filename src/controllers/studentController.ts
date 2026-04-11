import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { StudentService } from '../services/studentService';
import { query } from '../database/connection';

const studentService = new StudentService();

export const createStudent = asyncHandler(async (req: Request, res: Response) => {
  const student = await studentService.forSchool(req.schoolId!).createStudent(req.body);
  res.status(201).json({ success: true, message: 'Student created successfully', data: student });
});

export const getStudents = asyncHandler(async (req: Request, res: Response) => {
  const result = await studentService.forSchool(req.schoolId!).getStudents(req);
  res.json({ success: true, data: result.students, pagination: result.pagination });
});

export const getStudentById = asyncHandler(async (req: Request, res: Response) => {
  const student = await studentService.forSchool(req.schoolId!).getStudentById(req.params.id);
  res.json({ success: true, data: student });
});

export const updateStudent = asyncHandler(async (req: Request, res: Response) => {
  const student = await studentService.forSchool(req.schoolId!).updateStudent(req.params.id, req.body);
  res.json({ success: true, message: 'Student updated successfully', data: student });
});

export const deleteStudent = asyncHandler(async (req: Request, res: Response) => {
  await studentService.forSchool(req.schoolId!).deleteStudent(req.params.id);
  res.json({ success: true, message: 'Student deactivated successfully' });
});

export const getStudentSummary = asyncHandler(async (req: Request, res: Response) => {
  const summary = await studentService.forSchool(req.schoolId!).getStudentSummary(req.params.id);
  res.json({ success: true, data: summary });
});

export const getStudentClassHistory = asyncHandler(async (req: Request, res: Response) => {
  const history = await studentService.forSchool(req.schoolId!).getStudentClassHistory(req.params.id);
  res.json({ success: true, data: history });
});

export const getStudentsByClass = asyncHandler(async (req: Request, res: Response) => {
  const { classId } = req.params;
  const { page = '1', limit = '50' } = req.query;
  const result = await studentService.forSchool(req.schoolId!).getStudentsByClass(classId, {
    page: parseInt(page as string),
    limit: parseInt(limit as string),
  });
  res.json({ success: true, data: result.students, pagination: result.pagination });
});

export const bulkUpdateStudents = asyncHandler(async (req: Request, res: Response) => {
  const { studentIds, updateData } = req.body;
  const result = await studentService.forSchool(req.schoolId!).bulkUpdateStudents(studentIds, updateData);
  res.json({ success: true, message: `Successfully updated ${result.updatedCount} students`, data: result });
});

export const getStudentStats = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = req.schoolId!;
  const [totalRes, newRes, genderRes, classRes] = await Promise.all([
    query(
      `SELECT COUNT(*) AS total,
              COUNT(*) FILTER (WHERE is_active = true) AS active,
              COUNT(*) FILTER (WHERE is_active = false) AS inactive
       FROM students WHERE school_id = $1`,
      [schoolId]
    ),
    query(
      `SELECT COUNT(*) AS count FROM students
       WHERE school_id = $1 AND created_at >= NOW() - INTERVAL '30 days' AND is_active = true`,
      [schoolId]
    ),
    query(
      `SELECT gender, COUNT(*) AS count FROM students WHERE school_id = $1 AND is_active = true GROUP BY gender`,
      [schoolId]
    ),
    query(
      `SELECT c.name, COUNT(s.id) AS count FROM students s
       JOIN classes c ON c.id = s.class_id
       WHERE s.school_id = $1 AND s.is_active = true
       GROUP BY c.name ORDER BY count DESC LIMIT 5`,
      [schoolId]
    ),
  ]);

  const genderMap: Record<string, number> = {};
  for (const row of genderRes.rows) {
    genderMap[row.gender || 'unspecified'] = parseInt(row.count, 10);
  }

  res.json({
    success: true,
    data: {
      total: parseInt(totalRes.rows[0].total, 10),
      active: parseInt(totalRes.rows[0].active, 10),
      inactive: parseInt(totalRes.rows[0].inactive, 10),
      newThisMonth: parseInt(newRes.rows[0].count, 10),
      byGender: genderMap,
      byClass: classRes.rows.map((r: any) => ({ class: r.name, count: parseInt(r.count, 10) })),
    },
  });
});
