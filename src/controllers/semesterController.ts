import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { SemesterService } from '../services/semesterService';

const semesterService = new SemesterService();

export const createSemester = asyncHandler(async (req: Request, res: Response) => {
  const semester = await semesterService.forSchool(req.schoolId!).createSemester(req.body);
  res.status(201).json({ success: true, message: 'Semester created successfully', data: { semester } });
});

export const getSemesters = asyncHandler(async (req: Request, res: Response) => {
  const result = await semesterService.forSchool(req.schoolId!).getSemesters(req);
  res.json({ success: true, data: result });
});

export const getSemesterById = asyncHandler(async (req: Request, res: Response) => {
  const semester = await semesterService.forSchool(req.schoolId!).getSemesterById(req.params.id);
  res.json({ success: true, data: { semester } });
});

export const updateSemester = asyncHandler(async (req: Request, res: Response) => {
  const semester = await semesterService.forSchool(req.schoolId!).updateSemester(req.params.id, req.body);
  res.json({ success: true, message: 'Semester updated successfully', data: { semester } });
});

export const deleteSemester = asyncHandler(async (req: Request, res: Response) => {
  await semesterService.forSchool(req.schoolId!).deleteSemester(req.params.id);
  res.json({ success: true, message: 'Semester deleted successfully' });
});

export const getCurrentSemester = asyncHandler(async (req: Request, res: Response) => {
  const semester = await semesterService.forSchool(req.schoolId!).getActiveSemester();
  res.json({ success: true, data: { semester } });
});
