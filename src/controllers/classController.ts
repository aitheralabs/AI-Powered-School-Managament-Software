/**
 * Class Controller — tenant-scoped via forSchool()
 */
import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { ClassService } from '../services/classService';
import { query } from '../database/connection';

const classService = new ClassService();

export const createClass = asyncHandler(async (req: Request, res: Response) => {
  const classInfo = await classService.forSchool(req.schoolId!).createClass(req.body);
  res.status(201).json({ success: true, message: 'Class created successfully', data: { class: classInfo } });
});

export const getClasses = asyncHandler(async (req: Request, res: Response) => {
  const result = await classService.forSchool(req.schoolId!).getClasses(req);
  res.json({ success: true, data: { classes: result.items, pagination: result.pagination } });
});

export const getClassById = asyncHandler(async (req: Request, res: Response) => {
  const classInfo = await classService.forSchool(req.schoolId!).getClassById(req.params.id);
  res.json({ success: true, data: { class: classInfo } });
});

export const updateClass = asyncHandler(async (req: Request, res: Response) => {
  const classInfo = await classService.forSchool(req.schoolId!).updateClass(req.params.id, req.body);
  res.json({ success: true, message: 'Class updated successfully', data: { class: classInfo } });
});

export const deleteClass = asyncHandler(async (req: Request, res: Response) => {
  await classService.forSchool(req.schoolId!).deleteClass(req.params.id);
  res.json({ success: true, message: 'Class deleted successfully' });
});

// Methods below delegate to service methods that still accept schoolId via forSchool
export const assignSubjectToClass = asyncHandler(async (req: Request, res: Response) => {
  const svc = classService.forSchool(req.schoolId!) as any;
  const result = await svc.assignSubjectToClass(req.params.id, req.body.subjectId, req.body.teacherId);
  res.status(201).json({ success: true, message: 'Subject assigned to class successfully', data: result });
});

export const removeSubjectFromClass = asyncHandler(async (req: Request, res: Response) => {
  const svc = classService.forSchool(req.schoolId!) as any;
  await svc.removeSubjectFromClass(req.params.id, req.params.subjectId);
  res.json({ success: true, message: 'Subject removed from class successfully' });
});

export const getClassStatistics = asyncHandler(async (req: Request, res: Response) => {
  const svc = classService.forSchool(req.schoolId!) as any;
  const result = await svc.getClassStatistics(req.params.id);
  res.json({ success: true, data: result });
});

export const enrollStudentToClass = asyncHandler(async (req: Request, res: Response) => {
  const svc = classService.forSchool(req.schoolId!) as any;
  const result = await svc.enrollStudentToClass(req.params.id, req.body.studentId);
  res.status(201).json({ success: true, message: 'Student enrolled to class successfully', data: result });
});

export const bulkEnrollStudentsToClass = asyncHandler(async (req: Request, res: Response) => {
  const svc = classService.forSchool(req.schoolId!) as any;
  const result = await svc.bulkEnrollStudentsToClass(req.params.id, req.body.studentIds);
  res.status(201).json({ success: true, message: 'Students enrolled to class successfully', data: result });
});

export const transferStudent = asyncHandler(async (req: Request, res: Response) => {
  const svc = classService.forSchool(req.schoolId!) as any;
  const result = await svc.transferStudent(req.body.studentId, req.body.targetClassId);
  res.json({ success: true, message: 'Student transferred successfully', data: result });
});

export const getClassStudents = asyncHandler(async (req: Request, res: Response) => {
  const svc = classService.forSchool(req.schoolId!) as any;
  const result = await svc.getClassStudents(req.params.id);
  res.json({ success: true, data: result });
});

export const getClassSubjects = asyncHandler(async (req: Request, res: Response) => {
  const svc = classService.forSchool(req.schoolId!) as any;
  const result = await svc.getClassSubjects(req.params.id);
  res.json({ success: true, data: result });
});

export const getClassStats = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = req.schoolId!;
  const [totalRes, activeRes, capacityRes] = await Promise.all([
    query(
      `SELECT COUNT(*) AS total,
              COUNT(*) FILTER (WHERE is_active = true)  AS active,
              COUNT(*) FILTER (WHERE is_active = false) AS inactive
       FROM classes WHERE school_id = $1`,
      [schoolId]
    ),
    query(
      `SELECT c.name, COUNT(s.id) AS student_count, c.capacity
       FROM classes c
       LEFT JOIN students s ON s.class_id = c.id AND s.is_active = true
       WHERE c.school_id = $1 AND c.is_active = true
       GROUP BY c.id, c.name, c.capacity
       ORDER BY student_count DESC
       LIMIT 5`,
      [schoolId]
    ),
    query(
      `SELECT
         COALESCE(SUM(capacity), 0) AS total_capacity,
         COUNT(DISTINCT s.id) AS total_students
       FROM classes c
       LEFT JOIN students s ON s.class_id = c.id AND s.is_active = true
       WHERE c.school_id = $1 AND c.is_active = true`,
      [schoolId]
    ),
  ]);

  const r = totalRes.rows[0];
  const cap = capacityRes.rows[0];
  const totalCapacity = parseInt(cap.total_capacity, 10);
  const totalStudents = parseInt(cap.total_students, 10);

  res.json({
    success: true,
    data: {
      total: parseInt(r.total, 10),
      active: parseInt(r.active, 10),
      inactive: parseInt(r.inactive, 10),
      totalCapacity,
      totalStudents,
      occupancyRate: totalCapacity > 0 ? Math.round((totalStudents / totalCapacity) * 100) : 0,
      topClasses: activeRes.rows.map((row: any) => ({
        name: row.name,
        studentCount: parseInt(row.student_count, 10),
        capacity: parseInt(row.capacity, 10),
      })),
    },
  });
});

export const removeStudentFromClass = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = req.schoolId!;
  const { id: classId, studentId } = req.params;
  await query(
    `UPDATE students SET class_id = NULL
     WHERE id = $1 AND class_id = $2 AND school_id = $3`,
    [studentId, classId, schoolId]
  );
  res.json({ success: true, message: 'Student removed from class successfully' });
});
