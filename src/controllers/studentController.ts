import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { StudentService } from '../services/studentService';

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
