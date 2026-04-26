import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { PaymentService } from '../services/paymentService';

const paymentService = new PaymentService();

export const recordPayment = asyncHandler(async (req: Request, res: Response) => {
  const payment = await paymentService.forSchool(req.schoolId!).recordPayment(req.body, req.user!.id);
  res.status(201).json({ success: true, message: 'Payment recorded successfully', data: { payment } });
});

export const getPayments = asyncHandler(async (req: Request, res: Response) => {
  const result = await paymentService.forSchool(req.schoolId!).getPayments(req);
  res.json({ success: true, data: result });
});

export const getPaymentById = asyncHandler(async (req: Request, res: Response) => {
  const payment = await paymentService.forSchool(req.schoolId!).getPaymentById(req.params.id);
  res.json({ success: true, data: payment });
});

export const getPaymentSummary = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  const summary = await paymentService.forSchool(req.schoolId!).getPaymentSummary(
    startDate as string, endDate as string
  );
  res.json({ success: true, data: summary });
});

export const getPaymentStatistics = getPaymentSummary;

export const reversePayment = asyncHandler(async (req: Request, res: Response) => {
  const { reason } = req.body;
  const result = await paymentService.forSchool(req.schoolId!).reversePayment(
    req.params.id, reason || 'No reason provided', req.user!.id
  );
  res.json({ success: true, message: 'Payment reversed successfully', data: result });
});

export const getPaymentHistory = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params;
  const history = await paymentService.forSchool(req.schoolId!).getPaymentHistory(studentId);
  res.json({ success: true, data: history });
});

export const getPaymentReceipt = asyncHandler(async (req: Request, res: Response) => {
  const receipt = await paymentService.forSchool(req.schoolId!).getPaymentReceipt(req.params.id);
  res.json({ success: true, data: receipt });
});
