import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { TeacherService } from '../services/teacherService';
import { query } from '../database/connection';

const teacherService = new TeacherService();

export const createTeacher = asyncHandler(async (req: Request, res: Response) => {
  const teacher = await teacherService.forSchool(req.schoolId!).createTeacher(req.body);
  res.status(201).json({ success: true, message: 'Teacher profile created successfully', data: teacher });
});

export const getTeachers = asyncHandler(async (req: Request, res: Response) => {
  const result = await teacherService.forSchool(req.schoolId!).getTeachers(req);
  res.json({ success: true, data: result.teachers, pagination: result.pagination });
});

export const getTeacherById = asyncHandler(async (req: Request, res: Response) => {
  const teacher = await teacherService.forSchool(req.schoolId!).getTeacherById(req.params.id);
  res.json({ success: true, data: teacher });
});

export const updateTeacher = asyncHandler(async (req: Request, res: Response) => {
  const teacher = await teacherService.forSchool(req.schoolId!).updateTeacher(req.params.id, req.body);
  res.json({ success: true, message: 'Teacher profile updated successfully', data: teacher });
});

export const deleteTeacher = asyncHandler(async (req: Request, res: Response) => {
  await teacherService.forSchool(req.schoolId!).deleteTeacher(req.params.id);
  res.json({ success: true, message: 'Teacher deactivated successfully' });
});

// The following methods delegate to service methods that still need full school-scoped
// implementation. They pass schoolId via forSchool so the service can use it.

export const assignTeacherToSubject = asyncHandler(async (req: Request, res: Response) => {
  const { teacherId, subjectId } = req.body;
  const assignment = await (teacherService.forSchool(req.schoolId!) as any).assignTeacherToSubject(teacherId, subjectId);
  res.status(201).json({ success: true, message: 'Teacher assigned to subject successfully', data: assignment });
});

export const removeTeacherFromSubject = asyncHandler(async (req: Request, res: Response) => {
  const { teacherId, subjectId } = req.params;
  await (teacherService.forSchool(req.schoolId!) as any).removeTeacherFromSubject(teacherId, subjectId);
  res.json({ success: true, message: 'Teacher removed from subject successfully' });
});

export const assignTeacherToClass = asyncHandler(async (req: Request, res: Response) => {
  const { teacherId, classId } = req.body;
  const assignment = await (teacherService.forSchool(req.schoolId!) as any).assignTeacherToClass(teacherId, classId);
  res.json({ success: true, message: 'Teacher assigned to class successfully', data: assignment });
});

export const getTeacherWorkload = asyncHandler(async (req: Request, res: Response) => {
  const workload = await (teacherService.forSchool(req.schoolId!) as any).getTeacherWorkload(req.params.id);
  res.json({ success: true, data: workload });
});

export const removeTeacherFromClass = asyncHandler(async (req: Request, res: Response) => {
  await (teacherService.forSchool(req.schoolId!) as any).removeTeacherFromClass(req.params.classId);
  res.json({ success: true, message: 'Teacher removed from class successfully' });
});

export const assignTeacherToClassSubject = asyncHandler(async (req: Request, res: Response) => {
  const { teacherId, classId, subjectId } = req.body;
  const assignment = await (teacherService.forSchool(req.schoolId!) as any).assignTeacherToClassSubject(teacherId, classId, subjectId);
  res.status(201).json({ success: true, message: 'Teacher assigned to class-subject successfully', data: assignment });
});

export const removeTeacherFromClassSubject = asyncHandler(async (req: Request, res: Response) => {
  const { classId, subjectId } = req.params;
  await (teacherService.forSchool(req.schoolId!) as any).removeTeacherFromClassSubject(classId, subjectId);
  res.json({ success: true, message: 'Teacher removed from class-subject assignment successfully' });
});

export const getAllTeacherAssignments = asyncHandler(async (req: Request, res: Response) => {
  const result = await (teacherService.forSchool(req.schoolId!) as any).getAllTeacherAssignments(req);
  res.json({ success: true, data: result.assignments, pagination: result.pagination });
});

export const checkAssignmentConflicts = asyncHandler(async (req: Request, res: Response) => {
  const { teacherId, classId, subjectId } = req.body;
  const conflicts = await (teacherService.forSchool(req.schoolId!) as any).checkAssignmentConflicts(teacherId, classId, subjectId);
  res.json({ success: true, data: conflicts });
});

export const getOptimalTeacherSuggestions = asyncHandler(async (req: Request, res: Response) => {
  const { classId, subjectId } = req.params;
  const suggestions = await (teacherService.forSchool(req.schoolId!) as any).getOptimalTeacherSuggestions(classId, subjectId);
  res.json({ success: true, data: suggestions });
});

export const getTeacherStats = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = req.schoolId!;
  const [totalRes, specializationRes, classLoadRes] = await Promise.all([
    query(
      `SELECT COUNT(*) AS total,
              COUNT(*) FILTER (WHERE is_active = true) AS active,
              COUNT(*) FILTER (WHERE is_active = false) AS inactive
       FROM teachers WHERE school_id = $1`,
      [schoolId]
    ),
    query(
      `SELECT specialization AS spec, COUNT(*) AS count
       FROM teachers
       WHERE school_id = $1 AND is_active = true AND specialization IS NOT NULL AND specialization <> ''
       GROUP BY specialization ORDER BY count DESC LIMIT 5`,
      [schoolId]
    ),
    query(
      `SELECT AVG(class_count) AS avg_classes FROM (
         SELECT COUNT(c.id) AS class_count
         FROM teachers t
         LEFT JOIN classes c ON c.teacher_id = t.id AND c.is_active = true
         WHERE t.school_id = $1 AND t.is_active = true
         GROUP BY t.id
       ) sub`,
      [schoolId]
    ),
  ]);

  res.json({
    success: true,
    data: {
      total: parseInt(totalRes.rows[0].total, 10),
      active: parseInt(totalRes.rows[0].active, 10),
      inactive: parseInt(totalRes.rows[0].inactive, 10),
      avgClassLoad: parseFloat(classLoadRes.rows[0].avg_classes ?? '0').toFixed(1),
      bySpecialization: specializationRes.rows.map((r: any) => ({ spec: r.spec, count: parseInt(r.count, 10) })),
    },
  });
});

export const getTeacherClasses = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = req.schoolId!;
  const { id } = req.params;
  const result = await query(
    `SELECT c.id, c.name, c.grade_level, c.section,
            COUNT(DISTINCT s.id) AS student_count
     FROM classes c
     LEFT JOIN students s ON s.class_id = c.id AND s.is_active = true
     WHERE c.teacher_id = $1 AND c.school_id = $2 AND c.is_active = true
     GROUP BY c.id, c.name, c.grade_level, c.section`,
    [id, schoolId]
  );
  res.json({ success: true, data: result.rows });
});

export const getTeacherSubjects = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = req.schoolId!;
  const { id } = req.params;
  const result = await query(
    `SELECT s.id, s.name, s.code, s.description
     FROM teacher_subjects ts
     JOIN subjects s ON s.id = ts.subject_id
     WHERE ts.teacher_id = $1 AND s.school_id = $2 AND s.is_active = true`,
    [id, schoolId]
  );
  res.json({ success: true, data: result.rows });
});

export const exportTeachers = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = req.schoolId!;
  const format = (req.query.format as string) || 'csv';

  const result = await query(
    `SELECT t.id, u.first_name, u.last_name, u.email, u.phone, t.employee_id,
            t.specialization, t.qualification, t.experience_years,
            t.is_active, t.joining_date, u.created_at
     FROM teachers t
     JOIN users u ON u.id = t.user_id
     WHERE t.school_id = $1
     ORDER BY u.first_name, u.last_name`,
    [schoolId]
  );

  const rows = result.rows;

  if (format === 'csv') {
    const headers = ['ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Employee ID',
                     'Specialization', 'Qualification', 'Experience (Years)',
                     'Active', 'Joining Date', 'Created At'];
    const csvRows = rows.map((r: any) => [
      r.id, r.first_name, r.last_name, r.email || '', r.phone || '', r.employee_id || '',
      `"${(r.specialization || '').replace(/"/g, '""')}"`,
      `"${(r.qualification || '').replace(/"/g, '""')}"`,
      r.experience_years || 0,
      r.is_active ? 'Yes' : 'No',
      r.joining_date ? new Date(r.joining_date).toISOString().split('T')[0] : '',
      new Date(r.created_at).toISOString().split('T')[0],
    ].join(','));

    const csv = [headers.join(','), ...csvRows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="teachers.csv"');
    res.send(csv);
  } else {
    res.json({ success: true, data: rows });
  }
});
