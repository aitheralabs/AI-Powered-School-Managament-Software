import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { SubjectService } from '../services/subjectService';

const subjectService = new SubjectService();

export const createSubject = asyncHandler(async (req: Request, res: Response) => {
  const subject = await subjectService.forSchool(req.schoolId!).createSubject(req.body);
  res.status(201).json({ success: true, message: 'Subject created successfully', data: { subject } });
});

export const getSubjects = asyncHandler(async (req: Request, res: Response) => {
  const result = await subjectService.forSchool(req.schoolId!).getSubjects(req);
  res.json({ success: true, data: result });
});

export const getSubjectById = asyncHandler(async (req: Request, res: Response) => {
  const subject = await subjectService.forSchool(req.schoolId!).getSubjectById(req.params.id);
  res.json({ success: true, data: { subject } });
});

export const updateSubject = asyncHandler(async (req: Request, res: Response) => {
  const subject = await subjectService.forSchool(req.schoolId!).updateSubject(req.params.id, req.body);
  res.json({ success: true, message: 'Subject updated successfully', data: { subject } });
});

export const deleteSubject = asyncHandler(async (req: Request, res: Response) => {
  await subjectService.forSchool(req.schoolId!).deleteSubject(req.params.id);
  res.json({ success: true, message: 'Subject deleted successfully' });
});

export const toggleSubjectStatus = asyncHandler(async (req: Request, res: Response) => {
  const { isActive } = req.body;
  const subject = await subjectService.forSchool(req.schoolId!).toggleSubjectStatus(req.params.id, isActive);
  res.json({ success: true, message: `Subject ${isActive ? 'activated' : 'deactivated'} successfully`, data: { subject } });
});

export const getSubjectStatistics = asyncHandler(async (req: Request, res: Response) => {
  const result = await subjectService.forSchool(req.schoolId!).getSubjectStatistics(req.params.id);
  res.json({ success: true, data: result });
});
