import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { FeeService } from '../services/feeService';

const feeService = new FeeService();

export const createFeeCategory = asyncHandler(async (req: Request, res: Response) => {
  const feeCategory = await feeService.forSchool(req.schoolId!).createFeeCategory(req.body);
  res.status(201).json({ success: true, message: 'Fee category created successfully', data: feeCategory });
});

export const getFeeCategories = asyncHandler(async (req: Request, res: Response) => {
  const result = await feeService.forSchool(req.schoolId!).getFeeCategories(req);
  res.json({ success: true, data: result.feeCategories, pagination: result.pagination });
});

export const getFeeCategoryById = asyncHandler(async (req: Request, res: Response) => {
  const feeCategory = await feeService.forSchool(req.schoolId!).getFeeCategoryById(req.params.id);
  res.json({ success: true, data: feeCategory });
});

export const updateFeeCategory = asyncHandler(async (req: Request, res: Response) => {
  const feeCategory = await feeService.forSchool(req.schoolId!).updateFeeCategory(req.params.id, req.body);
  res.json({ success: true, message: 'Fee category updated successfully', data: feeCategory });
});

export const deleteFeeCategory = asyncHandler(async (req: Request, res: Response) => {
  await feeService.forSchool(req.schoolId!).deleteFeeCategory(req.params.id);
  res.json({ success: true, message: 'Fee category deleted successfully' });
});

export const assignFeesToStudents = asyncHandler(async (req: Request, res: Response) => {
  const result = await feeService.forSchool(req.schoolId!).assignFeesToStudents(req.body);
  res.status(201).json({ success: true, message: 'Fees assigned to students successfully', data: result });
});

export const getStudentFees = asyncHandler(async (req: Request, res: Response) => {
  const result = await feeService.forSchool(req.schoolId!).getStudentFees(req);
  res.json({ success: true, data: result.studentFees, pagination: result.pagination });
});

export const assignFeesToClass = asyncHandler(async (req: Request, res: Response) => {
  const result = await feeService.forSchool(req.schoolId!).assignFeesToClass(req.body);
  res.status(201).json({ success: true, message: 'Fees assigned to class successfully', data: result });
});

export const getStudentFeeById = asyncHandler(async (req: Request, res: Response) => {
  const fee = await feeService.forSchool(req.schoolId!).getStudentFeeById(req.params.id);
  res.json({ success: true, data: fee });
});

export const updateStudentFee = asyncHandler(async (req: Request, res: Response) => {
  const fee = await feeService.forSchool(req.schoolId!).updateStudentFee(req.params.id, req.body);
  res.json({ success: true, message: 'Student fee updated successfully', data: fee });
});
