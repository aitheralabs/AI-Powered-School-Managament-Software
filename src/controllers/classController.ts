/**
 * Class Controller — tenant-scoped via forSchool()
 */
import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { ClassService } from '../services/classService';

const classService = new ClassService();

export const createClass = asyncHandler(async (req: Request, res: Response) => {
  const classInfo = await classService.forSchool(req.schoolId!).createClass(req.body);
  res.status(201).json({ success: true, message: 'Class created successfully', data: { class: classInfo } });
});

export const getClasses = asyncHandler(async (req: Request, res: Response) => {
  const result = await classService.forSchool(req.schoolId!).getClasses(req);
  res.json({ success: true, data: result });
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
