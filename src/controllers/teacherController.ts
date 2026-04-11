import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { TeacherService } from '../services/teacherService';

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
