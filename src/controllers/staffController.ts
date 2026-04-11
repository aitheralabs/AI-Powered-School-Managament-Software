import { Request, Response } from 'express';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { CreateStaffSchema, UpdateStaffSchema, StaffQuerySchema } from '../types/staff';
import { StaffService } from '../services/staffService';

const staffService = new StaffService();

export const createStaff = asyncHandler(async (req: Request, res: Response) => {
  if (req.user!.role !== 'admin') throw new AppError('Only administrators can create staff members', 403);
  const staffData = CreateStaffSchema.parse(req.body);
  const staff = await staffService.forSchool(req.schoolId!).createStaff(staffData, req.user!.id);
  res.status(201).json({ success: true, data: staff, message: 'Staff member created successfully' });
});

export const getStaff = asyncHandler(async (req: Request, res: Response) => {
  const queryParams = StaffQuerySchema.parse(req.query);
  const { staff, total } = await staffService.forSchool(req.schoolId!).getStaff(queryParams, req.user!.role, req.user!.id);
  res.json({
    success: true, data: staff,
    pagination: { page: queryParams.page, limit: queryParams.limit, total, pages: Math.ceil(total / queryParams.limit) }
  });
});

export const getStaffById = asyncHandler(async (req: Request, res: Response) => {
  const staff = await staffService.forSchool(req.schoolId!).getStaffById(req.params.id, req.user!.role, req.user!.id);
  res.json({ success: true, data: staff });
});

export const updateStaff = asyncHandler(async (req: Request, res: Response) => {
  const updateData = UpdateStaffSchema.parse(req.body);
  const updatedStaff = await staffService.forSchool(req.schoolId!).updateStaff(req.params.id, updateData, req.user!.role, req.user!.id);
  res.json({ success: true, data: updatedStaff, message: 'Staff member updated successfully' });
});

export const deactivateStaff = asyncHandler(async (req: Request, res: Response) => {
  if (req.user!.role !== 'admin') throw new AppError('Only administrators can deactivate staff members', 403);
  await staffService.forSchool(req.schoolId!).deactivateStaff(req.params.id);
  res.json({ success: true, message: 'Staff member deactivated successfully' });
});

export const reactivateStaff = asyncHandler(async (req: Request, res: Response) => {
  if (req.user!.role !== 'admin') throw new AppError('Only administrators can reactivate staff members', 403);
  const updatedStaff = await staffService.forSchool(req.schoolId!).reactivateStaff(req.params.id);
  res.json({ success: true, data: updatedStaff, message: 'Staff member reactivated successfully' });
});

export const getStaffSummary = asyncHandler(async (req: Request, res: Response) => {
  if (req.user!.role !== 'admin') throw new AppError('Only administrators can view staff summary', 403);
  const summary = await staffService.forSchool(req.schoolId!).getStaffSummary();
  res.json({ success: true, data: summary });
});
