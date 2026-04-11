import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { AcademicYearService } from '../services/academicYearService';

const academicYearService = new AcademicYearService();

export const createAcademicYear = asyncHandler(async (req: Request, res: Response) => {
  const academicYear = await academicYearService.forSchool(req.schoolId!).createAcademicYear(req.body);
  res.status(201).json({ success: true, message: 'Academic year created successfully', data: { academicYear } });
});

export const getAcademicYears = asyncHandler(async (req: Request, res: Response) => {
  const result = await academicYearService.forSchool(req.schoolId!).getAcademicYears(req);
  res.json({ success: true, data: { academicYears: result.academicYears, pagination: result.pagination } });
});

export const getAcademicYearById = asyncHandler(async (req: Request, res: Response) => {
  const academicYear = await academicYearService.forSchool(req.schoolId!).getAcademicYearById(req.params.id);
  res.json({ success: true, data: { academicYear } });
});

export const updateAcademicYear = asyncHandler(async (req: Request, res: Response) => {
  const academicYear = await academicYearService.forSchool(req.schoolId!).updateAcademicYear(req.params.id, req.body);
  res.json({ success: true, message: 'Academic year updated successfully', data: { academicYear } });
});

export const deleteAcademicYear = asyncHandler(async (req: Request, res: Response) => {
  await academicYearService.forSchool(req.schoolId!).deleteAcademicYear(req.params.id);
  res.json({ success: true, message: 'Academic year deleted successfully' });
});

export const getActiveAcademicYear = asyncHandler(async (req: Request, res: Response) => {
  const academicYear = await academicYearService.forSchool(req.schoolId!).getActiveAcademicYear();
  res.json({ success: true, data: { academicYear } });
});
